"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "@/components/session-provider";
import { adminService, Course, formatPrice, Lesson } from "@/lib/api";
import { VideasPlayer } from "@/components/videas-player";

export function CourseDetail({ initialCourse }: { initialCourse: Course }) {
  const { session, ready } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [lessonListError, setLessonListError] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditingLessonTitle, setIsEditingLessonTitle] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [lessonNotice, setLessonNotice] = useState("");
  const [lessonRemovalNotice, setLessonRemovalNotice] = useState("");
  const [lessonFormVersion, setLessonFormVersion] = useState(0);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);
  const lessonRequestId = useRef(0);
  const isAdmin = session?.role === "ADMIN";



  const loadLessons = useCallback(
    async (showLoading: boolean) => {
      const token = session?.token;
      if (!token) return;
      if (showLoading) setLessons(null);
      setLessonListError("");
      try {
        const items = await adminService.listCourseLessons(course.id, token);
        setLessons(items.filter((item) => item.cursoId === course.id));
      } catch (reason) {
        setLessonListError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar as aulas.",
        );
        if (showLoading) setLessons([]);
      }
    },
    [course.id, session?.token],
  );

  useEffect(() => {
    if (ready && isAdmin && session) void loadLessons(true);
  }, [ready, isAdmin, session, loadLessons]);

  async function updateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !isAdmin) return;

    const form = new FormData(event.currentTarget);
    const data = {
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      price: Number(form.get("price")),
    };

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await adminService.updateCourse(
        course.id,
        data,
        session.token,
      );
      setCourse(updated);
      setFormVersion((version) => version + 1);
      setNotice("Alterações do curso salvas.");
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar as alterações. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  function selectLesson(lesson: Lesson) {
    if (!session || !isAdmin || lesson.cursoId !== course.id) return;

    // A lista já contém os dados necessários para selecionar e reproduzir a aula.
    // Evita uma segunda requisição ao endpoint administrativo ao clicar em EDITAR AULA.
    lessonRequestId.current += 1;
    setSelectedLessonId(lesson.id);
    setEditingLesson(lesson);
    setIsEditingLessonTitle(false);
    setLoadingLesson(false);
    setLessonError("");
    setLessonNotice("");
  }

  function cancelLessonEdit() {
    // Cancela somente a edição do título; mantém a aula selecionada e o player montado.
    if (!editingLesson) setSelectedLessonId(null);
    setIsEditingLessonTitle(false);
    setLoadingLesson(false);
    setLessonError("");
    setLessonNotice("");
  }

  async function updateLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !session ||
      !isAdmin ||
      !editingLesson ||
      editingLesson.cursoId !== course.id
    )
      return;

    const form = new FormData(event.currentTarget);
    const data = {
      title: String(form.get("lessonTitle")).trim(),
    };

    setSavingLesson(true);
    setLessonError("");
    setLessonNotice("");
    try {
      const updated = await adminService.updateLesson(
        editingLesson.id,
        data,
        session.token,
      );
      setEditingLesson(updated);
      setIsEditingLessonTitle(false);
      setLessons(
        (current) =>
          current?.map((item) => (item.id === updated.id ? updated : item)) ??
          current,
      );
      setLessonFormVersion((version) => version + 1);
      setLessonNotice("Aula atualizada com sucesso.");
      try {
        const items = await adminService.listCourseLessons(
          course.id,
          session.token,
        );
        setLessons(items.filter((item) => item.cursoId === course.id));
        setLessonListError("");
      } catch (reason) {
        setLessonListError(
          reason instanceof Error
            ? reason.message
            : "A aula foi salva, mas não foi possível atualizar a lista.",
        );
      }
    } catch (reason) {
      setLessonError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar as alterações da aula.",
      );
    } finally {
      setSavingLesson(false);
    }
  }

  async function deleteLesson() {
    if (
      !session ||
      !isAdmin ||
      !lessonToDelete ||
      lessonToDelete.cursoId !== course.id
    )
      return;
    setDeletingLesson(true);
    setLessonError("");
    setLessonRemovalNotice("");
    try {
      await adminService.deleteLesson(lessonToDelete.id, session.token);
      setLessons(
        (current) =>
          current?.filter((item) => item.id !== lessonToDelete.id) ?? current,
      );
      if (selectedLessonId === lessonToDelete.id) {
        setSelectedLessonId(null);
        setEditingLesson(null);
        setIsEditingLessonTitle(false);
      }
      setLessonRemovalNotice("Aula removida do curso.");
      setLessonToDelete(null);
    } catch (reason) {
      setLessonError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover esta aula.",
      );
    } finally {
      setDeletingLesson(false);
    }
  }

  if (!ready)
    return (
      <main className="page-shell detail-shell">
        <div className="state-card">
          <span className="loader" />
          <p>CARREGANDO CURSO</p>
        </div>
      </main>
    );

  return (
    <main className="page-shell detail-shell">
      <h1 className="detail-title">{course.title}</h1>
      <div className="detail-grid">
        <div className={`detail-art${isAdmin ? " admin-course-cover" : ""}`}>
          <Image
            src="/images/stone-course-banner.png"
            alt="Capa oficial STONE"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 32vw"
          />
        </div>
        {isAdmin ? (
          <section className="detail-info admin-course-edit">
            <p className="eyebrow">EDITAR CURSO</p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="success-note" role="status">
                {notice}
              </p>
            )}
            <form
              className="form-panel admin-form course-edit-form"
              onSubmit={updateCourse}
              key={formVersion}
            >
              <label>
                Título
                <input
                  name="title"
                  defaultValue={course.title}
                  required
                  maxLength={150}
                />
              </label>
              <label>
                Descrição
                <textarea
                  name="description"
                  defaultValue={course.description}
                  required
                  maxLength={2000}
                  rows={5}
                />
              </label>
              <label>
                Preço
                <input
                  name="price"
                  type="number"
                  defaultValue={course.price}
                  required
                  min="0.01"
                  step="0.01"
                />
              </label>
              <button
                className="profile-edit-button admin-course-save-button editorial-action"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  "SALVANDO..."
                ) : (
                  <>
                    SALVAR <span>ALTERAÇÕES</span>
                  </>
                )}
              </button>
            </form>
          </section>
        ) : (
          <div className="detail-info">
            <p className="eyebrow">SOBRE O CURSO</p>
            <p className="detail-description">{course.description}</p>
            <div className="detail-price">
              <span>PREÇO</span>
              <strong>{formatPrice(course.price)}</strong>
            </div>
            <a
              className="button checkout-button editorial-action"
              href={`/matricula/${course.id}`}
            >
              COMPRAR <span>↗</span>
            </a>
          </div>
        )}
      </div>

      {isAdmin && (
        <section
          className="admin-lesson-management"
          aria-labelledby="admin-lessons-title"
        >
          <div className="admin-lesson-heading">
            <p className="eyebrow">CONTEÚDO DO CURSO</p>
            <h2 id="admin-lessons-title">AULAS</h2>
          </div>
          {lessonRemovalNotice && (
            <p className="success-note" role="status">
              {lessonRemovalNotice}
            </p>
          )}
          {lessonListError && (
            <div className="form-error admin-lesson-list-error" role="alert">
              <p>{lessonListError}</p>
              <button
                className="text-button"
                type="button"
                onClick={() => void loadLessons(true)}
              >
                TENTAR NOVAMENTE <span>↗</span>
              </button>
            </div>
          )}
          {lessons === null ? (
            <div className="state-card admin-lesson-state">
              <span className="loader" />
              <p>CARREGANDO AULAS</p>
            </div>
          ) : lessons.length === 0 && !lessonListError ? (
            <div className="state-card admin-lesson-state">
              <p>Este curso ainda não tem aulas cadastradas.</p>
            </div>
          ) : (
            lessons.length > 0 && (
              <div className="admin-lesson-grid">
                <section className="admin-lesson-editor" aria-live="polite">
                  {loadingLesson ? (
                    <div className="state-card">
                      <span className="loader" />
                      <p>CARREGANDO AULA</p>
                    </div>
                  ) : selectedLessonId !== null &&
                    lessonError &&
                    !editingLesson ? (
                    <div className="admin-lesson-load-error">
                      <p className="form-error" role="alert">
                        {lessonError}
                      </p>
                      <div className="admin-lesson-form-actions">
                        <button
                          className="profile-edit-button"
                          type="button"
                          onClick={() => {
                            const selectedLesson = lessons?.find(
                              (item) => item.id === selectedLessonId,
                            );
                            if (selectedLesson) selectLesson(selectedLesson);
                          }}
                        >
                          TENTAR NOVAMENTE
                        </button>
                        <button
                          className="admin-lesson-cancel"
                          type="button"
                          onClick={cancelLessonEdit}
                        >
                          CANCELAR
                        </button>
                      </div>
                    </div>
                  ) : editingLesson ? (
                    <>
                      <p className="eyebrow">AULA SELECIONADA</p>
                      {isEditingLessonTitle ? <form
                        className="form-panel admin-form course-edit-form admin-lesson-edit-form"
                        onSubmit={updateLesson}
                        key={lessonFormVersion}
                      >
                        <label>
                          Título da aula
                          <input
                            name="lessonTitle"
                            defaultValue={editingLesson.title}
                            placeholder="Novo título para a aula"
                            required
                            maxLength={150}
                          />
                        </label>
                        <div className="admin-lesson-form-actions">
                          <button
                            className="profile-edit-button course-admin-action"
                            type="submit"
                            disabled={savingLesson}
                          >
                            {savingLesson ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                          </button>
                          <button
                            className="admin-lesson-cancel course-admin-action"
                            type="button"
                            onClick={cancelLessonEdit}
                            disabled={savingLesson}
                          >
                            CANCELAR
                          </button>
                        </div>
                        {lessonError && (
                          <p className="form-error" role="alert">
                            {lessonError}
                          </p>
                        )}
                        {lessonNotice && (
                          <p className="success-note" role="status">
                            {lessonNotice}
                          </p>
                        )}
                      </form> : <div className="admin-lesson-preview">
                        <div className="admin-lesson-preview-heading"><h3>{editingLesson.title}</h3><button className="profile-edit-button course-admin-action" type="button" onClick={() => setIsEditingLessonTitle(true)}>EDITAR TÍTULO</button></div>
                      </div>}
                      {session && <div className="player-frame admin-lesson-video-frame"><VideasPlayer lessonId={editingLesson.id} token={session.token} admin /></div>}
                    </>
                  ) : (
                    <div className="state-card">
                      <p>Selecione uma aula para editar.</p>
                    </div>
                  )}
                </section>
                <div className="admin-lesson-list">
                  <p className="eyebrow admin-lesson-list-heading">
                    AULAS DO CURSO
                  </p>
                  {lessons.map((lesson) => (
                    <article className="admin-lesson-row" key={lesson.id}>
                      <div>
                        <span className="eyebrow">AULA</span>
                        <h3>{lesson.title}</h3>
                      </div>
                      <div className="admin-lesson-row-actions">
                        <button
                          className="profile-edit-button course-admin-action"
                          type="button"
                          onClick={() => selectLesson(lesson)}
                        >
                          EDITAR AULA
                        </button>
                        <button
                          className="danger-button admin-lesson-delete course-admin-action"
                          type="button"
                          onClick={() => {
                            setLessonError("");
                            setLessonRemovalNotice("");
                            setLessonToDelete(lesson);
                          }}
                          disabled={deletingLesson}
                        >
                          EXCLUIR AULA
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          )}
        </section>
      )}
      {lessonToDelete && (
        <div
          className="lesson-delete-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingLesson)
              setLessonToDelete(null);
          }}
        >
          <section
            className="lesson-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="lesson-delete-title"
            aria-describedby="lesson-delete-description"
          >
            <p className="eyebrow">CONFIRMAÇÃO</p>
            <h2 id="lesson-delete-title">Remover aula?</h2>
            <p id="lesson-delete-description">
              A aula <strong>{lessonToDelete.title}</strong> será removida deste
              curso. O arquivo de vídeo continuará na biblioteca do Videas.
            </p>
            {lessonError && (
              <p className="form-error" role="alert">
                {lessonError}
              </p>
            )}
            <div className="admin-lesson-form-actions">
              <button
                className="danger-button admin-lesson-delete-confirm"
                type="button"
                onClick={() => void deleteLesson()}
                disabled={deletingLesson}
              >
                {deletingLesson ? "REMOVENDO..." : "REMOVER AULA"}
              </button>
              <button
                className="admin-lesson-cancel"
                type="button"
                onClick={() => setLessonToDelete(null)}
                disabled={deletingLesson}
              >
                CANCELAR
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
