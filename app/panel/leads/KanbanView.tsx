"use client";

import { useEffect, useState } from "react";
import styles from "./kanban.module.css";
import { Pill, type PillColor } from "../Pill";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export type Canal = "WHATSAPP" | "MERCADO_LIBRE" | "INSTAGRAM" | "WEB" | "WEB_IA";
export type Etapa = "NUEVO" | "CONTACTADO" | "TEST_DRIVE" | "NEGOCIACION" | "CERRADO";

export type LeadDTO = {
  id: string;
  nombreCliente: string;
  contacto: string | null;
  canal: Canal;
  etapa: Etapa;
  vehiculo: { marca: string; modelo: string } | null;
  vendedor: { id: string; nombre: string } | null;
};

type VehiculoOption = { id: string; marca: string; modelo: string };
type UsuarioOption = { id: string; nombre: string };

const stages: { key: Etapa; label: string }[] = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "TEST_DRIVE", label: "Test drive" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "CERRADO", label: "Cerrado" },
];

const canalLabel: Record<Canal, string> = {
  WHATSAPP: "WhatsApp",
  MERCADO_LIBRE: "Mercado Libre",
  INSTAGRAM: "Instagram",
  WEB: "Web",
  WEB_IA: "Asistente IA",
};

const canalColor: Record<Canal, PillColor> = {
  WHATSAPP: "green",
  MERCADO_LIBRE: "amber",
  INSTAGRAM: "purple",
  WEB: "blue",
  WEB_IA: "gray",
};

type FormState = {
  nombreCliente: string;
  contacto: string;
  canal: Canal;
  vehiculoId: string;
  vendedorId: string;
};

const emptyForm: FormState = {
  nombreCliente: "",
  contacto: "",
  canal: "WHATSAPP",
  vehiculoId: "",
  vendedorId: "",
};

export function KanbanView({
  initialItems,
  vehiculos,
  usuarios,
  canAsignar,
  userId,
}: {
  initialItems: LeadDTO[];
  vehiculos: VehiculoOption[];
  usuarios: UsuarioOption[];
  canAsignar: boolean;
  userId: string;
}) {
  const [items, setItems] = useState<LeadDTO[]>(initialItems);
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  useBodyScrollLock(showModal);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 1400);
  }

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nombreCliente.trim()) {
      setError("Completá el nombre del cliente");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nombreCliente: form.nombreCliente.trim(),
      contacto: form.contacto.trim() || null,
      canal: form.canal,
      vehiculoId: form.vehiculoId || null,
      vendedorId: canAsignar ? form.vendedorId || null : userId,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo guardar el lead");
        setSaving(false);
        return;
      }
      const saved: LeadDTO = await res.json();
      setItems((prev) => [saved, ...prev]);
      showToast();
      setShowModal(false);
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function advance(lead: LeadDTO) {
    const idx = stages.findIndex((s) => s.key === lead.etapa);
    const next = stages[idx + 1];
    if (!next) return;
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa: next.key }),
    });
    if (res.ok) {
      const saved: LeadDTO = await res.json();
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      showToast();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este lead?")) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast();
    }
  }

  return (
    <>
      <div className={styles.topActions}>
        <button className={styles.btnGhost} onClick={openCreate}>
          + Nuevo lead
        </button>
      </div>

      <p className={styles.mobileHint}>Deslizá para ver las demás etapas →</p>

      <div className={styles.kanban}>
        {stages.map((stage) => {
          const stageItems = items.filter((l) => l.etapa === stage.key);
          return (
            <div className={styles.kcol} key={stage.key}>
              <div className={styles.kcolHead}>
                <h4>{stage.label}</h4>
                <span>{stageItems.length}</span>
              </div>
              {stageItems.length === 0 && (
                <p className={styles.empty}>Sin leads</p>
              )}
              {stageItems.map((lead) => {
                const idx = stages.findIndex((s) => s.key === lead.etapa);
                const next = stages[idx + 1];
                return (
                  <div className={styles.kcard} key={lead.id}>
                    <div className={styles.name}>{lead.nombreCliente}</div>
                    <div className={styles.car}>
                      {lead.vehiculo
                        ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}`
                        : "Sin vehículo asignado"}
                    </div>
                    {canAsignar && lead.vendedor && (
                      <div className={styles.vendedor}>Vendedor: {lead.vendedor.nombre}</div>
                    )}
                    <div className={styles.foot}>
                      <Pill color={canalColor[lead.canal]}>{canalLabel[lead.canal]}</Pill>
                    </div>
                    <div className={styles.kcardActions}>
                      {next ? (
                        <button className={styles.kmini} onClick={() => advance(lead)}>
                          → {next.label}
                        </button>
                      ) : null}
                      <button className={styles.kmini} onClick={() => handleDelete(lead.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={`${styles.modalBg} ${showModal ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">Nuevo lead</h3>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label>Nombre del cliente</label>
            <input
              value={form.nombreCliente}
              onChange={(e) => setForm({ ...form, nombreCliente: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>
          <div className={styles.field}>
            <label>Contacto</label>
            <input
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              placeholder="Teléfono o email"
            />
          </div>
          <div className={styles.field}>
            <label>Canal</label>
            <select
              value={form.canal}
              onChange={(e) => setForm({ ...form, canal: e.target.value as Canal })}
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="MERCADO_LIBRE">Mercado Libre</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WEB">Web</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Vehículo de interés</label>
            <select
              value={form.vehiculoId}
              onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
            >
              <option value="">Sin especificar</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>
          {canAsignar && (
            <div className={styles.field}>
              <label>Asignar a</label>
              <select
                value={form.vendedorId}
                onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.modalActions}>
            <button className={styles.btnGhost} onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar lead"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </>
  );
}
