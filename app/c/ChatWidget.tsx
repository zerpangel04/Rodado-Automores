"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chat.module.css";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MENSAJE_ERROR_RED =
  "No pudimos conectar con el asistente. Probá de nuevo en un momento.";

export function ChatWidget({
  dominio,
  nombreAgencia,
  vehiculoId,
}: {
  dominio: string;
  nombreAgencia: string;
  vehiculoId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function handleSend() {
    const texto = input.trim();
    if (!texto || sending) return;

    const next = [...messages, { role: "user" as const, content: texto }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/${dominio}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, vehiculoId }),
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
            <div>
              <div className={`${styles.panelTitle} disp`}>Asistente de {nombreAgencia}</div>
              <div className={styles.panelSub}>Responde con el stock en vivo</div>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          <div className={styles.messages} ref={listRef}>
            <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
              ¡Hola! 👋 Soy el asistente de {nombreAgencia}. Preguntame por el stock, precios o
              características, y si no puedo resolverlo te conecto con un vendedor.
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
              <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.typing}`}>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta…"
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
              →
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.bubbleBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
