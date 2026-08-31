"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Clock } from "lucide-react";
import styles from "./reportes.module.css";
import { KpiSpark } from "../KpiSpark";

export type Etapa = "NUEVO" | "CONTACTADO" | "TEST_DRIVE" | "NEGOCIACION" | "CERRADO";

type VentaDia = { fecha: string; unidades: number; monto: number };
type LeadCanal = { canal: string; total: number; cerrados: number; pct: number };
type RotacionItem = { vehiculo: string; dias: number };
type VendedorPerf = { nombre: string; leads: number; ventas: number; facturado: number; comision: number };
type EmbudoItem = { label: string; n: number };
type Lectura = { tono: "success" | "warn" | "danger"; titulo: string; detalle: string };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

function truncate(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function fmtFecha(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function usd(n: number) {
  return `USD ${Math.round(n).toLocaleString("es-AR")}`;
}

function rotacionColor(dias: number) {
  if (dias >= 28) return { c1: "var(--danger-text)", c2: "#ef4444", label: "var(--danger-text)" };
  if (dias >= 14) return { c1: "#f5b45c", c2: "#c9762a", label: "var(--accent-light)" };
  return { c1: "var(--success-text)", c2: "var(--success)", label: "var(--success-text)" };
}

const embudoPaleta: [string, string][] = [
  ["var(--info-text)", "#3b82f6"],
  ["var(--accent-light)", "var(--accent)"],
  ["var(--secondary-text)", "var(--secondary)"],
  ["var(--warn-text)", "#d97706"],
  ["var(--success-text)", "var(--success)"],
];

const lecturaIcon: Record<Lectura["tono"], typeof TrendingUp> = {
  success: TrendingUp,
  warn: AlertTriangle,
  danger: Clock,
};

function VentasChart({ serie }: { serie: VentaDia[] }) {
  if (serie.length === 0) {
    return <div className={styles.chartEmpty}>Sin ventas en este período</div>;
  }
  const H = 176;
  const maxU = Math.max(...serie.map((s) => s.unidades));
  const maxMonto = Math.max(...serie.map((s) => s.monto), 1);
  const linea = serie
    .map((s, i) => {
      const px = serie.length === 1 ? 50 : ((i + 0.5) / serie.length) * 100;
      const py = H - (s.monto / (maxMonto * 1.12)) * H;
      return `${px.toFixed(2)},${py.toFixed(1)}`;
    })
    .join(" ");
  const escalaMax = String(maxU);
  const escalaMed = maxU % 2 === 0 ? String(maxU / 2) : (maxU / 2).toFixed(1).replace(".", ",");

  return (
    <div className={styles.chartRow}>
      <div className={styles.chartScale}>
        <span>{escalaMax}</span>
        <span>{escalaMed}</span>
        <span>0</span>
      </div>
      <div className={styles.chartArea}>
        <div className={styles.chartGridLines}>
          <span className={styles.gridLine} />
          <span className={styles.gridLineMid} />
          <span className={styles.gridLineBase} />
        </div>
        <div className={styles.chartBars}>
          {serie.map((s) => (
            <div key={s.fecha} className={styles.chartBarCol}>
              <div className={styles.chartTooltip}>
                <div className={styles.chartTooltipDate}>{fmtFecha(s.fecha)}</div>
                <div className={styles.chartTooltipRow}>
                  <span className={styles.chartTooltipDot} style={{ background: "#f5b45c" }} />
                  unidades
                  <span className={styles.chartTooltipVal}>{s.unidades}</span>
                </div>
                <div className={styles.chartTooltipRow}>
                  <span className={styles.chartTooltipDot} style={{ background: "#86efac" }} />
                  monto
                  <span className={styles.chartTooltipVal}>{usd(s.monto)}</span>
                </div>
              </div>
              <div className={styles.chartBarWrap}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${Math.round((s.unidades / (maxU * 1.12)) * H)}px` }}
                >
                  <span className={styles.chartBarValue}>{s.unidades}</span>
                </div>
              </div>
              <div className={styles.chartBarDay}>{fmtFecha(s.fecha)}</div>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className={styles.chartSvg}>
          <polyline
            points={linea}
            fill="none"
            stroke="#86efac"
            strokeWidth={0.7}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function ReportesView({
  totalUnidades,
  totalMonto,
  totalUnidadesPrev,
  totalMontoPrev,
  ventasSerie,
  embudo,
  conversionPct,
  conversionPctPrev,
  leadsPorCanal,
  rotacion,
  rotacionPromedio,
  rotacionPromedioPrev,
  performanceVendedores,
  lecturas,
}: {
  totalUnidades: number;
  totalMonto: number;
  totalUnidadesPrev: number;
  totalMontoPrev: number;
  ventasSerie: VentaDia[];
  embudo: EmbudoItem[];
  conversionPct: number;
  conversionPctPrev: number | null;
  leadsPorCanal: LeadCanal[];
  rotacion: RotacionItem[];
  rotacionPromedio: number | null;
  rotacionPromedioPrev: number | null;
  performanceVendedores: VendedorPerf[] | null;
  lecturas: Lectura[];
}) {
  const isMobile = useIsMobile();
  const totalLeads = leadsPorCanal.reduce((a, c) => a + c.total, 0);
  const totalCerrados = leadsPorCanal.reduce((a, c) => a + c.cerrados, 0);
  const maxCanal = Math.max(...leadsPorCanal.map((c) => c.total), 1);

  const montoTrend =
    totalMontoPrev > 0
      ? Math.round(((totalMonto - totalMontoPrev) / totalMontoPrev) * 100)
      : totalMonto > 0
      ? null
      : null;
  const unidadesTrend = totalUnidadesPrev > 0 ? totalUnidades - totalUnidadesPrev : null;
  const conversionTrend = conversionPctPrev !== null ? conversionPct - conversionPctPrev : null;
  const rotacionTrend =
    rotacionPromedio !== null && rotacionPromedioPrev !== null
      ? rotacionPromedio - rotacionPromedioPrev
      : null;

  // --- Embudo: % de caída respecto de la etapa anterior + la lectura de
  // dónde está la fuga más grande, ambas derivadas del propio embudo ---
  const caidas = embudo.slice(1).map((e, i) => {
    const prev = embudo[i].n;
    return prev > 0 ? Math.round(((e.n - prev) / prev) * 100) : null;
  });
  let embudoInsight: string;
  if (embudo[0].n === 0) {
    embudoInsight = "Sin consultas en este período.";
  } else {
    let peorIdx = -1;
    caidas.forEach((c, i) => {
      if (c !== null && c < 0 && (peorIdx === -1 || c < caidas[peorIdx]!)) peorIdx = i;
    });
    if (peorIdx === -1) {
      embudoInsight = "Sin caídas relevantes: los leads que entran en contacto llegan hasta el cierre.";
    } else if (peorIdx === 0) {
      const perdidos = embudo[0].n - embudo[1].n;
      embudoInsight = `La caída más grande está en el primer contacto: ${perdidos} de ${embudo[0].n} consulta${
        embudo[0].n === 1 ? "" : "s"
      } nunca fueron respondidas.`;
    } else {
      embudoInsight = `La caída más grande está entre ${embudo[peorIdx].label} y ${
        embudo[peorIdx + 1].label
      }: se pierde el ${Math.abs(caidas[peorIdx]!)}% de los leads en ese paso.`;
    }
  }

  const maxRot = Math.max(...rotacion.map((r) => r.dias), 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.kpiRow}>
        <KpiSpark
          color="var(--success)"
          label="Facturado"
          value={totalMonto.toLocaleString("es-AR")}
          unit="USD"
          trend={
            montoTrend === null
              ? undefined
              : { label: `${montoTrend >= 0 ? "+" : ""}${montoTrend}% vs. período anterior`, positive: montoTrend >= 0 }
          }
          spark={ventasSerie.map((s) => s.monto)}
        />
        <KpiSpark
          color="var(--info)"
          label="Unidades vendidas"
          value={String(totalUnidades)}
          unit="vehículos"
          trend={
            unidadesTrend === null
              ? undefined
              : {
                  label: `${unidadesTrend >= 0 ? "+" : ""}${unidadesTrend} vs. período anterior`,
                  positive: unidadesTrend >= 0,
                }
          }
          spark={ventasSerie.map((s) => s.unidades)}
        />
        <KpiSpark
          color="var(--accent)"
          label="Conversión lead→venta"
          value={`${conversionPct}%`}
          unit={`${totalCerrados} de ${totalLeads}`}
          trend={
            conversionTrend === null
              ? undefined
              : { label: `${conversionTrend >= 0 ? "+" : ""}${conversionTrend} pts`, positive: conversionTrend >= 0 }
          }
          spark={embudo.map((e) => e.n)}
        />
        <KpiSpark
          color="var(--secondary)"
          label="Rotación promedio"
          value={rotacionPromedio === null ? "—" : String(rotacionPromedio)}
          unit="días"
          trend={
            rotacionTrend === null
              ? undefined
              : {
                  label: `${rotacionTrend >= 0 ? "+" : ""}${rotacionTrend} vs. período anterior`,
                  positive: rotacionTrend <= 0,
                }
          }
          spark={rotacion.map((r) => r.dias)}
        />
      </div>

      <div className={styles.topRow}>
        <section className={styles.card}>
          <div className={styles.cardHeadRow}>
            <div>
              <h2 className={`disp ${styles.cardTitle}`}>Ventas en el tiempo</h2>
              <p className={styles.subtext}>
                {totalUnidades} vehículo{totalUnidades === 1 ? "" : "s"} · {usd(totalMonto)} en total
              </p>
            </div>
            <div className={styles.chartLegend}>
              <span>
                <span className={styles.legendSwatchBar} />
                unidades
              </span>
              <span>
                <span className={styles.legendSwatchLine} />
                monto USD
              </span>
            </div>
          </div>
          <VentasChart serie={ventasSerie} />
        </section>

        <section className={styles.card}>
          <h2 className={`disp ${styles.cardTitle}`}>Embudo de conversión</h2>
          <p className={styles.subtext}>Dónde se caen los compradores</p>
          <div className={styles.embudoList}>
            {embudo.map((e, i) => {
              const pct = embudo[0].n > 0 ? Math.round((e.n / embudo[0].n) * 100) : 0;
              const caida = i === 0 ? null : caidas[i - 1];
              const caidaLabel = caida === null ? (i === 0 ? "base" : "sin caída") : caida === 0 ? "sin caída" : `${caida}%`;
              const caidaColor = caida !== null && caida <= -30 ? "var(--danger-text)" : caida === 0 ? "var(--success-text)" : "#8d949e";
              const [c1, c2] = embudoPaleta[i];
              return (
                <div key={e.label} className={styles.embudoRow}>
                  <div className={styles.embudoHead}>
                    <span className={styles.embudoLabel}>{e.label}</span>
                    <span className={styles.embudoN}>{e.n}</span>
                    <span className={styles.embudoCaida} style={{ color: i === 0 ? "#5d656d" : caidaColor }}>
                      {i === 0 ? "base" : caidaLabel}
                    </span>
                  </div>
                  <div className={styles.embudoTrack}>
                    <div
                      className={styles.embudoFill}
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.embudoInsight}>{embudoInsight}</div>
        </section>
      </div>

      <div className={styles.midRow}>
        <section className={styles.card}>
          <div className={styles.cardHeadRow}>
            <div>
              <h2 className={`disp ${styles.cardTitle}`}>Leads por canal</h2>
              <p className={styles.subtext}>
                {totalLeads} consulta{totalLeads === 1 ? "" : "s"} · {totalCerrados} cerrada
                {totalCerrados === 1 ? "" : "s"} · {totalLeads > 0 ? Math.round((totalCerrados / totalLeads) * 100) : 0}% de conversión
              </p>
            </div>
            <div className={styles.canalesSubHead}>consultas · cerradas</div>
          </div>
          {leadsPorCanal.every((c) => c.total === 0) ? (
            <div className={styles.chartEmpty}>Sin leads en este período</div>
          ) : (
            <div className={styles.canalList}>
              {leadsPorCanal.map((c) => (
                <div key={c.canal} className={styles.canalRow}>
                  <div className={styles.canalHead}>
                    <span
                      className={styles.canalDot}
                      style={{ background: c.total === 0 ? "var(--ink-soft)" : "var(--accent)" }}
                    />
                    <span className={styles.canalLabel}>{c.canal}</span>
                    <span className={styles.canalDetalle}>
                      {c.total === 0 ? "sin consultas" : `${c.total} · ${c.cerrados}`}
                    </span>
                    <span
                      className={styles.canalConv}
                      style={{
                        color:
                          c.total === 0
                            ? "#5d656d"
                            : c.pct >= 50
                            ? "var(--success-text)"
                            : c.pct >= 20
                            ? "var(--accent-light)"
                            : "var(--danger-text)",
                      }}
                    >
                      {c.total === 0 ? "—" : `${c.pct}%`}
                    </span>
                  </div>
                  <div className={styles.canalTrack}>
                    <div
                      className={styles.canalTrackTotal}
                      style={{ width: `${Math.round((c.total / maxCanal) * 100)}%` }}
                    />
                    <div
                      className={styles.canalTrackCerrados}
                      style={{ width: `${Math.round((c.cerrados / maxCanal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeadRow}>
            <div>
              <h2 className={`disp ${styles.cardTitle}`}>Rotación de stock</h2>
              <p className={styles.subtext}>Días entre que el auto entra y se vende</p>
            </div>
            {rotacionPromedio !== null && (
              <div className={styles.rotPromedio}>
                <div className={styles.rotPromedioValue}>{rotacionPromedio}</div>
                <div className={styles.rotPromedioLabel}>promedio</div>
              </div>
            )}
          </div>
          {rotacion.length === 0 ? (
            <div className={styles.chartEmpty}>Sin ventas en este período</div>
          ) : (
            <>
              <div className={styles.rotList}>
                {rotacion.map((r, i) => {
                  const { c1, c2, label } = rotacionColor(r.dias);
                  return (
                    <div key={`${r.vehiculo}-${i}`} className={styles.rotRow}>
                      <div className={styles.rotLabel}>
                        {isMobile ? truncate(r.vehiculo, 14) : r.vehiculo}
                      </div>
                      <div className={styles.rotTrack}>
                        <div
                          className={styles.rotFill}
                          style={{
                            width: `${Math.round((r.dias / maxRot) * 100)}%`,
                            background: `linear-gradient(90deg, ${c1}, ${c2})`,
                          }}
                        />
                      </div>
                      <div className={styles.rotDias} style={{ color: label }}>
                        {r.dias} d
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.rotFoot}>
                <span>
                  <span className={styles.rotLegendDot} style={{ background: "var(--success)" }} />
                  rápida
                </span>
                <span>
                  <span className={styles.rotLegendDot} style={{ background: "var(--accent)" }} />
                  media
                </span>
                <span>
                  <span className={styles.rotLegendDot} style={{ background: "var(--danger)" }} />
                  lenta
                </span>
                <span className={styles.rotNota}>solo vehículos ya vendidos</span>
              </div>
            </>
          )}
        </section>
      </div>

      {performanceVendedores && (
        <section className={styles.card}>
          <h2 className={`disp ${styles.cardTitle}`}>Performance por vendedor</h2>
          <p className={styles.subtext}>Cuántos leads tomó cada uno y cuántos terminó cerrando</p>
          {performanceVendedores.length === 0 ? (
            <div className={styles.chartEmpty}>Sin actividad de vendedores en este período</div>
          ) : (
            <div className={styles.perfTableWrap}>
              <div className={styles.perfHead}>
                <div>VENDEDOR</div>
                <div className={styles.right}>LEADS</div>
                <div className={styles.rightPad}>VENTAS</div>
                <div>CIERRE</div>
                <div className={styles.right}>FACTURADO</div>
                <div className={styles.right}>COMISIÓN</div>
              </div>
              {performanceVendedores.map((v) => {
                const cv = v.leads > 0 ? Math.round((v.ventas / v.leads) * 100) : 0;
                const c1 = cv >= 45 ? "var(--success-text)" : cv >= 25 ? "#f5b45c" : "var(--danger-text)";
                const c2 = cv >= 45 ? "var(--success)" : cv >= 25 ? "#c9762a" : "#ef4444";
                return (
                  <div key={v.nombre} className={styles.perfRow}>
                    <div className={styles.perfVendedor}>
                      <span className={styles.avatar}>
                        {v.nombre
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <span className={styles.perfNombre}>{v.nombre}</span>
                    </div>
                    <div className={styles.right}>{v.leads}</div>
                    <div className={styles.rightPad}>{v.ventas}</div>
                    <div className={styles.perfCierre}>
                      <div className={styles.perfCierreTrack}>
                        <div
                          className={styles.perfCierreFill}
                          style={{ width: `${cv}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                        />
                      </div>
                      <span style={{ color: c1 }}>{cv}%</span>
                    </div>
                    <div className={styles.right} style={{ fontWeight: 600 }}>
                      {usd(v.facturado)}
                    </div>
                    <div className={styles.right} style={{ fontWeight: 600, color: "var(--accent-light)" }}>
                      {usd(v.comision)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {lecturas.length > 0 && (
        <div className={styles.lecturas}>
          {lecturas.map((l) => {
            const Icon = lecturaIcon[l.tono];
            return (
              <div key={l.titulo} className={`${styles.lecturaCard} ${styles[l.tono]}`}>
                <span className={styles.lecturaIcon}>
                  <Icon size={14} />
                </span>
                <div>
                  <div className={styles.lecturaTitulo}>{l.titulo}</div>
                  <div className={styles.lecturaDetalle}>{l.detalle}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
