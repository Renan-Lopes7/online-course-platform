"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { Lesson, lessonService } from "@/lib/api";
import { useSession } from "@/components/session-provider";
import { VideasPlayer } from "@/components/videas-player";

function LessonsContent() {
  const { courseId: rawId } = useParams<{ courseId: string }>();
  const courseId = Number(rawId);
  const { session } = useSession();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = session?.token;
    if (!token) return;
    let active = true;
    setLessons(null);
    setSelected(null);
    setError("");

    lessonService.list(courseId, token)
      .then(items => {
        if (!active) return;
        setLessons(items);
        setSelected(items[0] ?? null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const message = reason instanceof Error ? reason.message : "Não foi possível carregar as aulas.";
        setError(message.includes("Acesso não autorizado")
          ? "As aulas deste curso são liberadas após a confirmação do pagamento. Consulte sua compra na Área do Aluno."
          : message);
      });

    return () => { active = false; };
  }, [courseId, session?.token]);

  return <>
    <SiteHeader showHomeLink />
    <main className="page-shell lessons-shell">
      <div className="section-heading page-title"><h1>AULAS</h1></div>
      {error ? <div className="state-card" role="alert"><p>{error}</p></div>
        : lessons === null ? <div className="state-card"><span className="loader" /><p>VALIDANDO ACESSO E CARREGANDO AULAS</p></div>
          : lessons.length === 0 ? <div className="state-card"><p>Este curso ainda não tem aulas cadastradas.</p></div>
            : <div className="lesson-layout">
              <section className="player-column">
                <div className="player-frame">
                  {selected && session && <VideasPlayer key={selected.id} lessonId={selected.id} token={session.token} />}
                  <div className="player-caption"><span>{selected?.title ?? "Selecione uma aula"}</span></div>
                </div>
              </section>
              <aside className="lesson-sidebar">
                <p className="eyebrow">CONTEÚDO DO CURSO</p>
                <div className="lesson-list">{lessons.map((lesson, index) => <button key={lesson.id} type="button" className={`lesson-item ${selected?.id === lesson.id ? "active" : ""}`} onClick={() => setSelected(lesson)}>
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{lesson.title}</strong><i>{selected?.id === lesson.id ? "EM EXIBIÇÃO" : "AULA"}</i>
                </button>)}</div>
              </aside>
            </div>}
    </main>
  </>;
}

export default function LessonsPage() {
  return <RequireSession><LessonsContent /></RequireSession>;
}
