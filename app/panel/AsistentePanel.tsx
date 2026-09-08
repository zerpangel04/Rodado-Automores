"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";
import styles from "./asistente.module.css";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MENSAJE_ERROR_RED = "No pudimos conectar con el asistente. Probá de nuevo en un momento.";

const SUGERENCIAS = [
  "¿Por qué no puedo cargar más autos?",
  "¿Cómo conecto Mercado Libre?",
  "¿Qué incluye mi plan actual?",
];

export function AsistentePanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const sendingRef = useRef(sending);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  async function enviarTexto(texto: string) {
    if (!texto || sendingRef.current) return;

    const next = [...messagesRef.current, { role: "user" as const, content: texto }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => null);
      const reply = typeof data?.reply === "string" ? data.reply : MENSAJE_ERROR_RED;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: MENSAJE_ERROR_RED }]);
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    const texto = input.trim();
    if (texto) enviarTexto(texto);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelIcon}>
              <Sparkles size={15} />
            </div>
            <div>
              <div className={styles.panelTitle}>Asistente de Rodado</div>
              <div className={styles.panelSub}>
                <span className={styles.panelDot} />
                Conoce tu cuenta en vivo
              </div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              <X size={14} />
            </button>
          </div>

          <div className={styles.messages} ref={listRef}>
            <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
              ¡Hola! 👋 Soy el asistente de Rodado. Preguntame cómo funciona algo del panel o sobre
              tu plan y tu cuenta — te respondo con tus datos reales.
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.bubble} ${
                  m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
                }`}
              >
                {m.content}
              </div>
            ))}

            {sending && (
              <div className={styles.typingRow}>
                <span className={styles.typingDot} />
                Pensando…
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className={styles.suggestions}>
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" className={styles.suggestionChip} onClick={() => enviarTexto(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputRow}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu pregunta…"
              rows={1}
              disabled={sending}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Enviar"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          className={styles.bubbleBtn}
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de Rodado"
        >
          <Sparkles size={18} />
        </button>
      )}
    </div>
  );
}
