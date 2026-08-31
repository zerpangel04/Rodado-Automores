"use client";

import { MessageCircle } from "lucide-react";
import styles from "./public.module.css";
import { ASK_ASSISTANT_EVENT } from "./chatEvents";

const ATAJOS = ["¿El más económico?", "Busco una SUV"];

export function AskAssistantChips() {
  function preguntar(pregunta: string) {
    window.dispatchEvent(new CustomEvent(ASK_ASSISTANT_EVENT, { detail: { pregunta } }));
  }

  return (
    <div className={styles.vitrinaAsk}>
      <div className={styles.vitrinaAskIcon}>
        <span>
          <MessageCircle size={12} />
        </span>
        <span className={styles.vitrinaAskLabel}>Preguntale al asistente:</span>
      </div>
      {ATAJOS.map((a) => (
        <button
          key={a}
          type="button"
          className={styles.vitrinaAskChip}
          onClick={() => preguntar(a)}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
