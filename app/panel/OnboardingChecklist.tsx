"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import styles from "./panel.module.css";

export type OnboardingPaso = {
  id: string;
  titulo: string;
  descripcion: string;
  completo: boolean;
};

async function marcarOnboardingCerrado() {
  return fetch("/api/tenant/onboarding", { method: "POST" });
}

export function OnboardingChecklist({ pasos }: { pasos: OnboardingPaso[] }) {
  const router = useRouter();
  const [oculto, setOculto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const todosCompletos = pasos.every((p) => p.completo);

  // Si los 3 pasos ya están completos cuando se monta (se completó el
  // último en otra pantalla y volvieron acá), muestra un momento la
  // versión "todo tildado" con el mensaje de cierre antes de ocultarse
  // solo — así el dueño ve que terminó, en vez de que el checklist
  // desaparezca de golpe sin avisar.
  useEffect(() => {
    if (!todosCompletos) return;
    setCerrando(true);
    const timeout = setTimeout(async () => {
      try {
        await marcarOnboardingCerrado();
      } catch {
        // si falla, el checklist vuelve a aparecer en el próximo reload
        // y se reintenta solo — no hace falta bloquear la UI por esto.
      }
      setOculto(true);
      router.refresh();
    }, 2600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todosCompletos]);

  async function handleOmitir() {
    try {
      const res = await marcarOnboardingCerrado();
      if (!res.ok) {
        alert("No se pudo omitir, intentá de nuevo");
        return;
      }
      setOculto(true);
      router.refresh();
    } catch {
      alert("Error de conexión, intentá de nuevo");
    }
  }

  if (oculto) return null;

  return (
    <div className={`${styles.card} ${styles.onboardingCard}`}>
      <div className={styles.onboardingHead}>
        <h3 className="disp">{cerrando ? "¡Listo! Ya tenés lo básico andando" : "Primeros pasos"}</h3>
        <button type="button" className={styles.onboardingOmitir} onClick={handleOmitir}>
          Omitir
        </button>
      </div>
      <div className={styles.onboardingPasos}>
        {pasos.map((p) => (
          <div
            key={p.id}
            className={`${styles.onboardingPaso} ${p.completo ? styles.onboardingPasoOk : ""}`}
          >
            <span className={styles.onboardingCheck}>{p.completo && <Check size={13} />}</span>
            <div>
              <div className={styles.onboardingPasoTitulo}>{p.titulo}</div>
              <div className={styles.onboardingPasoDesc}>{p.descripcion}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
