
import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return <><SiteHeader showHomeLink /><main className="page-shell auth-shell register-shell"><h1>CRIAR CONTA</h1><AuthForm mode="register" /></main></>;
}

