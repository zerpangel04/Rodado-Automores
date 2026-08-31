"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  MessageCircle,
  Table2,
  LayoutGrid,
  AlertTriangle,
  Plus,
} from "lucide-react";
import styles from "./kanban.module.css";
import panelStyles from "../panel.module.css";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { LeadDetailModal } from "./LeadDetailModal";
import { ChannelBadge } from "./ChannelBadge";

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
    id?: string;
    marca: string;
    modelo: string;
    estado?: EstadoVehiculo;
    categoria?: string | null;
    precioUsd?: number;
  } | null;
  vendedor: { id: string; nombre: string } | null;
  createdAt?: string;
};

export type VehiculoOption = {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  precioUsd: number;
  estado: EstadoVehiculo;
};
export type UsuarioOption = { id: string; nombre: string };

const stages: { key: Etapa; label: string }[] = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "TEST_DRIVE", label: "Test drive" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "CERRADO", label: "Cerrado" },
];

const COLLAPSED_STORAGE_KEY = "rodado:kanban:columnas-colapsadas";
const DEFAULT_COLLAPSED: Partial<Record<Etapa, boolean>> = { CERRADO: true };

const stageColor: Record<Etapa, string> = {
  NUEVO: "var(--info)",
  CONTACTADO: "var(--accent)",
  TEST_DRIVE: "var(--secondary)",
  NEGOCIACION: "var(--warn)",
  CERRADO: "var(--success)",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Solo se marca urgencia mientras el lead sigue "Nuevo" — una vez
// contactado, la antigüedad deja de ser una señal de alarma.
function urgenciaColor(etapa: Etapa, dias: number): "red" | "amber" | "gray" {
  if (etapa !== "NUEVO") return "gray";
  if (dias >= 15) return "red";
  if (dias >= 7) return "amber";
  return "gray";
}

function whatsappUrl(contacto: string | null) {
  if (!contacto) return null;
  const digits = contacto.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  const withCountry = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${withCountry}`;
}

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
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);

  const [filterVendedorId, setFilterVendedorId] = useState("");
  const [filterCanal, setFilterCanal] = useState<Canal | "">("");
  const [filterVehiculoId, setFilterVehiculoId] = useState("");
  const [filterQuick, setFilterQuick] = useState<"todos" | "sin_contactar" | "sin_vendedor">(
    "todos"
  );
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [vista, setVista] = useState<"kanban" | "tabla">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Partial<Record<Etapa, boolean>>>(DEFAULT_COLLAPSED);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // localStorage inaccesible (privado, cuota, etc.) — se queda con el default
    }
  }, []);

  function toggleCollapsed(stage: Etapa) {
    setCollapsed((prev) => {
      const next = { ...prev, [stage]: !prev[stage] };
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // idem
      }
      return next;
    });
  }

  const diasDesde = (iso?: string) =>
    iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;

  const staleLeads = useMemo(
    () => items.filter((l) => l.etapa === "NUEVO" && diasDesde(l.createdAt) >= 7),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((l) => {
      if (filterVendedorId && l.vendedor?.id !== filterVendedorId) return false;
      if (filterCanal && l.canal !== filterCanal) return false;
      if (filterVehiculoId && l.vehiculo?.id !== filterVehiculoId) return false;
      if (filterQuick === "sin_contactar" && l.etapa !== "NUEVO") return false;
      if (filterQuick === "sin_vendedor" && l.vendedor) return false;
      if (soloUrgentes && !(l.etapa === "NUEVO" && diasDesde(l.createdAt) >= 7)) return false;
      if (q && !l.nombreCliente.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filterVendedorId, filterCanal, filterVehiculoId, filterQuick, soloUrgentes, searchQuery]);

  const filtrosActivos = !!(
    filterVendedorId ||
    filterCanal ||
    filterVehiculoId ||
    filterQuick !== "todos" ||
    soloUrgentes ||
    searchQuery
  );

  function clearFiltros() {
    setFilterVendedorId("");
    setFilterCanal("");
    setFilterVehiculoId("");
    setFilterQuick("todos");
    setSoloUrgentes(false);
    setSearchQuery("");
  }

  // Vehículos con al menos un lead, con conteo y cuántos ya avanzaron de
  // "Nuevo" — se derivan de los leads reales, no del catálogo completo.
  const vehiculosConLeads = useMemo(() => {
    const map = new Map<string, { id: string; label: string; total: number; avanzados: number }>();
    for (const l of items) {
      if (!l.vehiculo?.id) continue;
      const entry = map.get(l.vehiculo.id) ?? {
        id: l.vehiculo.id,
        label: `${l.vehiculo.marca} ${l.vehiculo.modelo}`,
        total: 0,
        avanzados: 0,
      };
      entry.total += 1;
      if (l.etapa !== "NUEVO") entry.avanzados += 1;
      map.set(l.vehiculo.id, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [items]);

  useBodyScrollLock(showModal);

  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(e: MouseEvent) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  function openLeadDetail(lead: LeadDTO) {
    setSelectedLead(lead);
  }

  function closeLeadDetail() {
    setSelectedLead(null);
  }

  function handleLeadUpdated(updated: LeadDTO) {
    setItems((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
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
        <button className={styles.btnPrimary} onClick={openCreate}>
          <Plus size={14} />
          Nuevo lead
        </button>
      </div>

      {staleLeads.length > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={15} />
          <span>
            {staleLeads.length} lead{staleLeads.length === 1 ? "" : "s"} sin contactar hace más de
            una semana
          </span>
          <button
            type="button"
            className={styles.alertBtn}
            onClick={() => {
              setSoloUrgentes(true);
              setVista("kanban");
            }}
          >
            Ver
          </button>
        </div>
      )}

      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          {(
            [
              ["todos", "Todos"],
              ["sin_contactar", "Sin contactar"],
              ["sin_vendedor", "Sin vendedor"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={filterQuick === key ? styles.active : ""}
              onClick={() => setFilterQuick(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <Search size={14} />
          <input
            className={styles.searchInput}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre…"
          />
        </div>

        <div className={styles.dropdownWrap}>
          <select
            className={styles.filterSelect}
            value={filterVehiculoId}
            onChange={(e) => setFilterVehiculoId(e.target.value)}
          >
            <option value="">Todos los vehículos</option>
            {vehiculosConLeads.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({v.total}, {v.avanzados} avanzados)
              </option>
            ))}
          </select>
          <ChevronDown size={12} />
        </div>

        <div className={styles.dropdownWrap}>
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
          <ChevronDown size={12} />
        </div>

        {canAsignar && (
          <div className={styles.dropdownWrap}>
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
            <ChevronDown size={12} />
          </div>
        )}

        {filtrosActivos && (
          <button type="button" className={styles.filterClear} onClick={clearFiltros}>
            Limpiar filtros
          </button>
        )}

        <div className={styles.viewToggle}>
          <button
            type="button"
            className={vista === "kanban" ? styles.active : ""}
            onClick={() => setVista("kanban")}
            title="Kanban"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            className={vista === "tabla" ? styles.active : ""}
            onClick={() => setVista("tabla")}
            title="Tabla"
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>

      {vista === "tabla" ? (
        <div className={panelStyles.tableWrap}>
          <table className={panelStyles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Vehículo</th>
                <th>Canal</th>
                <th>Etapa</th>
                <th>Vendedor</th>
                <th>Antigüedad</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((lead) => {
                const dias = diasDesde(lead.createdAt);
                const urg = urgenciaColor(lead.etapa, dias);
                return (
                  <tr key={lead.id} onClick={() => openLeadDetail(lead)} style={{ cursor: "pointer" }}>
                    <td>{lead.nombreCliente}</td>
                    <td className={panelStyles.tableSub}>
                      {lead.vehiculo ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}` : "—"}
                    </td>
                    <td>
                      <ChannelBadge canal={lead.canal} />
                    </td>
                    <td>
                      <span className={styles.stageChip} style={{ color: stageColor[lead.etapa] }}>
                        <span style={{ background: stageColor[lead.etapa] }} />
                        {stages.find((s) => s.key === lead.etapa)?.label}
                      </span>
                    </td>
                    <td className={panelStyles.tableSub}>{lead.vendedor?.nombre ?? "Sin asignar"}</td>
                    <td>
                      <span className={`${styles.antiguedad} ${styles[urg]}`}>
                        hace {dias} día{dias === 1 ? "" : "s"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <p className={styles.mobileHint}>Deslizá para ver las demás etapas →</p>

          <div className={styles.kanban}>
            {stages.map((stage) => {
              const stageItems = filteredItems.filter((l) => l.etapa === stage.key);
              const valorEnJuego = stageItems.reduce(
                (sum, l) => sum + (l.vehiculo?.precioUsd ?? 0),
                0
              );
              const isCollapsed = !!collapsed[stage.key];
              return (
                <div
                  className={`${styles.kcol} ${isCollapsed ? styles.kcolCollapsed : ""}`}
                  key={stage.key}
                >
                  <div
                    className={styles.kcolHairline}
                    style={{ background: `linear-gradient(90deg, ${stageColor[stage.key]}, transparent 65%)` }}
                  />
                  <div
                    className={`${styles.kcolHead} ${isCollapsed ? styles.kcolHeadCollapsed : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleCollapsed(stage.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCollapsed(stage.key);
                      }
                    }}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={styles.kcolDot} style={{ background: stageColor[stage.key] }} />
                    {isCollapsed ? (
                      <span className={styles.kcolLabelVertical}>{stage.label}</span>
                    ) : (
                      <h4>{stage.label}</h4>
                    )}
                    <span className={styles.kcolCount}>{stageItems.length}</span>
                    {!isCollapsed && valorEnJuego > 0 && (
                      <span className={`${styles.kcolValor} mono`}>
                        USD {valorEnJuego.toLocaleString("es-AR")}
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      className={`${styles.kcolToggle} ${isCollapsed ? styles.kcolToggleCollapsed : ""}`}
                    />
                  </div>
                  {!isCollapsed && (
                  <div className={styles.kcolBody}>
                    {stageItems.length === 0 && (
                      <p className={styles.empty}>
                        {filtrosActivos ? "Sin resultados con estos filtros" : "Sin leads en esta etapa"}
                      </p>
                    )}
                    {stageItems.map((lead) => {
                      const idx = stages.findIndex((s) => s.key === lead.etapa);
                      const next = stages[idx + 1];
                      const dias = diasDesde(lead.createdAt);
                      const urg = urgenciaColor(lead.etapa, dias);
                      const wa = whatsappUrl(lead.contacto);
                      return (
                        <div
                          className={`${styles.kcard} ${urg === "red" ? styles.kcardUrgent : ""}`}
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
                          <div className={styles.kcardHead}>
                            <div className={styles.avatar}>{initials(lead.nombreCliente) || "?"}</div>
                            <div className={styles.kcardHeadInfo}>
                              <div className={styles.name}>{lead.nombreCliente}</div>
                              {lead.contacto && <div className={styles.phone}>{lead.contacto}</div>}
                            </div>
                            <div
                              className={styles.kcardMenuWrap}
                              ref={openMenuId === lead.id ? menuWrapRef : undefined}
                            >
                              <button
                                type="button"
                                className={styles.kcardMenuBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId((id) => (id === lead.id ? null : lead.id));
                                }}
                                aria-label="Más acciones"
                              >
                                ···
                              </button>
                              {openMenuId === lead.id && (
                                <div className={styles.kcardMenu}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleDelete(lead.id);
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={styles.car}>
                            {lead.vehiculo ? (
                              <>
                                {lead.vehiculo.marca} {lead.vehiculo.modelo}
                                {typeof lead.vehiculo.precioUsd === "number" && (
                                  <span className={styles.carPrice}>
                                    USD {lead.vehiculo.precioUsd.toLocaleString("es-AR")}
                                  </span>
                                )}
                              </>
                            ) : (
                              "Sin vehículo asignado"
                            )}
                          </div>

                          {lead.mensaje && (
                            <div className={styles.msgPreview}>
                              “
                              {lead.mensaje.length > 62
                                ? `${lead.mensaje.slice(0, 62)}…`
                                : lead.mensaje}
                              ”
                            </div>
                          )}

                          <div className={styles.metaRow}>
                            <ChannelBadge canal={lead.canal} />
                            <span className={`${styles.antiguedad} ${styles[urg]}`}>
                              hace {dias} día{dias === 1 ? "" : "s"}
                            </span>
                            {lead.vehiculo?.estado === "VENDIDO" && lead.etapa !== "CERRADO" && (
                              <span
                                className={styles.soldWarning}
                                title="El vehículo que le interesaba ya fue vendido"
                              >
                                !
                              </span>
                            )}
                          </div>

                          <div className={styles.kcardFoot}>
                            <div className={styles.footVendedor}>
                              <span className={styles.vendedorAvatar}>
                                {lead.vendedor ? initials(lead.vendedor.nombre) || "?" : "?"}
                              </span>
                              {canAsignar && (
                                <span className={styles.vendedorName}>
                                  {lead.vendedor?.nombre ?? "Sin asignar"}
                                </span>
                              )}
                            </div>
                            <div className={styles.footActions}>
                              {wa && (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.waBtn}
                                  onClick={(e) => e.stopPropagation()}
                                  title="WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                </a>
                              )}
                              {next && (
                                <button
                                  className={styles.kmini}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    advance(lead);
                                  }}
                                >
                                  → {next.label}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

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

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          vehiculos={vehiculos}
          usuarios={usuarios}
          canAsignar={canAsignar}
          onClose={closeLeadDetail}
          onUpdated={handleLeadUpdated}
        />
      )}

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </>
  );
}
