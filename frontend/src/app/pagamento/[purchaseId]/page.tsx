"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { PixQrCode, Purchase, formatPrice, paymentService, purchaseService } from "@/lib/api";
import { useSession } from "@/components/session-provider";

function isValidCpf(cpf: string) {
  if (cpf.length !== 11 || /^(.)\1+$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, value, index) => total + Number(value) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function PaymentContent() {
  const { purchaseId: rawId } = useParams<{ purchaseId: string }>();
  const id = Number(rawId);
  const { session } = useSession();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [qr, setQr] = useState<PixQrCode | null>(null);
  const [error, setError] = useState("");
  const [qrError, setQrError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [creatingPix, setCreatingPix] = useState(false);
  const qrRequestInProgress = useRef(false);

  const loadQr = useCallback(async () => {
    if (!session || !Number.isInteger(id) || id < 1 || qrRequestInProgress.current) return;
    qrRequestInProgress.current = true;
    setQrLoading(true);
    setQrError("");
    try {
      const existingQr = await paymentService.qrCode(id, session.token);
      if (existingQr.compraId !== id) throw new Error("O QR Code retornado não corresponde a esta compra.");
      setQr(existingQr);
    } catch (reason) {
      setQrError(reason instanceof Error ? reason.message : "Não foi possível carregar o QR Code desta cobrança.");
    } finally {
      qrRequestInProgress.current = false;
      setQrLoading(false);
    }
  }, [id, session]);

  const refresh = useCallback(async () => {
    if (!session || !Number.isInteger(id) || id < 1) return;
    setChecking(true);
    try {
      const current = await purchaseService.get(id, session.token);
      if (!current) { setError("Compra não encontrada."); return; }
      setPurchase(current);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível consultar o pagamento.");
    } finally {
      setChecking(false);
    }
  }, [id, session]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (purchase?.status === "PENDENTE" && purchase.pagamentoId && !qr && !qrError && !qrLoading) void loadQr();
  }, [purchase?.status, purchase?.pagamentoId, qr, qrError, qrLoading, loadQr]);
  useEffect(() => {
    if (!session || purchase?.status !== "PENDENTE") return;
    const timer = window.setInterval(() => { void refresh(); }, 7000);
    return () => window.clearInterval(timer);
  }, [session, purchase?.status, refresh]);

  async function generatePix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || creatingPix) return;
    const cpf = String(new FormData(event.currentTarget).get("cpf") ?? "").replace(/\D/g, "");
    if (!isValidCpf(cpf)) { setError("Informe um CPF válido para gerar o Pix."); return; }

    setCreatingPix(true);
    setError("");
    try {
      const latest = await purchaseService.get(id, session.token);
      if (!latest) throw new Error("Compra não encontrada.");
      setPurchase(latest);
      if (latest.status !== "PENDENTE") return;

      // Se a cobrança já existe, recupera o QR Code em vez de criar outra.
      if (latest.pagamentoId || purchase?.pagamentoId) {
        await loadQr();
        return;
      }

      const created = await paymentService.createPix(id, cpf, session.token);
      setPurchase(current => current ? { ...current, pagamentoId: created.pagamentoId } : current);
      const latestAfterCreation = await purchaseService.get(id, session.token);
      if (latestAfterCreation) setPurchase(latestAfterCreation.pagamentoId ? latestAfterCreation : { ...latestAfterCreation, pagamentoId: created.pagamentoId });
      await loadQr();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível gerar o Pix. Tente novamente.");
    } finally {
      setCreatingPix(false);
    }
  }

  async function copyPix() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.payload); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
    catch { setError("Não foi possível copiar automaticamente. Selecione e copie o código Pix."); }
  }

  return <><SiteHeader /><main className="page-shell payment-shell"><p className="eyebrow">PAGAMENTO <span>/</span> PIX</p><h1>{purchase?.status === "PAGO" ? <>PAGAMENTO<br /><em>CONFIRMADO</em></> : purchase?.status === "CANCELADO" ? <>COMPRA<br /><em>CANCELADA</em></> : <>AGUARDANDO<br /><em>PAGAMENTO</em></>}</h1>
    {purchase && <div className="payment-summary"><strong>{formatPrice(purchase.valor)}</strong></div>}
    {purchase?.status === "PENDENTE" && qr && <div className="pix-layout"><div className="pix-qr"><Image src={`data:image/png;base64,${qr.encodedImage}`} alt="QR Code Pix para pagamento" width={280} height={280} unoptimized /><span>ESCANEIE COM O APLICATIVO DO SEU BANCO</span></div><div className="pix-info"><p>Escaneie o QR Code com o aplicativo do seu banco ou copie o código Pix e cole no app para concluir o pagamento.</p><label htmlFor="pix-code">CÓDIGO PIX</label><textarea id="pix-code" readOnly value={qr.payload} rows={5} /><button className="payment-regenerate-button" onClick={copyPix}>{copied ? "CÓDIGO COPIADO" : "COPIAR CÓDIGO PIX"}<span>↗</span></button>{qr.expirationDate && <p className="expiry">VÁLIDO ATÉ {new Date(qr.expirationDate).toLocaleString("pt-BR")}</p>}<p className="pending-note"><span className="pulse-dot" />Pagamento pendente · consultando a cada 7 segundos</p></div></div>}
    {purchase?.status === "PENDENTE" && !qr && <div className="state-card">{qrLoading ? <><span className="loader" /><p>CARREGANDO QR CODE</p></> : purchase.pagamentoId ? <><p>{qrError || "Vamos buscar o QR Code da cobrança Pix existente."}</p><button className="payment-regenerate-button" onClick={() => void loadQr()} disabled={qrLoading}>{qrLoading ? "CARREGANDO QR CODE..." : "TENTAR CARREGAR QR CODE"} <span>↻</span></button></> : <><p>Informe seu CPF para gerar o Pix desta compra.</p><form className="pix-regenerate-form" onSubmit={generatePix}><label htmlFor="cpf-pix">CPF</label><input id="cpf-pix" name="cpf" type="text" inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" required disabled={creatingPix} /><button className="payment-regenerate-button" type="submit" disabled={creatingPix}>{creatingPix ? "GERANDO PIX..." : "GERAR PIX NOVAMENTE"}<span>↗</span></button></form></>}</div>}
    {purchase?.status === "PAGO" && <div className="state-card success-state"><Link className="payment-regenerate-button payment-access-button" href={`/aulas/${purchase.cursoId}`}>ACESSAR AS AULAS <span>↗</span></Link></div>}
    {purchase?.status === "CANCELADO" && <div className="state-card"><p>Esta compra foi cancelada.</p><Link className="text-button" href="/cursos">VOLTAR AO CATÁLOGO <span>↗</span></Link></div>}
    {error && <div className="form-error payment-error" role="alert">{error}<button className="text-button" onClick={() => void refresh()}>TENTAR NOVAMENTE</button></div>}

  </main></>;
}

export default function PaymentPage() { return <RequireSession><PaymentContent /></RequireSession>; }







