"use client";

import { FormEvent, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { RequireSession } from "@/components/require-session";
import { useSession } from "@/components/session-provider";
import { UpdateUserData, userService } from "@/lib/api";

function ProfileContent() {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const currentPassword = String(values.get("currentPassword") ?? "");
    const data: UpdateUserData = {};
    if (name) {
      if (name.length < 3) {
        setError("O nome deve ter no mínimo 3 caracteres.");
        setSuccess("");
        return;
      }
      if (name.length > 100) {
        setError("O nome deve ter no máximo 100 caracteres.");
        setSuccess("");
        return;
      }
      data.name = name;
    }
    if (email) data.email = email;
    if (password) {
      if (password.length < 8 || password.length > 72) {
        setError(password.length < 8
          ? "A senha deve ter no mínimo 8 caracteres."
          : "A senha deve ter no máximo 72 caracteres.");
        setSuccess("");
        return;
      }
      if (!currentPassword) {
        setError("Informe sua senha atual para cadastrar uma nova senha.");
        setSuccess("");
        return;
      }
      data.password = password;
      data.currentPassword = currentPassword;
    }
    if (!Object.keys(data).length) {
      setError("Preencha ao menos um dado que deseja atualizar.");
      setSuccess("");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await userService.update(session.userId, data, session.token);
      setSuccess(result.message || "Perfil atualizado com sucesso.");
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar seu perfil.");
    } finally {
      setBusy(false);
    }
  }

  return <><SiteHeader showHomeLink /><main className="page-shell auth-shell profile-shell"><p className="eyebrow">MINHA CONTA</p><h1>ATUALIZAR<br />PERFIL</h1><p className="auth-lede">Preencha somente os dados que deseja alterar. Para trocar a senha, informe sua senha atual e a nova senha.</p><form className="form-panel" onSubmit={submit}>
    <label>Nome<input name="name" type="text" autoComplete="name" minLength={3} maxLength={100} placeholder="Novo nome" /></label>
    <label>E-mail<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="novo@email.com" /></label>
    <label>Senha atual<input name="currentPassword" type="password" autoComplete="current-password" minLength={8} /></label>
    <label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p className="success-note" role="status">{success}</p>}
    <button className="button form-submit" disabled={busy}>{busy ? "SALVANDO..." : <>SALVAR <span className="profile-save-accent">ALTERAÇÕES</span></>}<span className="profile-save-arrow">↗</span></button>
  </form></main></>;
}

export default function ProfilePage() {
  return <RequireSession><ProfileContent /></RequireSession>;
}

