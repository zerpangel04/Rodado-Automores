"use client";

import { useEffect, useRef, useState } from "react";
import authStyles from "../auth.module.css";
import styles from "./login.module.css";
import { GoogleIcon } from "./GoogleIcon";

const GOOGLE_PRONTO_MSG = "Muy pronto vas a poder entrar con tu cuenta de Google.";

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
  const [showPass, setShowPass] = useState(false);
  // "Mantener la sesión abierta" no cambia todavía la duración real de la
  // sesión (NextAuth usa un maxAge fijo) — queda como preferencia visual
  // hasta que se implemente maxAge dinámico por login.
  const [remember, setRemember] = useState(true);
  const [clientError, setClientError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleNote, setGoogleNote] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const googleNoteTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(googleNoteTimer.current);
  }, []);

  function handleGoogleClick() {
    setGoogleNote(true);
    clearTimeout(googleNoteTimer.current);
    googleNoteTimer.current = setTimeout(() => setGoogleNote(false), 3000);
  }

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "";
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value ?? "";

    if (!email || !/.+@.+\..+/.test(email)) {
      e.preventDefault();
      setClientError("Revisá el email: no parece una dirección válida.");
      return;
    }
    if (password.length < 6) {
      e.preventDefault();
      setClientError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    setClientError("");
    setSubmitting(true);
  }

  return (
    <>
      {bloqueado && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Demasiados intentos. Podés volver a intentar en{" "}
          <span className={authStyles.countdown}>{formatMMSS(secondsLeft)}</span>.
        </div>
      )}
      {!bloqueado && clientError && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          {clientError}
        </div>
      )}
      {!bloqueado && !clientError && errorTipo === "CredentialsSignin" && intentos && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Email o contraseña incorrectos. Te queda{Number(intentos) === 1 ? "" : "n"} {intentos}{" "}
          intento{Number(intentos) === 1 ? "" : "s"} antes de bloquear temporalmente el acceso.
        </div>
      )}
      {!bloqueado && !clientError && errorTipo === "CredentialsSignin" && !intentos && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Email o contraseña incorrectos.
        </div>
      )}
      {!bloqueado && !clientError && errorTipo === "EnvioFallido" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          No pudimos enviarte el código de verificación por email. Probá de nuevo en un momento.
        </div>
      )}

      <form ref={formRef} action={loginAction} onSubmit={handleSubmit} className={authStyles.form}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className={authStyles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vos@agencia.com"
            autoComplete="username"
            disabled={bloqueado}
            onChange={() => setClientError("")}
          />
        </div>

        <div className={styles.passField}>
          <label htmlFor="password">Contraseña</label>
          <div className={styles.passInputWrap}>
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              required
              placeholder="Tu contraseña"
              autoComplete="current-password"
              disabled={bloqueado}
              onChange={() => setClientError("")}
            />
            <button
              type="button"
              className={styles.passToggle}
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
            >
              {showPass ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        <div className={styles.optionsRow}>
          <button
            type="button"
            className={styles.rememberBtn}
            onClick={() => setRemember((v) => !v)}
          >
            <span className={`${styles.checkbox} ${remember ? styles.checkboxOn : ""}`}>
              {remember && "✓"}
            </span>
            Mantener la sesión abierta
          </button>
          <a href="/forgot-password" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button type="submit" className={authStyles.submit} disabled={bloqueado || submitting}>
          {submitting && !bloqueado && <span className={styles.spinner} />}
          {bloqueado ? `Bloqueado — ${formatMMSS(secondsLeft)}` : submitting ? "Entrando…" : "Entrar al panel"}
        </button>
      </form>

      <div className={styles.orDivider}>
        <span className={styles.orLine} />
        <span className={styles.orCircle}>o</span>
        <span className={styles.orLine} />
      </div>

      <button
        type="button"
        className={styles.googleBtn}
        aria-disabled="true"
        title={GOOGLE_PRONTO_MSG}
        onClick={handleGoogleClick}
      >
        <GoogleIcon />
        Entrar con Google
      </button>
      {googleNote && <div className={styles.googleNote}>{GOOGLE_PRONTO_MSG}</div>}
    </>
  );
}
