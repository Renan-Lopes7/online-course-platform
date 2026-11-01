"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Session = { token: string; role: string; userId: number };
type SessionContextValue = { session: Session | null; ready: boolean; signingOut: boolean; signIn: (token: string) => void; signOut: () => void };
const SessionContext = createContext<SessionContextValue | null>(null);

function readClaims(token: string) {
  try {
    const value = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(value)) as { sub: number; role: string };
  } catch { return null; }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const clearSession = useCallback(() => {
    sessionStorage.removeItem("course-session");
    setSession(null);
  }, []);
  const signOut = useCallback(() => {
    setSigningOut(true);
    clearSession();
    window.setTimeout(() => setSigningOut(false), 650);
  }, [clearSession]);
  const signIn = useCallback((token: string) => {
    const claims = readClaims(token);
    if (!claims || !Number.isFinite(claims.sub)) throw new Error("A API retornou um token inválido.");
    sessionStorage.setItem("course-session", token);
    setSession({ token, role: claims.role, userId: claims.sub });
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("course-session");
    const claims = token ? readClaims(token) : null;
    if (token && claims && Number.isFinite(claims.sub)) setSession({ token, role: claims.role, userId: claims.sub });
    else if (token) sessionStorage.removeItem("course-session");
    setReady(true);
    const expire = () => clearSession();
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [clearSession]);

  const value = useMemo(() => ({ session, ready, signingOut, signIn, signOut }), [session, ready, signingOut, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}{signingOut && <div className="logout-loading-overlay" role="status" aria-live="polite"><span className="loader" /><p>SAINDO</p></div>}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession precisa estar dentro de SessionProvider");
  return value;
}
