"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import authStyles from "../../auth.module.css";
import styles from "./verificar-codigo.module.css";

const CODIGO_LEN = 4;

type ErrorTipo = "incorrecto" | "vencido" | "bloqueado" | "invalido";

const MENSAJE_TERMINAL: Record<Exclude<ErrorTipo, "incorrecto">, string> = {
  vencido: "El código venció. Pedí uno nuevo.",
  bloqueado: "Demasiados intentos. Pedí un código nuevo.",
  invalido: "Este código ya no es válido. Pedí uno nuevo.",
};

export function VerificarCodigoForm({
  intentoId,
  callbackUrl,
  resendCodigoAction,
}: {
  intentoId: string;
  callbackUrl: string;
  resendCodigoAction: (formData: FormData) => void;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODIGO_LEN).fill(""));
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");
  const [errorTipo, setErrorTipo] = useState<ErrorTipo | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const terminal = errorTipo === "vencido" || errorTipo === "bloqueado" || errorTipo === "invalido";
  const disabled = status !== "idle" || terminal;

  function focusBox(i: number) {
    inputsRef.current[i]?.focus();
    inputsRef.current[i]?.select();
  }

  async function verificar(codigoCompleto: string) {
    setStatus("verifying");
    setErrorTipo(null);

    try {
      const res = await fetch("/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentoId, codigo: codigoCompleto, callbackUrl }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("success");
        setTimeout(() => router.push(data.redirectUrl), 1100);
        return;
      }

      setErrorTipo(data.error as ErrorTipo);
      setIntentosRestantes(typeof data.intentosRestantes === "number" ? data.intentosRestantes : null);
      setShake(true);
      setTimeout(() => setShake(false), 450);

      if (data.error === "incorrecto") {
        setDigits(Array(CODIGO_LEN).fill(""));
        setStatus("idle");
        setTimeout(() => focusBox(0), 50);
      } else {
        setStatus("idle");
      }
    } catch {
      setErrorTipo("invalido");
      setStatus("idle");
    }
  }

  function handleChange(index: number, raw: string) {
    if (disabled) return;
    const value = raw.replace(/\D/g, "");

    if (value.length > 1) {
      // Pegado o autocompletado de un código entero en una sola casilla.
      const chars = value.slice(0, CODIGO_LEN).split("");
      const next = Array(CODIGO_LEN).fill("");
      chars.forEach((c, i) => (next[i] = c));
      setDigits(next);
      if (chars.length === CODIGO_LEN) {
        verificar(chars.join(""));
      } else {
        focusBox(chars.length);
      }
      return;
    }

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < CODIGO_LEN - 1) {
      focusBox(index + 1);
    }

    if (value && next.every((d) => d !== "")) {
      verificar(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusBox(index - 1);
    }
  }

  if (status === "success") {
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>
          <Check size={34} strokeWidth={3} />
        </div>
        <div className={styles.successText}>Verificado correctamente</div>
      </div>
    );
  }

  return (
    <>
      {errorTipo === "incorrecto" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Código incorrecto. Te queda{intentosRestantes === 1 ? "" : "n"} {intentosRestantes} intento
          {intentosRestantes === 1 ? "" : "s"}.
        </div>
      )}
      {terminal && errorTipo && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          {MENSAJE_TERMINAL[errorTipo]}
        </div>
      )}

      <div className={`${styles.codeRow} ${shake ? styles.shake : ""}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={CODIGO_LEN}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={i === 0}
            disabled={disabled}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`${styles.codeBox} ${d ? styles.filled : ""} ${
              errorTipo === "incorrecto" ? styles.errored : ""
            }`}
            aria-label={`Dígito ${i + 1} del código`}
          />
        ))}
      </div>

      <p className={styles.verifyingNote}>{status === "verifying" ? "Verificando…" : ""}</p>

      <form action={resendCodigoAction} className={styles.resendRow}>
        <input type="hidden" name="intentoId" value={intentoId} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ¿No recibiste el código?{" "}
        <button type="submit" className={styles.resendBtn}>
          Reenviar
        </button>
      </form>

      <p className={authStyles.foot}>
        <a href="/login">Volver a iniciar sesión</a>
      </p>
    </>
  );
}
