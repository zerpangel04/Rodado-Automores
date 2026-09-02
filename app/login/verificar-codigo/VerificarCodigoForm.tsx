"use client";

import { useEffect, useRef, useState } from "react";
import authStyles from "../../auth.module.css";

export function VerificarCodigoForm({
  verificarCodigoAction,
  intentoId,
  callbackUrl,
  errorTipo,
  intentosRestantes,
}: {
  verificarCodigoAction: (formData: FormData) => void;
  intentoId: string;
  callbackUrl: string;
  errorTipo?: string;
  intentosRestantes?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const bloqueado = errorTipo === "vencido" || errorTipo === "bloqueado" || errorTipo === "invalido";

  // El redirect() de verificarCodigoAction vuelve a esta misma ruta (solo
  // cambian los searchParams), así que Next reutiliza la instancia del
  // client component en vez de remontarla — sin este efecto, "submitting"
  // se queda pegado en true y el botón no vuelve a habilitarse.
  useEffect(() => {
    setSubmitting(false);
  }, [errorTipo, intentosRestantes]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;
    const codigo = (form.elements.namedItem("codigo") as HTMLInputElement)?.value ?? "";
    if (!/^\d{6}$/.test(codigo)) {
      e.preventDefault();
      setClientError("El código tiene 6 dígitos.");
      return;
    }
    setClientError("");
    setSubmitting(true);
  }

  return (
    <>
      {errorTipo === "vencido" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          El código venció. Volvé a iniciar sesión para pedir uno nuevo.
        </div>
      )}
      {errorTipo === "bloqueado" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Demasiados intentos. Volvé a iniciar sesión para pedir un código nuevo.
        </div>
      )}
      {errorTipo === "invalido" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Este código ya no es válido. Volvé a iniciar sesión.
        </div>
      )}
      {errorTipo === "incorrecto" && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          Código incorrecto. Te queda{Number(intentosRestantes) === 1 ? "" : "n"} {intentosRestantes}{" "}
          intento{Number(intentosRestantes) === 1 ? "" : "s"}.
        </div>
      )}
      {!errorTipo && clientError && (
        <div className={authStyles.errorBox}>
          <span>⚠</span>
          {clientError}
        </div>
      )}

      {!bloqueado && (
        <form
          ref={formRef}
          action={verificarCodigoAction}
          onSubmit={handleSubmit}
          className={authStyles.form}
        >
          <input type="hidden" name="intentoId" value={intentoId} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className={authStyles.field}>
            <label htmlFor="codigo">Código de 6 dígitos</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="000000"
              autoFocus
              onChange={() => setClientError("")}
            />
          </div>
          <button type="submit" className={authStyles.submit} disabled={submitting}>
            {submitting ? "Verificando…" : "Verificar código"}
          </button>
        </form>
      )}

      <p className={authStyles.foot}>
        <a href="/login">Volver a iniciar sesión</a>
      </p>
    </>
  );
}
