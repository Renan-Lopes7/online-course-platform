"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";

export function SiteHeader({ showHomeLink = false, showStudentLink = false, homeHref = "/", homeLabel = "← VOLTAR AO MENU" }: { showHomeLink?: boolean; showStudentLink?: boolean; homeHref?: string; homeLabel?: string }) {
  const { session, ready, signOut, signingOut } = useSession();
  const router = useRouter();
  function handleSignOut() {
    if (signingOut) return;
    signOut();
    router.replace("/");
  }
  return (
    <header className="site-header">
      {showHomeLink && <Link className="menu-button header-menu-button editorial-action" href={homeHref}>{homeLabel}</Link>}
      <nav aria-label="Navegação principal">
        {session && (session.role !== "ADMIN" || showStudentLink) && <Link className="access-area-link editorial-action" href="/aluno">ACESSAR <span>ÁREA DO ALUNO</span></Link>}
        {session?.role === "ADMIN" && !showStudentLink && <Link className="access-area-link editorial-action" href="/admin">CRIAR <span>UM NOVO CURSO</span></Link>}
      </nav>
      <div className="header-actions">{ready && (session ? <button className="header-logout editorial-action" onClick={handleSignOut} disabled={signingOut}>{signingOut ? "SAINDO..." : "SAIR"}</button> : <><Link className="header-account header-login-button editorial-action" href="/login">ENTRAR</Link><Link className="header-account header-login-button editorial-action" href="/cadastro">CRIAR CONTA</Link></>)}</div>
    </header>
  );
}
