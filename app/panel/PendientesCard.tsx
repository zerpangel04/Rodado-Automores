"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./panel.module.css";
import { AssignVendedorModal, type UsuarioOption } from "./leads/AssignVendedorModal";
import type { LeadDTO } from "./leads/KanbanView";

export type Pendiente =
  | { id: string; kind: "vtv"; label: string; meta: string; urgente: boolean }
  // Resumen de leads dormidos: una sola fila con el conteo, que lleva a
  // Leads ya filtrado. Reemplaza al viejo "Contactar a X" por lead nuevo,
  // que miraba la fecha de creación y no los contactos registrados.
  | { id: string; kind: "dormidos"; label: string; meta: string; urgente: boolean; href: string }
  // Lo mismo para expedientes de trámites trabados (lleva a Ventas → Trámites).
  | { id: string; kind: "trabados"; label: string; meta: string; urgente: boolean; href: string }
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
  usuarios,
}: {
  pendientes: Pendiente[];
  usuarios: UsuarioOption[];
}) {
  const [items, setItems] = useState(initialPendientes);
  const [asignarLead, setAsignarLead] = useState<Pick<
    LeadDTO,
    "id" | "nombreCliente" | "vehiculo"
  > | null>(null);

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

          if (p.kind === "dormidos" || p.kind === "trabados") {
            return (
              <Link key={p.id} href={p.href} className={`${styles.taskRow} ${styles.taskRowClickable}`}>
                {body}
              </Link>
            );
          }

          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.taskRow} ${styles.taskRowClickable}`}
              onClick={() => setAsignarLead(p.lead)}
            >
              {body}
            </button>
          );
        })
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
