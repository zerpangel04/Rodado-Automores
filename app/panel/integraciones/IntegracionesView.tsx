"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  PauseCircle,
  AlertTriangle,
  MessageCircle,
  Camera,
  DollarSign,
  Calculator,
  Mail,
} from "lucide-react";
import styles from "./integraciones.module.css";

export type ActividadItem = { id: string; tipo: string; texto: string; hace: string };

type ConectadaDTO = {
  mlUserId: string;
  conectadaDesde: string;
  syncPrecios: boolean;
  syncFotos: boolean;
  pausarAlVender: boolean;
};

type MetricasDTO = {
  publicacionesActivas: number;
  totalVehiculos: number;
  consultasImportadas: number;
  requierenAtencion: number;
  primeraAtencion: string | null;
};

const errorLabel: Record<string, string> = {
  estado_invalido: "La conexión expiró o no pudimos validarla, probá de nuevo.",
  token_error: "Mercado Libre rechazó la conexión, probá de nuevo.",
  config: "Falta configurar las credenciales de Mercado Libre del lado del servidor.",
};

const actividadIconMl: Record<string, typeof RefreshCw> = {
  ML_ACTUALIZADO: RefreshCw,
  ML_PAUSADA: PauseCircle,
  ML_ATENCION: AlertTriangle,
};

const actividadColorMl: Record<string, string> = {
  ML_ACTUALIZADO: "var(--success)",
  ML_PAUSADA: "var(--info)",
  ML_ATENCION: "var(--warn)",
};

const proximas = [
  {
    key: "wpp",
    nombre: "WhatsApp Business",
    icon: MessageCircle,
    estado: "EN DESARROLLO",
    color: "var(--success-text)",
    bg: "rgba(74,222,128,0.10)",
    border: "rgba(74,222,128,0.22)",
    estadoColor: "var(--success-text)",
    detalle: "Catálogo sincronizado y las consultas del chat entrando directo a tu pipeline.",
  },
  {
    key: "ig",
    nombre: "Instagram",
    icon: Camera,
    estado: "PLANIFICADA",
    color: "var(--secondary-text)",
    bg: "rgba(192,132,252,0.10)",
    border: "rgba(192,132,252,0.22)",
    estadoColor: "#8d949e",
    detalle: "Los mensajes de tus publicaciones se convierten en leads con el vehículo cargado.",
  },
  {
    key: "fin",
    nombre: "Financieras",
    icon: DollarSign,
    estado: "PLANIFICADA",
    color: "var(--accent-light)",
    bg: "rgba(240,161,60,0.10)",
    border: "rgba(240,161,60,0.22)",
    estadoColor: "#8d949e",
    detalle: "Simulación de cuotas y envío de legajos sin salir de la ficha del vehículo.",
  },
  {
    key: "cont",
    nombre: "Contabilidad",
    icon: Calculator,
    estado: "EN EVALUACIÓN",
    color: "var(--info-text)",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.22)",
    estadoColor: "#8d949e",
    detalle: "Cada venta registrada viaja al sistema de tu contador, sin cargar dos veces.",
  },
];

function Switch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      onClick={disabled ? undefined : onClick}
      className={`${styles.switchTrack} ${on ? styles.switchOn : ""} ${disabled ? styles.switchDisabled : ""}`}
    >
      <span className={styles.switchKnob} />
    </span>
  );
}

export function IntegracionesView({
  conectada,
  metricas,
  actividad,
  mlConnected,
  mlError,
}: {
  conectada: ConectadaDTO | null;
  metricas: MetricasDTO | null;
  actividad: ActividadItem[];
  mlConnected: boolean;
  mlError: string | null;
}) {
  const router = useRouter();
  const [opciones, setOpciones] = useState(
    conectada
      ? { syncPrecios: conectada.syncPrecios, syncFotos: conectada.syncFotos, pausarAlVender: conectada.pausarAlVender }
      : { syncPrecios: true, syncFotos: true, pausarAlVender: false }
  );
  const [savingOpcion, setSavingOpcion] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [avisos, setAvisos] = useState<Record<string, boolean>>({});
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  async function toggleOpcion(key: keyof typeof opciones) {
    const next = { ...opciones, [key]: !opciones[key] };
    setOpciones(next);
    setSavingOpcion(key);
    const res = await fetch("/api/mercadolibre/conexion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSavingOpcion(null);
    if (!res.ok) {
      setOpciones(opciones);
      alert("No se pudo guardar el cambio, probá de nuevo.");
    }
  }

  async function handleDesconectar() {
    setOpenMenu(false);
    if (
      !confirm(
        "¿Desconectar tu cuenta de Mercado Libre? Las publicaciones que ya están en Mercado Libre siguen ahí, pero vas a tener que volver a autorizar la cuenta para seguir publicando o sincronizando desde Rodado."
      )
    )
      return;
    setDesconectando(true);
    const res = await fetch("/api/mercadolibre/conexion", { method: "DELETE" });
    setDesconectando(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo desconectar la cuenta");
    }
  }

  return (
    <div className={styles.wrap}>
      {mlConnected && (
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          ✓ Cuenta de Mercado Libre conectada correctamente.
        </div>
      )}
      {mlError && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {errorLabel[mlError] ?? "No se pudo conectar con Mercado Libre."}
        </div>
      )}

      {conectada && (
        <div className={styles.headRow}>
          <div className={styles.activeChip}>
            <span className={styles.activeDot} />1 conexión activa
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>CONECTADAS</div>

        {!conectada ? (
          <div className={styles.card}>
            <div className={styles.cardHairline} style={{ background: "linear-gradient(90deg, var(--warn), transparent 70%)" }} />
            <div className={styles.cardHead}>
              <div className={styles.logo}>ML</div>
              <div className={styles.cardHeadInfo}>
                <div className={styles.cardHeadTop}>
                  <div className={styles.nombre}>Mercado Libre</div>
                  <span className={styles.estadoChip}>
                    <span className={styles.estadoDotGray} />
                    Sin conectar
                  </span>
                </div>
                <div className={styles.descripcion}>
                  Publicá tu stock y sincronizá precios y estado automáticamente. Las consultas entran como leads a
                  tu pipeline.
                </div>
              </div>
            </div>
            <div className={styles.disconnectedActions}>
              <a href="/api/mercadolibre/connect" className={styles.btnPrimary}>
                Conectar con Mercado Libre →
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.cardHairline} style={{ background: "linear-gradient(90deg, var(--warn), transparent 70%)" }} />
            <div className={styles.cardHead}>
              <div className={styles.logo}>ML</div>
              <div className={styles.cardHeadInfo}>
                <div className={styles.cardHeadTop}>
                  <div className={styles.nombre}>Mercado Libre</div>
                  <span className={styles.estadoChip}>
                    <span className={styles.estadoDotGreen} />
                    Conectada
                  </span>
                </div>
                <div className={styles.descripcion}>
                  Publicás tu stock desde la misma ficha y los precios se sincronizan solos. Las consultas entran
                  como leads a tu pipeline.
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaMono}>Cuenta #{conectada.mlUserId}</span>
                  <span>
                    Conectada el{" "}
                    {new Date(conectada.conectadaDesde).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className={styles.cardHeadActions}>
                <div className={styles.menuWrap} ref={openMenu ? menuWrapRef : undefined}>
                  <button
                    type="button"
                    className={styles.menuBtn}
                    onClick={() => setOpenMenu((v) => !v)}
                    aria-label="Más acciones"
                  >
                    ···
                  </button>
                  {openMenu && (
                    <div className={styles.menu}>
                      <a href="/api/mercadolibre/connect" className={styles.menuLink}>
                        Reconectar
                      </a>
                      <button type="button" onClick={handleDesconectar} disabled={desconectando}>
                        {desconectando ? "Desconectando…" : "Desconectar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {metricas && (
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>PUBLICACIONES ACTIVAS</div>
                  <div className={styles.metricValueRow}>
                    <span className={styles.metricValue}>{metricas.publicacionesActivas}</span>
                    <span className={styles.metricUnit}>de {metricas.totalVehiculos}</span>
                  </div>
                  <div className={styles.metricNote}>vehículos en Mercado Libre</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>CONSULTAS IMPORTADAS</div>
                  <div className={styles.metricValueRow}>
                    <span className={styles.metricValue}>{metricas.consultasImportadas}</span>
                    <span className={styles.metricUnit}>este mes</span>
                  </div>
                  <div className={styles.metricNote}>entraron como leads</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>SIN PUBLICAR</div>
                  <div className={styles.metricValueRow}>
                    <span className={styles.metricValue}>
                      {Math.max(0, metricas.totalVehiculos - metricas.publicacionesActivas)}
                    </span>
                    <span className={styles.metricUnit}>vehículos</span>
                  </div>
                  <div className={styles.metricNote}>todavía no publicados</div>
                </div>
                <div className={`${styles.metric} ${styles.metricDivider}`}>
                  <div className={styles.metricLabel}>REQUIEREN ATENCIÓN</div>
                  <div className={styles.metricValueRow}>
                    <span
                      className={styles.metricValue}
                      style={{ color: metricas.requierenAtencion > 0 ? "var(--warn-text)" : "var(--ink)" }}
                    >
                      {metricas.requierenAtencion}
                    </span>
                    <span className={styles.metricUnit}>publicación{metricas.requierenAtencion === 1 ? "" : "es"}</span>
                  </div>
                  <div className={styles.metricNote}>{metricas.primeraAtencion ?? "todo al día"}</div>
                </div>
              </div>
            )}

            <div className={styles.twoCol}>
              <div className={styles.colBox}>
                <div className={styles.colHead}>
                  <div className={styles.colTitulo}>Actividad de sincronización</div>
                </div>
                {actividad.length === 0 ? (
                  <p className={styles.empty}>Todavía no hubo actividad de sincronización.</p>
                ) : (
                  <div className={styles.timeline}>
                    {actividad.map((a) => {
                      const Icon = actividadIconMl[a.tipo];
                      const color = actividadColorMl[a.tipo] ?? "var(--ink-soft)";
                      return (
                        <div key={a.id} className={styles.timelineItem}>
                          <span className={styles.timelineDot} style={{ background: color }} />
                          <div className={styles.timelineRow}>
                            {Icon && <Icon size={12} style={{ color, flex: "none" }} />}
                            <div className={styles.timelineTexto}>{a.texto}</div>
                            <div className={styles.timelineHace}>{a.hace}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={`${styles.colBox} ${styles.colBoxBorder}`}>
                <div className={styles.colTitulo}>Qué se sincroniza</div>
                <div className={styles.opciones}>
                  <div className={styles.opcionRow}>
                    <Switch
                      on={opciones.syncPrecios}
                      onClick={() => toggleOpcion("syncPrecios")}
                      disabled={savingOpcion === "syncPrecios"}
                    />
                    <div>
                      <div className={styles.opcionLabel}>Precios y stock</div>
                      <div className={styles.opcionNota}>Lo que cambiás en Rodado se actualiza allá</div>
                    </div>
                  </div>
                  <div className={styles.opcionRow}>
                    <Switch
                      on={opciones.syncFotos}
                      onClick={() => toggleOpcion("syncFotos")}
                      disabled={savingOpcion === "syncFotos"}
                    />
                    <div>
                      <div className={styles.opcionLabel}>Fotos y descripción</div>
                      <div className={styles.opcionNota}>Toma las fotos de la ficha del vehículo</div>
                    </div>
                  </div>
                  <div className={styles.opcionRow}>
                    <Switch
                      on={opciones.pausarAlVender}
                      onClick={() => toggleOpcion("pausarAlVender")}
                      disabled={savingOpcion === "pausarAlVender"}
                    />
                    <div>
                      <div className={styles.opcionLabel}>Pausar al vender</div>
                      <div className={styles.opcionNota}>Baja la publicación cuando marcás vendido</div>
                    </div>
                  </div>
                </div>
                <p className={styles.opcionesFootnote}>
                  Importar las consultas de Mercado Libre como leads todavía no está disponible — por ahora, las
                  consultas se responden desde Mercado Libre.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.sectionLabel}>EN CAMINO</div>
          <div className={styles.sectionHint}>Activá el aviso y te escribimos el día que se libere</div>
        </div>
        <div className={styles.proximasGrid}>
          {proximas.map((p) => {
            const on = !!avisos[p.key];
            const Icon = p.icon;
            return (
              <div key={p.key} className={styles.proximaCard}>
                <div className={styles.proximaHead}>
                  <div className={styles.proximaIcon} style={{ color: p.color, background: p.bg, borderColor: p.border }}>
                    <Icon size={14} />
                  </div>
                  <div className={styles.proximaInfo}>
                    <div className={styles.proximaNombre}>{p.nombre}</div>
                    <div className={styles.proximaEstado} style={{ color: p.estadoColor }}>
                      {p.estado}
                    </div>
                  </div>
                </div>
                <div className={styles.proximaDetalle}>{p.detalle}</div>
                <button
                  type="button"
                  className={`${styles.avisarBtn} ${on ? styles.avisarBtnOn : ""}`}
                  onClick={() => setAvisos((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                >
                  {on ? "✓ Te avisamos" : "Avisarme"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.requestBanner}>
        <span className={styles.requestIcon}>
          <Mail size={14} />
        </span>
        <div className={styles.requestBody}>
          <div className={styles.requestTitulo}>¿Usás otra plataforma que no está en la lista?</div>
          <div className={styles.requestDetalle}>
            Contanos cuál y con cuántas publicaciones trabajás. Priorizamos las que más nos piden.
          </div>
        </div>
        <button type="button" className={styles.requestBtn}>
          Pedir integración
        </button>
      </div>
    </div>
  );
}
