"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { RodiAvatar } from "../icons/RodiAvatar";
import { Arrastrable } from "../Arrastrable";
import styles from "./chat.module.css";
import { ASK_ASSISTANT_EVENT } from "./chatEvents";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MENSAJE_ERROR_RED =
  "No pudimos conectar con el asistente. Probá de nuevo en un momento.";

const SUGERENCIAS = ["¿Aceptan permuta?", "Busco una SUV", "¿Tienen financiación?", "¿Cuál es el más económico?"];

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

  function handleSend() {
    const texto = input.trim();
    if (texto) enviarTexto(texto);
  }

  useEffect(() => {
    function handleAsk(e: Event) {
      const pregunta = (e as CustomEvent<{ pregunta: string }>).detail?.pregunta;
      if (!pregunta) return;
      setOpen(true);
      enviarTexto(pregunta);
    }
    window.addEventListener(ASK_ASSISTANT_EVENT, handleAsk);
    return () => window.removeEventListener(ASK_ASSISTANT_EVENT, handleAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <RodiAvatar size={34} />
            </div>
            <div>
              <div className={styles.panelTitle}>Rodi</div>
              <div className={styles.panelSub}>
                <span className={styles.panelDot} />
                Responde con el stock en vivo
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
              ¡Hola! 👋 Soy Rodi, el asistente de {nombreAgencia}. Estoy para ayudarte a encontrar el
              vehículo que buscás: preguntame por el stock, precios o características, y si no puedo
              resolverlo te conecto con un vendedor.
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
                Buscando en el stock…
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
        // Se puede arrastrar para correrlo de lo que tape (ver Arrastrable).
        <Arrastrable storageKey="rodado:rodi:posicion:catalogo">
          <button type="button" className={styles.bubbleBtn} onClick={() => setOpen(true)}>
            <span className={styles.bubbleIcon}>
              <RodiAvatar size={30} />
              <span className={styles.bubbleIconDot} />
            </span>
            <span className={styles.bubbleText}>
              <span className={styles.bubbleTitle}>Preguntale al asistente</span>
              <span className={styles.bubbleSub}>Conoce todo el stock · responde al instante</span>
            </span>
          </button>
        </Arrastrable>
      )}
    </div>
  );
}
