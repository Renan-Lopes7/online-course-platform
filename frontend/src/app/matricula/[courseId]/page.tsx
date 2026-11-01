"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { Course, formatPrice, getCourse, paymentService, purchaseService } from "@/lib/api";
import { useSession } from "@/components/session-provider";

function CheckoutContent() {
  const { courseId: rawId } = useParams<{ courseId: string }>();
  const courseId = Number(rawId);
  const router = useRouter();
  const { session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (Number.isInteger(courseId) && courseId > 0) getCourse(courseId).then(setCourse).catch(() => setError("Não foi possível carregar o curso.")); }, [courseId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session) return;
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const cpfCnpj = String(data.get("cpfCnpj") ?? "").replace(/\D/g, "");
    try {
      const purchase = await purchaseService.create(courseId, session.token);
      if (purchase.status === "PAGO") { router.push(`/aulas/${courseId}`); return; }
      if (purchase.pagamentoId) { router.push(`/pagamento/${purchase.id}`); return; }
      await paymentService.createPix(purchase.id, cpfCnpj, session.token);
      router.push(`/pagamento/${purchase.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível iniciar a compra."); }
    finally { setBusy(false); }
  }

  return <><SiteHeader showHomeLink homeHref={`/cursos/${courseId}`} homeLabel="← VOLTAR AO CURSO" /><main className="page-shell auth-shell checkout-shell"><p className="eyebrow">PAGAMENTO PIX</p>{course && <div className="checkout-course"><span>{course.title}</span><strong>{formatPrice(course.price)}</strong></div>}<form className="form-panel" onSubmit={submit}><label>CPF<input name="cpfCnpj" type="text" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" required /></label><span className="field-help">Informe seu CPF para continuar com o pagamento Pix deste curso.</span>{error && <p className="form-error" role="alert">{error}</p>}<button className="button form-submit" disabled={busy || !course}>{busy ? "CRIANDO PIX..." : "GERAR PIX"}<span>↗</span></button></form></main></>;
}

export default function CheckoutPage() { return <RequireSession><CheckoutContent /></RequireSession>; }

