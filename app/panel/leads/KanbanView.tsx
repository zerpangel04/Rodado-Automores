"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./kanban.module.css";
import { Pill, type PillColor } from "../Pill";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export type Canal = "WHATSAPP" | "MERCADO_LIBRE" | "INSTAGRAM" | "WEB" | "WEB_IA";
export type Etapa = "NUEVO" | "CONTACTADO" | "TEST_DRIVE" | "NEGOCIACION" | "CERRADO";

export type EstadoVehiculo = "DISPONIBLE" | "RESERVADO" | "VENDIDO";

export type LeadDTO = {
  id: string;
  nombreCliente: string;
  contacto: string | null;
  mensaje?: string | null;
  canal: Canal;
  etapa: Etapa;
  vehiculo: {
    marca: string;
    modelo: string;
    estado?: EstadoVehiculo;
    categoria?: string | null;
    precioUsd?: number;
  } | null;
  vendedor: { id: string; nombre: string } | null;
  createdAt?: string;
};

type VehiculoOption = {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  precioUsd: number;
  estado: EstadoVehiculo;
};
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
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);
  const [showReassignInModal, setShowReassignInModal] = useState(false);

  const [filterVendedorId, setFilterVendedorId] = useState("");
  const [filterCanal, setFilterCanal] = useState<Canal | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((l) => {
      if (filterVendedorId && l.vendedor?.id !== filterVendedorId) return false;
      if (filterCanal && l.canal !== filterCanal) return false;
      if (q && !l.nombreCliente.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filterVendedorId, filterCanal, searchQuery]);

  const filtrosActivos = !!(filterVendedorId || filterCanal || searchQuery);

  function clearFiltros() {
    setFilterVendedorId("");
    setFilterCanal("");
    setSearchQuery("");
  }

  useBodyScrollLock(showModal || !!selectedLead);

  function openLeadDetail(lead: LeadDTO) {
    setSelectedLead(lead);
    setShowReassignInModal(false);
  }

  function closeLeadDetail() {
    setSelectedLead(null);
    setShowReassignInModal(false);
  }

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
    if (!selectedLead || !newVehiculoId) return;
    const target = vehiculos.find((v) => v.id === newVehiculoId);
    if (!target) return;

    const res = await fetch(`/api/leads/${selectedLead.id}`, {
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
    setItems((prev) =>
      prev.map((l) => (l.id === selectedLead.id ? { ...l, vehiculo: nuevoVehiculo } : l))
    );
    setSelectedLead((prev) => (prev ? { ...prev, vehiculo: nuevoVehiculo } : prev));
    setShowReassignInModal(false);
    showToast();
  }

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

      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre…"
        />
        <select
          className={styles.filterSelect}
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value as Canal | "")}
        >
          <option value="">Todos los canales</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="MERCADO_LIBRE">Mercado Libre</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="WEB">Web</option>
          <option value="WEB_IA">Asistente IA</option>
        </select>
        {canAsignar && (
          <select
            className={styles.filterSelect}
            value={filterVendedorId}
            onChange={(e) => setFilterVendedorId(e.target.value)}
          >
            <option value="">Todos los vendedores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        )}
        {filtrosActivos && (
          <button type="button" className={styles.filterClear} onClick={clearFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      <p className={styles.mobileHint}>Deslizá para ver las demás etapas →</p>

      <div className={styles.kanban}>
        {stages.map((stage) => {
          const stageItems = filteredItems.filter((l) => l.etapa === stage.key);
          return (
            <div className={styles.kcol} key={stage.key}>
              <div className={styles.kcolHead}>
                <h4>{stage.label}</h4>
                <span>{stageItems.length}</span>
              </div>
              {stageItems.length === 0 && (
                <p className={styles.empty}>
                  {filtrosActivos ? "Sin resultados con estos filtros" : "Sin leads"}
                </p>
              )}
              {stageItems.map((lead) => {
                const idx = stages.findIndex((s) => s.key === lead.etapa);
                const next = stages[idx + 1];
                return (
                  <div
                    className={styles.kcard}
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openLeadDetail(lead)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLeadDetail(lead);
                      }
                    }}
                  >
                    <div className={styles.name}>{lead.nombreCliente}</div>
                    <div className={styles.car}>
                      {lead.vehiculo
                        ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}`
                        : "Sin vehículo asignado"}
                    </div>

                    <div className={styles.metaRow}>
                      <Pill color={canalColor[lead.canal]}>{canalLabel[lead.canal]}</Pill>
                      {lead.vehiculo?.estado === "VENDIDO" && lead.etapa !== "CERRADO" && (
                        <span
                          className={styles.soldWarning}
                          title="El vehículo que le interesaba ya fue vendido"
                        >
                          !
                        </span>
                      )}
                    </div>

                    {canAsignar && lead.vendedor && (
                      <div className={styles.vendedor}>Vendedor: {lead.vendedor.nombre}</div>
                    )}
                    {lead.mensaje && <div className={styles.msgPreview}>“{lead.mensaje}”</div>}

                    <div className={styles.kcardActions}>
                      {next ? (
                        <button
                          className={styles.kmini}
                          onClick={(e) => {
                            e.stopPropagation();
                            advance(lead);
                          }}
                        >
                          → {next.label}
                        </button>
                      ) : null}
                      <button
                        className={styles.kmini}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lead.id);
                        }}
                      >
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

      <div className={`${styles.modalBg} ${selectedLead ? styles.show : ""}`} onClick={closeLeadDetail}>
        {selectedLead && (
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className="disp">{selectedLead.nombreCliente}</h3>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Contacto</span>
              <span className={styles.detailValue}>{selectedLead.contacto || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Vehículo de interés</span>
              <span className={styles.detailValue}>
                {selectedLead.vehiculo
                  ? `${selectedLead.vehiculo.marca} ${selectedLead.vehiculo.modelo}`
                  : "Sin vehículo asignado"}
              </span>
            </div>

            {selectedLead.vehiculo?.estado === "VENDIDO" && selectedLead.etapa !== "CERRADO" && (
              <div className={styles.soldAlert}>
                <span>
                  ⚠ El {selectedLead.vehiculo.marca} {selectedLead.vehiculo.modelo} que le
                  interesaba a este lead ya fue vendido.
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
                      {suggestedVehiculosFor(selectedLead.vehiculo).map((v) => (
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
                <Pill color={canalColor[selectedLead.canal]}>{canalLabel[selectedLead.canal]}</Pill>
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fecha de creación</span>
              <span className={styles.detailValue}>{formatFecha(selectedLead.createdAt)}</span>
            </div>
            {canAsignar && selectedLead.vendedor && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Vendedor asignado</span>
                <span className={styles.detailValue}>{selectedLead.vendedor.nombre}</span>
              </div>
            )}

            <div className={styles.field}>
              <label>
                {selectedLead.canal === "WEB_IA"
                  ? "Mensaje / resumen del asistente IA"
                  : "Mensaje"}
              </label>
              {selectedLead.mensaje ? (
                <p className={styles.msgBox}>{selectedLead.mensaje}</p>
              ) : (
                <p className={styles.msgBoxEmpty}>Este lead no dejó ningún mensaje.</p>
              )}
              {selectedLead.canal === "WEB_IA" && (
                <p className={styles.msgHint}>
                  No guardamos el historial completo de la conversación con el asistente —
                  esto es el resumen que generó el lead.
                </p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={closeLeadDetail}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </>
  );
}
