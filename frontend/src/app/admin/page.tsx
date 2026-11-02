"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { adminService, Course, getCourses } from "@/lib/api";
import { useSession } from "@/components/session-provider";
import { uploadToVideas } from "@/lib/videas-upload";

function AdminContent() {
  const { session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lessonStep, setLessonStep] = useState<"session" | "upload" | "create" | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{ signature: string; assetId: string } | null>(null);
  const lessonSubmitLock = useRef(false);
  const reload = useCallback(async () => {
    try { const list = await getCourses(); setCourses(list); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao carregar cursos."); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(message); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir a operação."); }
    finally { setBusy(false); }
  }
  function courseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session) return;
    const form = new FormData(event.currentTarget);
    const data = { title: String(form.get("title")), description: String(form.get("description")), price: Number(form.get("price")) };
    void run(() => adminService.createCourse(data, session.token), "Curso criado com sucesso.");
  }
  async function lessonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || busy || lessonSubmitLock.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const courseId = Number(form.get("courseId"));
    const title = String(form.get("lessonTitle")).trim();
    const file = videoFile;
    if (!file) {
      setError("Selecione um arquivo de vídeo para criar a aula.");
      return;
    }
    if (file.size <= 0 || file.size > 10 * 1024 * 1024 * 1024) {
      setError("Selecione um vídeo válido com tamanho de até 10 GB.");
      return;
    }

    const signature = `${file.name}:${file.size}:${file.lastModified}`;
    lessonSubmitLock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let assetId = uploadedVideo?.signature === signature ? uploadedVideo.assetId : "";
      if (!assetId) {
        setLessonStep("session");
        setUploadProgress(0);
        const uploadSession = await adminService.createVideasUploadSession(
          { filename: file.name, size: file.size },
          session.token,
        );
        setLessonStep("upload");
        assetId = await uploadToVideas(file, uploadSession, setUploadProgress);
        setUploadedVideo({ signature, assetId });
      }

      setLessonStep("create");
      const existingLessons = await adminService.listCourseLessons(courseId, session.token);
      const duplicate = existingLessons.some(lesson => lesson.title === title && lesson.videoId === assetId);
      if (duplicate) {
        setNotice("Esta aula já está cadastrada neste curso.");
      } else {
        await adminService.createLesson(courseId, { title, videoId: assetId }, session.token);
        setNotice("Aula criada com sucesso.");
      }
      formElement.reset();
      setVideoFile(null);
      setUploadedVideo(null);
      setUploadProgress(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o vídeo e criar a aula. Tente novamente.");
    } finally {
      lessonSubmitLock.current = false;
      setLessonStep(null);
      setBusy(false);
    }
  }
  function formatFileSize(size: number) {
    if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / 1024).toFixed(0)} KB`;
  }
  const lessonButtonLabel = lessonStep === "session"
    ? "PREPARANDO ENVIO..."
    : lessonStep === "upload"
      ? `ENVIANDO VÍDEO ${uploadProgress}%`
      : lessonStep === "create"
        ? "CADASTRANDO AULA..."
        : "CRIAR AULA";
  return <><SiteHeader showHomeLink /><main className="page-shell admin-shell">{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="success-note" role="status">{notice}</p>}
    <div className="admin-grid"><section className="admin-panel admin-create-course-panel"><p className="eyebrow">CURSOS</p><div className="admin-panel-heading"><h1>CRIAR <span>CURSO</span></h1><p>Preencha as informações abaixo para cadastrar um novo curso.</p></div><form className="form-panel admin-form" onSubmit={courseSubmit}><label>Título<input name="title" required maxLength={150} /></label><label>Descrição<textarea name="description" required maxLength={2000} rows={4} /></label><label>Preço em reais<input name="price" type="number" required min="0.01" step="0.01" /></label><button className="button form-submit editorial-action admin-course-create-button" disabled={busy}>{busy ? "SALVANDO..." : "CRIAR CURSO"}</button></form></section>
    <section className="admin-panel admin-create-lesson-panel"><p className="eyebrow">AULAS</p><div className="admin-panel-heading"><h1>CRIAR <span>AULA</span></h1><p>Adicione uma nova aula ao curso selecionado.</p></div><form className="form-panel admin-form" onSubmit={lessonSubmit}><label>Curso<select className="admin-course-select" name="courseId" required defaultValue="" disabled={busy}>{courses.length === 0 && <option value="" disabled>Carregando cursos</option>}{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Título da aula<input name="lessonTitle" required maxLength={150} disabled={busy} /></label>
      <div className="videas-upload"><label htmlFor="videas-video-file">Arquivo de vídeo</label><input id="videas-video-file" name="videoFile" type="file" accept="video/*" required disabled={busy} onChange={event => { setVideoFile(event.currentTarget.files?.[0] ?? null); setUploadedVideo(null); setUploadProgress(0); setError(""); setNotice(""); }} />{videoFile && <p className="videas-file-meta">{videoFile.name} · {formatFileSize(videoFile.size)}</p>}{lessonStep === "upload" && <div className="upload-progress" role="progressbar" aria-label="Progresso do envio do vídeo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}><span style={{ width: `${uploadProgress}%` }} /></div>}{uploadedVideo && <p className="videas-file-meta" role="status">Vídeo enviado. Finalize o cadastro da aula.</p>}</div>
      <button className="button form-submit editorial-action admin-lesson-create-button" disabled={busy || !courses.length}>{busy ? lessonButtonLabel : "CRIAR AULA"}</button></form></section></div>
  </main></>;
}

export default function AdminPage() { return <RequireSession admin><AdminContent /></RequireSession>; }
