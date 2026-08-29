"use client";

import { useState } from "react";
import styles from "../../public.module.css";

export function ContactForm({
  dominio,
  vehiculoId,
}: {
  dominio: string;
  vehiculoId: string;
}) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sitioWeb, setSitioWeb] = useState(""); // honeypot, ver comentario más abajo
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!nombre.trim() || !contacto.trim()) {
      setError("Dejanos tu nombre y un teléfono o email de contacto");
      return;
    }
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dominio,
          vehiculoId,
          nombreCliente: nombre.trim(),
          contacto: contacto.trim(),
          mensaje: mensaje.trim() || undefined,
          sitioWeb,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No pudimos enviar tu consulta, intentá de nuevo");
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.contactForm}>
      <h4 className="disp">¿Te interesa este auto?</h4>
      <p>
        Dejá tus datos y te contactamos en el momento — no hace falta que vengas al local
        primero.
      </p>

      {sent ? (
        <div className={styles.successBox}>
          ✓ ¡Listo! La agencia recibió tu consulta y te va a contactar a la brevedad.
        </div>
      ) : (
        <>
          {error && <div className={styles.errorBox}>{error}</div>}
          {/* Honeypot anti-bot: invisible para una persona (fuera de
              pantalla, sin tabIndex), pero un bot que autocompleta todos
              los inputs de un form suele llenarlo igual. */}
          <input
            type="text"
            name="sitioWeb"
            value={sitioWeb}
            onChange={(e) => setSitioWeb(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <div className={styles.field}>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              type="text"
              placeholder="Tu nombre"
            />
          </div>
          <div className={styles.field}>
            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              type="text"
              placeholder="Teléfono o WhatsApp"
            />
          </div>
          <div className={styles.field}>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={2}
              placeholder="¿Algo puntual que quieras consultar? (opcional)"
            />
          </div>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={sending}>
            {sending ? "Enviando…" : "Quiero que me contacten →"}
          </button>
        </>
      )}
    </div>
  );
}
