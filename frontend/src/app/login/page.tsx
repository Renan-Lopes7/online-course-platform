"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

function LoginContent() {
  const params = useSearchParams();
  return <><SiteHeader showHomeLink /><main className="page-shell auth-shell login-shell"><p className="eyebrow">ACESSO À PLATAFORMA</p><h1>ENTRAR</h1>{params.get("cadastro") === "ok" && <p className="success-note">Cadastro realizado. Entre com seu e-mail e senha.</p>}<AuthForm mode="login" /></main></>;
}

export default function LoginPage() { return <Suspense fallback={<main className="page-shell" /> }><LoginContent /></Suspense>; }

