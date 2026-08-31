"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Plus, AlertTriangle, Building2 } from "lucide-react";
import styles from "./sucursales.module.css";
import { KpiBar } from "../KpiBar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export type SucursalDTO = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  vehiculosCount: number;
  esPrincipal: boolean;
  leadsActivos: number;
  ventasEsteMes: number;
  facturadoEsteMes: number;
  participacionStock: number;
  equipo: { id: string; nombre: string }[];
};

type ResumenDTO = {
  sucursalesActivas: number;
  stockTotal: number;
  stockPorSucursal: number[];
  ventasMes: number;
  facturadoMes: number;
  equipoAsignado: number;
  totalUsuarios: number;
  vendedoresSinSucursal: number;
};

type FormState = {
  nombre: string;
  direccion: string;
  telefono: string;
};

const emptyForm: FormState = { nombre: "", direccion: "", telefono: "" };

const paleta = [
  { color: "var(--accent)", bg: "rgba(240,161,60,0.12)", border: "rgba(240,161,60,0.26)" },
  { color: "var(--info)", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.26)" },
  { color: "var(--secondary)", bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.26)" },
  { color: "var(--success)", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.26)" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function usd(n: number) {
  return `USD ${Math.round(n).toLocaleString("es-AR")}`;
}

export function SucursalesView({
  initialItems,
  resumen,
  onVerStock,
}: {
  initialItems: SucursalDTO[];
  resumen: ResumenDTO;
  onVerStock: (sucursalId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<SucursalDTO[]>(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(showModal);

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

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 1400);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  function openEdit(s: SucursalDTO) {
    setEditingId(s.id);
    setForm({ nombre: s.nombre, direccion: s.direccion ?? "", telefono: s.telefono ?? "" });
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
    };

    try {
      const res = await fetch(editingId ? `/api/sucursales/${editingId}` : "/api/sucursales", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo guardar la sucursal");
        setSaving(false);
        return;
      }
      const saved = await res.json();
      setItems((prev) =>
        editingId
          ? prev.map((i) => (i.id === saved.id ? { ...i, ...saved } : i))
          : [
              ...prev,
              {
                ...saved,
                vehiculosCount: 0,
                esPrincipal: false,
                leadsActivos: 0,
                ventasEsteMes: 0,
                facturadoEsteMes: 0,
                participacionStock: 0,
                equipo: [],
              },
            ]
      );
      showToast();
      setShowModal(false);
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: SucursalDTO) {
    setOpenMenuId(null);
    if (!confirm(`¿Eliminar la sucursal "${s.nombre}"?`)) return;
    const res = await fetch(`/api/sucursales/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== s.id));
      showToast();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar la sucursal");
    }
  }

  function handleVerStock(id: string) {
    startTransition(async () => {
      await onVerStock(id);
      router.push("/panel/stock");
    });
  }

  const incompletas = items.filter((s) => !s.direccion || !s.telefono);
  const primeraIncompleta = incompletas[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        <button type="button" className={styles.newBtn} onClick={openCreate}>
          <Plus size={14} />
          Nueva sucursal
        </button>
      </div>

      {primeraIncompleta && (
        <div className={styles.alertBanner}>
          <span className={styles.alertIcon}>
            <AlertTriangle size={14} />
          </span>
          <div className={styles.alertBody}>
            <div className={styles.alertTitulo}>
              {incompletas.length === 1
                ? `${primeraIncompleta.nombre} no tiene dirección ni teléfono cargados`
                : `${incompletas.length} sucursales sin dirección ni teléfono cargados`}
            </div>
            <div className={styles.alertDetalle}>
              Sin dirección ni teléfono, los compradores del catálogo no saben dónde ver el auto.
            </div>
          </div>
          <button type="button" className={styles.alertBtn} onClick={() => openEdit(primeraIncompleta)}>
            Completar datos
          </button>
        </div>
      )}

      <div className={styles.kpiRow}>
        <KpiBar
          color="var(--accent)"
          label="Sucursales activas"
          value={String(resumen.sucursalesActivas)}
          unit="locales"
          trend={{
            label: resumen.sucursalesActivas === 1 ? "única sucursal" : "1 principal",
            positive: "neutral",
          }}
          percent={100}
        />
        <KpiBar
          color="var(--success)"
          label="Stock distribuido"
          value={String(resumen.stockTotal)}
          unit="vehículos"
          trend={{
            label:
              resumen.stockPorSucursal.length <= 3
                ? resumen.stockPorSucursal.join(" / ")
                : `en ${resumen.stockPorSucursal.length} sucursales`,
            positive: "neutral",
          }}
          percent={
            resumen.stockTotal > 0
              ? Math.round((Math.max(...resumen.stockPorSucursal, 0) / resumen.stockTotal) * 100)
              : 0
          }
        />
        <KpiBar
          color="var(--info)"
          label="Ventas del mes"
          value={String(resumen.ventasMes)}
          unit="operaciones"
          trend={{ label: usd(resumen.facturadoMes), positive: "neutral" }}
          percent={
            resumen.stockTotal > 0 ? Math.min(100, Math.round((resumen.ventasMes / resumen.stockTotal) * 100)) : 0
          }
        />
        <KpiBar
          color="var(--secondary)"
          label="Equipo asignado"
          value={String(resumen.equipoAsignado)}
          unit="personas"
          trend={
            resumen.vendedoresSinSucursal > 0
              ? {
                  label: `${resumen.vendedoresSinSucursal} sin sucursal`,
                  positive: false,
                }
              : { label: "todos asignados", positive: true }
          }
          percent={resumen.totalUsuarios > 0 ? Math.round((resumen.equipoAsignado / resumen.totalUsuarios) * 100) : 0}
        />
      </div>

      <div className={styles.grid}>
        {items.map((s, idx) => {
          const pal = paleta[idx % paleta.length];
          return (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardHairline} style={{ background: `linear-gradient(90deg, ${pal.color}, transparent 75%)` }} />
              <div className={styles.cardHead}>
                <div
                  className={styles.cardIcon}
                  style={{ color: pal.color, background: pal.bg, borderColor: pal.border }}
                >
                  <Building2 size={16} />
                </div>
                <div className={styles.cardHeadInfo}>
                  <div className={styles.cardHeadTop}>
                    <div className={styles.cardNombre}>{s.nombre}</div>
                    {s.esPrincipal && <span className={styles.badge}>PRINCIPAL</span>}
                  </div>
                  <div className={styles.cardSubtitulo}>
                    {s.vehiculosCount} {s.vehiculosCount === 1 ? "vehículo" : "vehículos"} ·{" "}
                    {s.equipo.length} {s.equipo.length === 1 ? "vendedor" : "vendedores"}
                  </div>
                </div>
                <div className={styles.cardMenuWrap} ref={openMenuId === s.id ? menuWrapRef : undefined}>
                  <button
                    type="button"
                    className={styles.cardMenuBtn}
                    onClick={() => setOpenMenuId((id) => (id === s.id ? null : s.id))}
                    aria-label="Más acciones"
                  >
                    ···
                  </button>
                  {openMenuId === s.id && (
                    <div className={styles.cardMenu}>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        disabled={items.length <= 1}
                        title={items.length <= 1 ? "No podés eliminar la única sucursal" : undefined}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardContact}>
                <div className={styles.contactRow}>
                  <MapPin size={13} className={styles.contactIcon} />
                  <div className={s.direccion ? styles.contactValue : styles.contactMissing}>
                    {s.direccion || "Falta cargar la dirección"}
                  </div>
                  {!s.direccion && (
                    <button type="button" className={styles.cargarBtn} onClick={() => openEdit(s)}>
                      Cargar
                    </button>
                  )}
                </div>
                <div className={styles.contactRow}>
                  <Phone size={13} className={styles.contactIcon} />
                  <div className={`${s.telefono ? styles.contactValue : styles.contactMissing} mono`}>
                    {s.telefono || "Falta cargar el teléfono"}
                  </div>
                  {!s.telefono && (
                    <button type="button" className={styles.cargarBtn} onClick={() => openEdit(s)}>
                      Cargar
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>STOCK</div>
                  <div className={styles.metricValue}>{s.vehiculosCount}</div>
                  <div className={styles.metricNote}>en el local</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>LEADS</div>
                  <div className={styles.metricValue}>{s.leadsActivos}</div>
                  <div className={styles.metricNote}>activos</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>VENTAS</div>
                  <div className={styles.metricValue}>{s.ventasEsteMes}</div>
                  <div className={styles.metricNote}>este mes</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>FACTURADO</div>
                  <div className={`${styles.metricValue} ${styles.metricAccent}`}>
                    {(s.facturadoEsteMes / 1000).toFixed(1).replace(".", ",")}k
                  </div>
                  <div className={styles.metricNote}>USD del mes</div>
                </div>
              </div>

              <div className={styles.shareRow}>
                <div className={styles.shareHead}>
                  <span>PARTICIPACIÓN DEL STOCK</span>
                  <span className={styles.shareValue}>{s.participacionStock}%</span>
                </div>
                <div className={styles.shareTrack}>
                  <div className={styles.shareFill} style={{ width: `${s.participacionStock}%` }} />
                </div>
              </div>

              <div className={styles.cardFoot}>
                <div className={styles.footTeam}>
                  {s.equipo.length > 0 ? (
                    <>
                      <div className={styles.avatarStack}>
                        {s.equipo.slice(0, 4).map((e) => (
                          <span key={e.id} className={styles.avatar} style={{ borderColor: "var(--surface)" }}>
                            {initials(e.nombre)}
                          </span>
                        ))}
                      </div>
                      <div className={styles.footTeamText}>
                        {s.equipo.length === 1 ? s.equipo[0].nombre : `${s.equipo[0].nombre} +${s.equipo.length - 1}`}
                      </div>
                    </>
                  ) : (
                    <div className={styles.footTeamEmpty}>Sin vendedores con actividad todavía</div>
                  )}
                </div>
                <div className={styles.footActions}>
                  <button type="button" className={styles.editBtn} onClick={() => openEdit(s)}>
                    Editar
                  </button>
                  <button type="button" className={styles.stockBtn} onClick={() => handleVerStock(s.id)}>
                    Ver stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button type="button" className={styles.addCard} onClick={openCreate}>
          <div className={styles.addIcon}>
            <Plus size={17} />
          </div>
          <div className={styles.addTitulo}>Agregar otra sucursal</div>
          <div className={styles.addDetalle}>
            Cada sucursal maneja su propio stock y su equipo, y podés ver todo consolidado.
          </div>
        </button>
      </div>

      <div className={`${styles.modalBg} ${showModal ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">{editingId ? "Editar sucursal" : "Nueva sucursal"}</h3>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label>Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Sucursal Norte"
            />
          </div>
          <div className={styles.field}>
            <label>Dirección</label>
            <input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Av. Siempre Viva 742"
            />
          </div>
          <div className={styles.field}>
            <label>Teléfono</label>
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="11 5555-5555"
            />
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnGhost} onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear sucursal"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </div>
  );
}
