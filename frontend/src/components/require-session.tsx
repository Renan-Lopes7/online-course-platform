"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";

export function RequireSession({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { session, ready, signingOut } = useSession();
  const router = useRouter();
  useEffect(() => { if (ready && !session && !signingOut) router.replace("/login"); }, [ready, session, signingOut, router]);
  if (!ready || !session) return <main className="require-session-loading"><div className="state-card"><span className="loader" /><p>{signingOut ? "SAINDO" : "VERIFICANDO ACESSO"}</p></div></main>;
  if (admin && session.role !== "ADMIN") return <main className="page-shell"><div className="state-card" role="alert"><p>Seu perfil não tem acesso administrativo.</p><Link className="text-button" href="/aluno">VOLTAR À ÁREA DO ALUNO <span>↗</span></Link></div></main>;
  return <>{children}</>;
}
