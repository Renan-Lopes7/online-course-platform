"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { Course, Purchase, formatPrice, getCourses, purchaseService } from "@/lib/api";
import { useSession } from "@/components/session-provider";

function StudentContent() {
  const { session } = useSession();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [courseTitles, setCourseTitles] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const load = useCallback(() => {
    if (!session) return;
    setRefreshing(true);
    setError("");
    Promise.all([purchaseService.list(session.token), getCourses().catch((): Course[] => [])]).then(([items, courses]) => {
      setPurchases(items.filter(item => item.status !== "CANCELADO"));
      setCourseTitles(Object.fromEntries(courses.map(course => [course.id, course.title])));
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Falha ao carregar as compras.")).finally(() => setRefreshing(false));
  }, [session]);
  async function cancelPurchase(purchaseId: number) {
    if (!session) return;
    setCancelingId(purchaseId);
    setCancelError("");
    try {
      await purchaseService.cancel(purchaseId, session.token);
      const items = await purchaseService.list(session.token);
      setPurchases(items.filter(item => item.status !== "CANCELADO"));
    } catch (reason) {
      setCancelError(reason instanceof Error ? reason.message : "Não foi possível cancelar a compra.");
    } finally {
      setCancelingId(null);
    }
  }
  useEffect(load, [load]);

  return <><SiteHeader showHomeLink showStudentLink /><main className="page-shell"><div className="section-heading page-title student-page-title"><h1>MINHA ÁREA</h1><div className="student-heading-meta"><Link className="profile-edit-button" href="/perfil">EDITAR PERFIL</Link><span>COMPRAS E ACESSOS</span></div></div><div className="student-toolbar student-toolbar-refresh"><button className="text-button refresh-button" onClick={load} disabled={refreshing} aria-live="polite" aria-label={refreshing ? "Atualizando compras" : "Atualizar compras e acessos"}>{refreshing ? "ATUALIZANDO" : "ATUALIZAR"} <span className={refreshing ? "refresh-icon is-spinning" : "refresh-icon"} aria-hidden="true">↻</span></button></div>
    {cancelError && <p className="purchase-cancel-error" role="alert">{cancelError}</p>}
    {error ? <div className="state-card" role="alert"><p>{error}</p><button className="text-button" onClick={load}>TENTAR NOVAMENTE</button></div> : purchases === null ? <div className="state-card"><span className="loader" /><p>CARREGANDO COMPRAS</p></div> : purchases.length === 0 ? <div className="state-card"><p>Você ainda não tem compras.</p></div> : <div className="purchase-list">{purchases.map(item => <article className="purchase-row" key={item.id}><div><span className="eyebrow">COMPRA DO CURSO</span><h2>{courseTitles[item.cursoId] ?? "Curso"}</h2><span className="purchase-date">{formatPrice(item.valor)} · {new Date(item.createdAt).toLocaleDateString("pt-BR")}</span></div><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span><div className="purchase-actions">{item.status === "PAGO" ? <Link className="profile-edit-button purchase-access-button" href={`/aulas/${item.cursoId}`}>ACESSAR AULAS <span>↗</span></Link> : item.status === "PENDENTE" ? <><Link className="purchase-action-button purchase-action-pix" href={`/pagamento/${item.id}`}>GERAR PIX NOVAMENTE <span>↗</span></Link><button type="button" className="purchase-action-button purchase-action-cancel purchase-cancel" onClick={() => setConfirmCancelId(item.id)} disabled={cancelingId === item.id}>{cancelingId === item.id ? "CANCELANDO..." : "CANCELAR COMPRA"} <span>{cancelingId === item.id ? "↻" : "↗"}</span></button></> : <Link className="text-button" href="/cursos">VER CURSOS <span>↗</span></Link>}</div></article>)}</div>}
  </main>{confirmCancelId !== null && <div className="cancel-dialog-backdrop"><section className="cancel-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cancel-dialog-title" aria-describedby="cancel-dialog-description"><span className="cancel-dialog-eyebrow">CONFIRMAÇÃO</span><h2 id="cancel-dialog-title">CANCELAR COMPRA?</h2><p id="cancel-dialog-description">Você está prestes a cancelar a compra de <strong>{courseTitles[purchases?.find(item => item.id === confirmCancelId)?.cursoId ?? 0] ?? "este curso"}</strong>. Deseja continuar?</p><p className="cancel-dialog-note">Essa ação não poderá ser desfeita.</p><div className="cancel-dialog-actions"><button type="button" className="cancel-dialog-keep" onClick={() => setConfirmCancelId(null)} autoFocus>MANTER COMPRA</button><button type="button" className="cancel-dialog-confirm" onClick={() => { const id = confirmCancelId; setConfirmCancelId(null); if (id !== null) void cancelPurchase(id); }}>CANCELAR COMPRA <span>↗</span></button></div></section></div>}</>;
}

export default function StudentPage() { return <RequireSession><StudentContent /></RequireSession>; }


