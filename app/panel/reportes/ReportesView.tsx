"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./reportes.module.css";

type VentaDia = { fecha: string; unidades: number; monto: number };
type LeadCanal = { canal: string; total: number; cerrados: number; pct: number };
type RotacionItem = { vehiculo: string; dias: number };
type VendedorPerf = { nombre: string; leads: number; ventas: number; comision: number };

const tooltipStyle = {
  background: "var(--surface-strong)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 12.5,
  fontFamily: "var(--font-body)",
  color: "var(--ink)",
};

function fmtFecha(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fmtUsd(n: number) {
  return `USD ${n.toLocaleString("es-AR")}`;
}

export function ReportesView({
  ventasSerie,
  leadsPorCanal,
  rotacion,
  rotacionPromedio,
  rotacionMin,
  rotacionMax,
  performanceVendedores,
}: {
  ventasSerie: VentaDia[];
  leadsPorCanal: LeadCanal[];
  rotacion: RotacionItem[];
  rotacionPromedio: number | null;
  rotacionMin: number | null;
  rotacionMax: number | null;
  performanceVendedores: VendedorPerf[] | null;
}) {
  const totalUnidades = ventasSerie.reduce((a, v) => a + v.unidades, 0);
  const totalMonto = ventasSerie.reduce((a, v) => a + v.monto, 0);
  const totalLeads = leadsPorCanal.reduce((a, c) => a + c.total, 0);
  const totalCerrados = leadsPorCanal.reduce((a, c) => a + c.cerrados, 0);

  return (
    <div className={styles.grid}>
      <section className={`${styles.card} ${styles.span2}`}>
        <h2 className="disp">Ventas en el tiempo</h2>
        <p className={styles.subtext}>
          {totalUnidades} vehículo{totalUnidades === 1 ? "" : "s"} vendido
          {totalUnidades === 1 ? "" : "s"} · {fmtUsd(totalMonto)} en total
        </p>
        <div className={styles.chartsRow}>
          <div className={styles.chartBox}>
            <div className={styles.chartLabel}>Unidades por día</div>
            {ventasSerie.length === 0 ? (
              <div className={styles.empty}>Sin ventas en este período</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ventasSerie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={fmtFecha}
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--line)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "var(--sidebar-hover)" }}
                    labelFormatter={(v) => fmtFecha(String(v))}
                    formatter={(v) => [`${v}`, "Unidades"]}
                  />
                  <Bar dataKey="unidades" fill="var(--violet)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className={styles.chartBox}>
            <div className={styles.chartLabel}>Monto total por día</div>
            {ventasSerie.length === 0 ? (
              <div className={styles.empty}>Sin ventas en este período</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ventasSerie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={fmtFecha}
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--line)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(v) => fmtFecha(String(v))}
                    formatter={(v) => [fmtUsd(Number(v)), "Monto"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="monto"
                    stroke="var(--cyan)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--cyan)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className={`${styles.card} ${styles.span2}`}>
        <h2 className="disp">Leads por canal</h2>
        <p className={styles.subtext}>
          {totalLeads} lead{totalLeads === 1 ? "" : "s"} · {totalCerrados} cerrado
          {totalCerrados === 1 ? "" : "s"}
        </p>
        {leadsPorCanal.every((c) => c.total === 0) ? (
          <div className={styles.empty}>Sin leads en este período</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leadsPorCanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="canal"
                tick={{ fill: "var(--ink-soft)", fontSize: 12 }}
                axisLine={{ stroke: "var(--line)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--sidebar-hover)" }}
                formatter={(value, name, item) => {
                  if (name === "Cerrados") {
                    const pct = (item.payload as LeadCanal).pct;
                    return [`${value} (${pct}% del canal)`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12.5, color: "var(--ink-soft)" }} />
              <Bar dataKey="total" name="Total" fill="var(--violet)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar
                dataKey="cerrados"
                name="Cerrados"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className={`${styles.card} ${styles.span2}`}>
        <h2 className="disp">Rotación de stock</h2>
        <p className={styles.subtext}>Días entre que un vehículo entra a stock y se vende</p>
        {rotacionPromedio === null ? (
          <div className={styles.empty}>Sin ventas en este período</div>
        ) : (
          <>
            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Promedio</div>
                <div className={`${styles.statValue} disp`}>{rotacionPromedio} días</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Más rápida</div>
                <div className={`${styles.statValue} disp`}>{rotacionMin} días</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Más lenta</div>
                <div className={`${styles.statValue} disp`}>{rotacionMax} días</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(180, rotacion.length * 34)}>
              <BarChart data={rotacion} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--line)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="vehiculo"
                  tick={{ fill: "var(--ink-soft)", fontSize: 11.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--sidebar-hover)" }}
                  formatter={(v) => [`${v} días`, "Tiempo en stock"]}
                />
                <Bar dataKey="dias" fill="var(--cyan)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </section>

      {performanceVendedores && (
        <section className={`${styles.card} ${styles.span2}`}>
          <h2 className="disp">Performance por vendedor</h2>
          <p className={styles.subtext}>Ranking por ventas cerradas en el período</p>
          {performanceVendedores.length === 0 ? (
            <div className={styles.empty}>Sin actividad de vendedores en este período</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(160, performanceVendedores.length * 46)}>
                <BarChart data={performanceVendedores} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--line)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    tick={{ fill: "var(--ink-soft)", fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--sidebar-hover)" }} />
                  <Legend wrapperStyle={{ fontSize: 12.5, color: "var(--ink-soft)" }} />
                  <Bar dataKey="leads" name="Leads" fill="var(--violet)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  <Bar dataKey="ventas" name="Ventas" fill="var(--success)" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className={styles.num}>Leads</th>
                    <th className={styles.num}>Ventas</th>
                    <th className={styles.num}>Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceVendedores.map((v) => (
                    <tr key={v.nombre}>
                      <td>{v.nombre}</td>
                      <td className={`${styles.num} mono`}>{v.leads}</td>
                      <td className={`${styles.num} mono`}>{v.ventas}</td>
                      <td className={`${styles.num} mono`}>{fmtUsd(v.comision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}
    </div>
  );
}
