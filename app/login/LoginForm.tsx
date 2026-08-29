"use client";

import { useEffect, useState } from "react";
import styles from "../auth.module.css";

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function LoginForm({
  loginAction,
  callbackUrl,
  errorTipo,
  intentos,
  esperaSegundosInicial,
}: {
  loginAction: (formData: FormData) => void;
  callbackUrl: string;
  errorTipo?: string;
  intentos?: string;
  esperaSegundosInicial: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    errorTipo === "bloqueado" ? esperaSegundosInicial : 0
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
    // Solo nos importa arrancar el interval una vez al entrar en bloqueado,
    // no reiniciarlo en cada tick — por eso la dependencia es el booleano,
    // no secondsLeft en sí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft > 0]);

  const bloqueado = secondsLeft > 0;

  return (
    <>
      {bloqueado && (
        <div className={styles.errorBox}>
          Demasiados intentos. Podés volver a intentar en{" "}
          <span className={styles.countdown}>{formatMMSS(secondsLeft)}</span>.
        </div>
      )}
      {!bloqueado && errorTipo === "CredentialsSignin" && intentos && (
        <div className={styles.errorBox}>
          Email o contraseña incorrectos. Te queda{Number(intentos) === 1 ? "" : "n"}{" "}
          {intentos} intento{Number(intentos) === 1 ? "" : "s"} antes de bloquear
          temporalmente el acceso.
        </div>
      )}
      {!bloqueado && errorTipo === "CredentialsSignin" && !intentos && (
        <div className={styles.errorBox}>Email o contraseña incorrectos.</div>
      )}

      <form action={loginAction} className={styles.form}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vos@agencia.com"
            disabled={bloqueado}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            disabled={bloqueado}
          />
        </div>
        <button type="submit" className={styles.submit} disabled={bloqueado}>
          {bloqueado ? `Bloqueado — ${formatMMSS(secondsLeft)}` : "Entrar"}
        </button>
      </form>
    </>
  );
}
