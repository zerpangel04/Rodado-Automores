"use client";

import { useState } from "react";
import styles from "./kanban.module.css";
import { Pill, type PillColor } from "../Pill";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { LeadDTO, Etapa } from "./KanbanView";

export type VehiculoOption = {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  precioUsd: number;
  estado: "DISPONIBLE" | "RESERVADO" | "VENDIDO";
};

const stages: { key: Etapa; label: string }[] = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "TEST_DRIVE", label: "Test drive" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "CERRADO", label: "Cerrado" },
];

const canalLabel: Record<LeadDTO["canal"], string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
  WEB_IA: "Asistente IA",
};

const canalColor: Record<LeadDTO["canal"], PillColor> = {
  WHATSAPP: "green",
  MERCADO_LIBRE: "amber",
  INSTAGRAM: "purple",
  WEB: "blue",
  WEB_IA: "gray",
};

function formatFecha(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadDetailModal({
  lead,
  vehiculos,
  canAsignar,
  onClose,
  onUpdated,
}: {
  lead: LeadDTO;
  vehiculos: VehiculoOption[];
  canAsignar: boolean;
  onClose: () => void;
  onUpdated: (lead: LeadDTO) => void;
}) {
  const [showReassignInModal, setShowReassignInModal] = useState(false);
  const [savingEtapa, setSavingEtapa] = useState(false);

  useBodyScrollLock(true);

  // Mismo criterio que en Stock: primero vehículos disponibles de la misma
  // categoría, después por precio más cercano al del auto vendido.
  function suggestedVehiculosFor(
    target: { categoria?: string | null; precioUsd?: number } | null | undefined
  ) {
    const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE");
    if (!target) return disponibles;
    return disponibles.slice().sort((a, b) => {
      const aSame = a.categoria === target.categoria ? 0 : 1;
      const bSame = b.categoria === target.categoria ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return Math.abs(a.precioUsd - (target.precioUsd ?? 0)) - Math.abs(b.precioUsd - (target.precioUsd ?? 0));
    });
  }

  async function handleReassignSelected(newVehiculoId: string) {
    if (!newVehiculoId) return;
    const target = vehiculos.find((v) => v.id === newVehiculoId);
    if (!target) return;

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehiculoId: newVehiculoId }),
    });
    if (!res.ok) {
      setShowReassignInModal(false);
      return;
    }

    const nuevoVehiculo = {
      marca: target.marca,
      modelo: target.modelo,
      estado: target.estado,
      categoria: target.categoria,
      precioUsd: target.precioUsd,
    };
    setShowReassignInModal(false);
    onUpdated({ ...lead, vehiculo: nuevoVehiculo });
  }

  async function handleEtapaChange(nuevaEtapa: Etapa) {
    if (nuevaEtapa === lead.etapa) return;
    setSavingEtapa(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa: nuevaEtapa }),
    });
    setSavingEtapa(false);
    if (res.ok) {
      const saved: LeadDTO = await res.json();
      onUpdated(saved);
    }
  }

  return (
    <div className={`${styles.modalBg} ${styles.show}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className="disp">{lead.nombreCliente}</h3>

        <div className={styles.field}>
          <label>Etapa</label>
          <select
            value={lead.etapa}
            disabled={savingEtapa}
            onChange={(e) => handleEtapaChange(e.target.value as Etapa)}
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Contacto</span>
          <span className={styles.detailValue}>{lead.contacto || "—"}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Vehículo de interés</span>
          <span className={styles.detailValue}>
            {lead.vehiculo ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}` : "Sin vehículo asignado"}
          </span>
        </div>

        {lead.vehiculo?.estado === "VENDIDO" && lead.etapa !== "CERRADO" && (
          <div className={styles.soldAlert}>
            <span>
              ⚠ El {lead.vehiculo.marca} {lead.vehiculo.modelo} que le interesaba a este lead ya
              fue vendido.
            </span>
            {showReassignInModal ? (
              <div className={styles.reassignRow}>
                <select
                  className={styles.reassignSelect}
                  autoFocus
                  defaultValue=""
                  onChange={(e) => handleReassignSelected(e.target.value)}
                >
                  <option value="" disabled>
                    Elegí un vehículo…
                  </option>
                  {suggestedVehiculosFor(lead.vehiculo).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — USD {v.precioUsd.toLocaleString("es-AR")}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.reassignCancel}
                  onClick={() => setShowReassignInModal(false)}
                  aria-label="Cancelar reasignación"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.reassignBtn}
                onClick={() => setShowReassignInModal(true)}
              >
                Reasignar a otro vehículo
              </button>
            )}
          </div>
        )}

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Canal de origen</span>
          <span className={styles.detailValue}>
            <Pill color={canalColor[lead.canal]}>{canalLabel[lead.canal]}</Pill>
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Fecha de creación</span>
          <span className={styles.detailValue}>{formatFecha(lead.createdAt)}</span>
        </div>
        {canAsignar && lead.vendedor && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Vendedor asignado</span>
            <span className={styles.detailValue}>{lead.vendedor.nombre}</span>
          </div>
        )}

        <div className={styles.field}>
          <label>{lead.canal === "WEB_IA" ? "Mensaje / resumen del asistente IA" : "Mensaje"}</label>
          {lead.mensaje ? (
            <p className={styles.msgBox}>{lead.mensaje}</p>
          ) : (
            <p className={styles.msgBoxEmpty}>Este lead no dejó ningún mensaje.</p>
          )}
          {lead.canal === "WEB_IA" && (
            <p className={styles.msgHint}>
              No guardamos el historial completo de la conversación con el asistente — esto es el
              resumen que generó el lead.
            </p>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
