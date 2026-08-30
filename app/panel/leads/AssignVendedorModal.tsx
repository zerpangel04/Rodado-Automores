"use client";

import { useState } from "react";
import styles from "./kanban.module.css";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { LeadDTO } from "./KanbanView";

export type UsuarioOption = { id: string; nombre: string };

export function AssignVendedorModal({
  lead,
  usuarios,
  onClose,
  onUpdated,
}: {
  lead: Pick<LeadDTO, "id" | "nombreCliente" | "vehiculo">;
  usuarios: UsuarioOption[];
  onClose: () => void;
  onUpdated: (lead: LeadDTO) => void;
}) {
  const [vendedorId, setVendedorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(true);

  async function handleSave() {
    if (!vendedorId) {
      setError("Elegí un vendedor");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendedorId }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo asignar el vendedor");
      return;
    }
    const saved: LeadDTO = await res.json();
    onUpdated(saved);
  }

  return (
    <div className={`${styles.modalBg} ${styles.show}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className="disp">Asignar vendedor</h3>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Lead</span>
          <span className={styles.detailValue}>{lead.nombreCliente}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Vehículo de interés</span>
          <span className={styles.detailValue}>
            {lead.vehiculo ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}` : "Sin vehículo asignado"}
          </span>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.field}>
          <label>Vendedor</label>
          <select
            autoFocus
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="" disabled>
              Elegí un vendedor…
            </option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? "Asignando…" : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
