"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Star, UserRound, X } from "lucide-react";
import styles from "./equipo.module.css";
import { KpiBar } from "../KpiBar";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export type Rol = "DUENIO" | "ADMIN" | "VENDEDOR";

export type UsuarioDTO = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  sucursal: string;
  sucColor: string;
  actividad: string;
  enLinea: boolean;
  leadsActivos: number;
  ventasEsteMes: number;
  cierre: number;
  comisionEsteMes: number;
};

type ResumenDTO = {
  personas: number;
  duenios: number;
  vendedores: number;
  admins: number;
  leadsAsignados: number;
  leadsActivosTotalTenant: number;
  sinAsignar: number;
  cierreEquipo: number;
  totalVentasMes: number;
  totalComisionMes: number;
};

type CargaItem = { id: string; nombre: string; leads: number };

const rolLabel: Record<Rol, string> = { DUENIO: "DUEÑO", ADMIN: "ADMIN", VENDEDOR: "VENDEDOR" };

type Filtro = "todos" | "dueño" | "vendedores";

type FormState = { nombre: string; email: string; password: string; rol: Rol };
const emptyForm: FormState = { nombre: "", email: "", password: "", rol: "VENDEDOR" };

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

export function EquipoView({
  initialItems,
  userId,
  resumen,
  carga,
}: {
  initialItems: UsuarioDTO[];
  userId: string;
  resumen: ResumenDTO;
  carga: CargaItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<UsuarioDTO[]>(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);

  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [permisosFor, setPermisosFor] = useState<UsuarioDTO | null>(null);
  const [fichaFor, setFichaFor] = useState<UsuarioDTO | null>(null);
  const [repartiendo, setRepartiendo] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(showModal || !!permisosFor || !!fichaFor);

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

  const pasaFiltro = (u: UsuarioDTO, f: Filtro) =>
    f === "todos" || (f === "dueño" ? u.rol === "DUENIO" : u.rol !== "DUENIO");

  const lista = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((u) => {
      if (!pasaFiltro(u, filtro)) return false;
      if (q && !u.nombre.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filtro, searchQuery]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.email.trim() || form.password.length < 8) {
      setError("Completá nombre, email y una contraseña de al menos 8 caracteres");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rol: form.rol,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo crear el usuario");
        setSaving(false);
        return;
      }
      showToast();
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: UsuarioDTO) {
    setOpenMenuId(null);
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== u.id));
      showToast();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar el usuario");
    }
  }

  async function handleCambiarRol(nuevoRol: Rol) {
    if (!permisosFor) return;
    setSaving(true);
    const res = await fetch(`/api/usuarios/${permisosFor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    setSaving(false);
    if (res.ok) {
      setPermisosFor(null);
      showToast();
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo cambiar el rol");
    }
  }

  async function handleRepartir() {
    if (!confirm(`¿Repartir los ${resumen.sinAsignar} leads sin asignar entre el equipo?`)) return;
    setRepartiendo(true);
    const res = await fetch("/api/leads/repartir", { method: "POST" });
    setRepartiendo(false);
    if (res.ok) {
      showToast();
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo repartir los leads");
    }
  }

  const roles = [
    {
      icon: Star,
      titulo: "Dueño",
      detalle:
        "Ve toda la operación: stock, leads y ventas de todas las sucursales, reportes y comisiones de todo el equipo.",
      cuenta: resumen.duenios,
      color: "var(--accent-xlight)",
      bg: "rgba(240,161,60,0.12)",
      border: "rgba(240,161,60,0.26)",
    },
    {
      icon: UserRound,
      titulo: "Vendedor",
      detalle:
        "Ve solo sus propios leads y sus ventas, y el stock de su sucursal. No accede a reportes ni a comisiones ajenas.",
      cuenta: resumen.vendedores,
      color: "#c3c9cf",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.12)",
    },
    ...(resumen.admins > 0
      ? [
          {
            icon: UserRound,
            titulo: "Admin",
            detalle: "Ve lo mismo que el Dueño en la operación diaria, pero no entra a Sucursales ni Equipo.",
            cuenta: resumen.admins,
            color: "#c3c9cf",
            bg: "rgba(255,255,255,0.06)",
            border: "rgba(255,255,255,0.12)",
          },
        ]
      : []),
  ];

  const maxCarga = Math.max(...carga.map((c) => c.leads), 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        <div className={styles.segmented}>
          {(
            [
              ["todos", "Todos"],
              ["dueño", "Dueño"],
              ["vendedores", "Vendedores"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filtro === key ? styles.active : ""}
              onClick={() => setFiltro(key)}
            >
              {label}
              <span className={styles.count}>{items.filter((u) => pasaFiltro(u, key)).length}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.newBtn} onClick={openCreate}>
          <Plus size={14} />
          Invitar usuario
        </button>
      </div>

      <div className={styles.searchWrap}>
        <Search size={14} />
        <input
          className={styles.searchInput}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o email…"
        />
      </div>

      <div className={styles.kpiRow}>
        <KpiBar
          color="var(--accent)"
          label="Personas en el equipo"
          value={String(resumen.personas)}
          unit="usuarios"
          trend={{
            label:
              `${resumen.duenios} dueño${resumen.duenios === 1 ? "" : "s"} · ${resumen.vendedores} vendedor${
                resumen.vendedores === 1 ? "" : "es"
              }` + (resumen.admins > 0 ? ` · ${resumen.admins} admin` : ""),
            positive: "neutral",
          }}
          percent={100}
        />
        <KpiBar
          color="var(--info)"
          label="Leads asignados"
          value={String(resumen.leadsAsignados)}
          unit={`de ${resumen.leadsActivosTotalTenant}`}
          trend={
            resumen.sinAsignar > 0
              ? { label: `${resumen.sinAsignar} sin asignar`, positive: false }
              : { label: "todos asignados", positive: true }
          }
          percent={
            resumen.leadsActivosTotalTenant > 0
              ? Math.round((resumen.leadsAsignados / resumen.leadsActivosTotalTenant) * 100)
              : 0
          }
        />
        <KpiBar
          color="var(--success)"
          label="Cierre del equipo"
          value={`${resumen.cierreEquipo}%`}
          unit={`${resumen.totalVentasMes} ventas`}
          trend={{ label: "este mes", positive: "neutral" }}
          percent={Math.min(100, resumen.cierreEquipo)}
        />
        <KpiBar
          color="var(--secondary)"
          label="Comisiones del mes"
          value={resumen.totalComisionMes.toLocaleString("es-AR")}
          unit="USD"
          trend={{ label: "a liquidar", positive: "neutral" }}
          percent={100}
        />
      </div>

      <div className={styles.personas}>
        {lista.length === 0 ? (
          <p className={styles.empty}>Sin resultados con estos filtros</p>
        ) : (
          lista.map((u) => (
            <div key={u.id} className={styles.personaRow}>
              <div className={styles.personaInfo}>
                <div className={styles.avatarWrap}>
                  <div className={styles.avatar}>{initials(u.nombre)}</div>
                  <span
                    className={styles.estadoDot}
                    style={{ background: u.enLinea ? "var(--success)" : "#5d656d" }}
                  />
                </div>
                <div className={styles.personaBody}>
                  <div className={styles.personaTop}>
                    <div className={styles.personaNombre}>{u.nombre}</div>
                    <span className={`${styles.rolChip} ${u.rol === "DUENIO" ? styles.rolChipDueno : ""}`}>
                      {rolLabel[u.rol]}
                    </span>
                  </div>
                  <div className={styles.personaEmail}>{u.email}</div>
                  <div className={styles.personaMeta}>
                    <span className={styles.personaMetaItem}>
                      <span className={styles.metaDot} style={{ background: u.sucColor }} />
                      {u.sucursal}
                    </span>
                    <span className={styles.metaSep}>·</span>
                    <span>{u.actividad}</span>
                  </div>
                </div>
              </div>

              <div className={styles.personaMetrics}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>LEADS</div>
                  <div className={styles.metricValue}>{u.leadsActivos}</div>
                  <div className={styles.metricNote}>activos</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>VENTAS</div>
                  <div className={styles.metricValue}>{u.ventasEsteMes}</div>
                  <div className={styles.metricNote}>este mes</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>CIERRE</div>
                  <div
                    className={styles.metricValue}
                    style={{
                      color:
                        u.cierre >= 45 ? "var(--success-text)" : u.cierre >= 25 ? "var(--accent-light)" : "var(--danger-text)",
                    }}
                  >
                    {u.cierre}%
                  </div>
                  <div className={styles.metricNote}>de sus leads</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>COMISIÓN</div>
                  <div className={`${styles.metricValue} ${styles.metricAccent}`}>
                    {(u.comisionEsteMes / 1000).toFixed(2).replace(".", ",")}k
                  </div>
                  <div className={styles.metricNote}>USD del mes</div>
                </div>
              </div>

              <div className={styles.personaActions}>
                {u.id !== userId && (
                  <button type="button" className={styles.permisosBtn} onClick={() => setPermisosFor(u)}>
                    Permisos
                  </button>
                )}
                <button type="button" className={styles.fichaBtn} onClick={() => setFichaFor(u)}>
                  Ver ficha
                </button>
                {u.id !== userId && (
                  <div className={styles.menuWrap} ref={openMenuId === u.id ? menuWrapRef : undefined}>
                    <button
                      type="button"
                      className={styles.menuBtn}
                      onClick={() => setOpenMenuId((id) => (id === u.id ? null : u.id))}
                      aria-label="Más acciones"
                    >
                      ···
                    </button>
                    {openMenuId === u.id && (
                      <div className={styles.menu}>
                        <button type="button" onClick={() => handleDelete(u)}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitulo}>Qué ve cada rol</div>
          <div className={styles.cardSub}>Los permisos se aplican en todo el panel, también desde el celular</div>
          <div className={styles.rolesList}>
            {roles.map((r) => (
              <div key={r.titulo} className={styles.rolCard}>
                <span className={styles.rolIcon} style={{ color: r.color, background: r.bg, borderColor: r.border }}>
                  <r.icon size={13} />
                </span>
                <div className={styles.rolBody}>
                  <div className={styles.rolTitulo}>{r.titulo}</div>
                  <div className={styles.rolDetalle}>{r.detalle}</div>
                </div>
                <div className={styles.rolCuenta}>{r.cuenta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cargaHead}>
            <div>
              <div className={styles.cardTitulo}>Carga de trabajo</div>
              <div className={styles.cardSub}>Leads activos asignados a cada vendedor</div>
            </div>
            <div className={styles.sinAsignarBox}>
              <div className={styles.sinAsignarValue}>{resumen.sinAsignar}</div>
              <div className={styles.sinAsignarLabel}>sin asignar</div>
            </div>
          </div>
          {carga.length === 0 ? (
            <p className={styles.empty}>Sin vendedores en el equipo todavía.</p>
          ) : (
            <div className={styles.cargaList}>
              {carga.map((c) => {
                const alerta = c.leads >= 6;
                return (
                  <div key={c.id} className={styles.cargaRow}>
                    <span className={styles.avatarSmall}>{initials(c.nombre)}</span>
                    <div className={styles.cargaNombre}>{c.nombre}</div>
                    <div className={styles.cargaTrack}>
                      <div
                        className={styles.cargaFill}
                        style={{
                          width: `${Math.round((c.leads / maxCarga) * 100)}%`,
                          background: alerta
                            ? "linear-gradient(90deg, var(--danger-text), var(--danger))"
                            : "linear-gradient(90deg, #f5b45c, #c9762a)",
                        }}
                      />
                    </div>
                    <div className={styles.cargaValor}>
                      {c.leads} {c.leads === 1 ? "lead" : "leads"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className={styles.cargaInsight}>
            <div>
              {resumen.sinAsignar > 0
                ? `Hay ${resumen.sinAsignar} ${resumen.sinAsignar === 1 ? "lead" : "leads"} sin vendedor asignado.`
                : "Todos los leads tienen vendedor asignado."}
            </div>
            {resumen.sinAsignar > 0 && carga.length > 0 && (
              <button type="button" className={styles.repartirBtn} onClick={handleRepartir} disabled={repartiendo}>
                {repartiendo ? "Repartiendo…" : "Repartir"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alta de usuario */}
      <div className={`${styles.modalBg} ${showModal ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">Invitar usuario</h3>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label>Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ana Gómez"
            />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@agencia.com"
            />
          </div>
          <div className={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className={styles.field}>
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Admin</option>
              <option value="DUENIO">Dueño</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnGhost} onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Crear usuario"}
            </button>
          </div>
        </div>
      </div>

      {/* Permisos: cambiar rol */}
      <div className={`${styles.modalBg} ${permisosFor ? styles.show : ""}`}>
        {permisosFor && (
          <div className={styles.modal}>
            <h3 className="disp">Permisos de {permisosFor.nombre}</h3>
            <p className={styles.cardSub} style={{ marginBottom: 16 }}>
              Elegí qué puede ver y hacer en el panel.
            </p>
            <div className={styles.rolOptions}>
              {(["VENDEDOR", "ADMIN", "DUENIO"] as Rol[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.rolOption} ${permisosFor.rol === r ? styles.rolOptionActive : ""}`}
                  onClick={() => handleCambiarRol(r)}
                  disabled={saving || permisosFor.rol === r}
                >
                  {rolLabel[r]}
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setPermisosFor(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ver ficha: drawer de solo lectura */}
      <div className={`${styles.drawerBg} ${fichaFor ? styles.show : ""}`} onClick={() => setFichaFor(null)}>
        {fichaFor && (
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <div className={styles.avatar} style={{ width: 40, height: 40, fontSize: 14 }}>
                {initials(fichaFor.nombre)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="disp" style={{ marginBottom: 0 }}>
                  {fichaFor.nombre}
                </h3>
                <div className={styles.personaEmail}>{fichaFor.email}</div>
              </div>
              <button type="button" className={styles.drawerClose} onClick={() => setFichaFor(null)} aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>

            <div className={styles.drawerField}>
              <span className={styles.drawerLabel}>Rol</span>
              <span className={`${styles.rolChip} ${fichaFor.rol === "DUENIO" ? styles.rolChipDueno : ""}`}>
                {rolLabel[fichaFor.rol]}
              </span>
            </div>
            <div className={styles.drawerField}>
              <span className={styles.drawerLabel}>Sucursal</span>
              <span className={styles.drawerValue}>{fichaFor.sucursal}</span>
            </div>
            <div className={styles.drawerField}>
              <span className={styles.drawerLabel}>Actividad</span>
              <span className={styles.drawerValue}>{fichaFor.actividad}</span>
            </div>

            <div className={styles.drawerMetrics}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>LEADS</div>
                <div className={styles.metricValue}>{fichaFor.leadsActivos}</div>
                <div className={styles.metricNote}>activos</div>
              </div>
              <div className={`${styles.metric} ${styles.metricDivider}`}>
                <div className={styles.metricLabel}>VENTAS</div>
                <div className={styles.metricValue}>{fichaFor.ventasEsteMes}</div>
                <div className={styles.metricNote}>este mes</div>
              </div>
              <div className={`${styles.metric} ${styles.metricDivider}`}>
                <div className={styles.metricLabel}>CIERRE</div>
                <div className={styles.metricValue}>{fichaFor.cierre}%</div>
                <div className={styles.metricNote}>de sus leads</div>
              </div>
              <div className={`${styles.metric} ${styles.metricDivider}`}>
                <div className={styles.metricLabel}>COMISIÓN</div>
                <div className={`${styles.metricValue} ${styles.metricAccent}`}>{usd(fichaFor.comisionEsteMes)}</div>
                <div className={styles.metricNote}>del mes</div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setFichaFor(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </div>
  );
}
