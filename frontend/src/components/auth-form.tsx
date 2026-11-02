"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { useSession } from "@/components/session-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "register") {
        const credentials = { name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")) };
        if (credentials.name.trim().length < 3) {
          setError("O nome deve ter no mínimo 3 caracteres.");
          return;
        }
        if (credentials.name.length > 100) {
          setError("O nome deve ter no máximo 100 caracteres.");
          return;
        }
        await authService.register(credentials);
        try {
          const result = await authService.login({ email: credentials.email, password: credentials.password });
          signIn(result.access_token);
          router.push("/");
        } catch {
          router.push("/login?cadastro=ok");
        }
      } else {
        const result = await authService.login({ email: String(data.get("email")), password: String(data.get("password")) });
        signIn(result.access_token);
        router.push("/");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <form className="form-panel" onSubmit={submit}>
    {mode === "register" && <label>Nome completo<input name="name" type="text" required minLength={3} maxLength={100} autoComplete="name" /></label>}
    <label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    <label>Senha<input name="password" type="password" required minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className={`button form-submit editorial-action ${mode === "login" ? "login-submit" : "register-submit"}`} disabled={busy}>{busy ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"} <span>↗</span></button>
    <p className="form-footnote">{mode === "login" ? <>Ainda não tem cadastro? <Link href="/cadastro">Criar conta</Link></> : <>Já possui uma conta? <Link href="/login">Entrar</Link></>}</p>
  </form>;
}
