"use client";

import { useState } from "react";
import styles from "./panel.module.css";
import { LeadDetailModal, type VehiculoOption } from "./leads/LeadDetailModal";
import { AssignVendedorModal, type UsuarioOption } from "./leads/AssignVendedorModal";
import type { LeadDTO } from "./leads/KanbanView";

export type Pendiente =
  | { id: string; kind: "vtv"; label: string; meta: string; urgente: boolean }
  | { id: string; kind: "contactar"; label: string; meta: string; urgente: boolean; lead: LeadDTO }
  | {
      id: string;
      kind: "asignar";
      label: string;
      meta: string;
      urgente: boolean;
      lead: Pick<LeadDTO, "id" | "nombreCliente" | "vehiculo">;
    };

export function PendientesCard({
  pendientes: initialPendientes,
  vehiculos,
  usuarios,
  canAsignar,
}: {
  pendientes: Pendiente[];
  vehiculos: VehiculoOption[];
  usuarios: UsuarioOption[];
  canAsignar: boolean;
}) {
  const [items, setItems] = useState(initialPendientes);
  const [contactarLead, setContactarLead] = useState<LeadDTO | null>(null);
  const [asignarLead, setAsignarLead] = useState<Pick<
    LeadDTO,
    "id" | "nombreCliente" | "vehiculo"
  > | null>(null);

  function handleContactarUpdated(updated: LeadDTO) {
    if (updated.etapa !== "NUEVO") {
      setItems((prev) => prev.filter((p) => !(p.kind === "contactar" && p.lead.id === updated.id)));
      setContactarLead(null);
      return;
    }
    setContactarLead(updated);
  }

  function handleAsignarUpdated(updated: LeadDTO) {
    if (updated.vendedor) {
      setItems((prev) => prev.filter((p) => !(p.kind === "asignar" && p.lead.id === updated.id)));
    }
    setAsignarLead(null);
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className="disp">Pendientes de hoy</h3>
        <span className={styles.cardHeadCount}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Sin pendientes — todo al día.</p>
      ) : (
        items.slice(0, 8).map((p) => {
          const body = (
            <>
              <span className={`${styles.taskCheck} ${p.urgente ? styles.urgent : ""}`} />
              <div className={styles.taskBody}>
                <div className={styles.taskLabel}>{p.label}</div>
                <div className={`${styles.taskMeta} ${p.urgente ? styles.urgent : ""}`}>{p.meta}</div>
              </div>
            </>
          );

          if (p.kind === "vtv") {
            return (
              <div key={p.id} className={styles.taskRow}>
                {body}
              </div>
            );
          }

          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.taskRow} ${styles.taskRowClickable}`}
              onClick={() => (p.kind === "contactar" ? setContactarLead(p.lead) : setAsignarLead(p.lead))}
            >
              {body}
            </button>
          );
        })
      )}

      {contactarLead && (
        <LeadDetailModal
          lead={contactarLead}
          vehiculos={vehiculos}
          canAsignar={canAsignar}
          onClose={() => setContactarLead(null)}
          onUpdated={handleContactarUpdated}
        />
      )}

      {asignarLead && (
        <AssignVendedorModal
          lead={asignarLead}
          usuarios={usuarios}
          onClose={() => setAsignarLead(null)}
          onUpdated={handleAsignarUpdated}
        />
      )}
    </div>
  );
}
