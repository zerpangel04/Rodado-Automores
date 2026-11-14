"use client";

import { useState } from "react";
import { X, Phone, Mail } from "lucide-react";
import styles from "./kanban.module.css";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { LeadDTO, Etapa } from "./KanbanView";
import { ChannelBadge } from "./ChannelBadge";
import { WhatsAppGlyph } from "../../icons/WhatsAppGlyph";
import { aUsdParaComparar, equivalente, formatearPrecio, type Moneda } from "@/lib/moneda";
import type { CotizacionVista } from "@/lib/cotizacion";

export type VehiculoOption = {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  precio: number;
  moneda: Moneda;
  estado: "DISPONIBLE" | "RESERVADO" | "VENDIDO";
};

export type UsuarioOption = { id: string; nombre: string };

const stages: { key: Etapa; label: string }[] = [
  { key: "NUEVO", label: "Nuevo" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "TEST_DRIVE", label: "Test drive" },
  { key: "NEGOCIACION", label: "Negociación" },
  { key: "CERRADO", label: "Cerrado" },
];

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

function whatsappUrl(contacto: string | null) {
  if (!contacto) return null;
  const digits = contacto.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits.startsWith("54") ? digits : `54${digits}`}`;
}

function telUrl(contacto: string | null) {
  if (!contacto) return null;
  const digits = contacto.replace(/[^\d]/g, "");
  return digits.length >= 8 ? `tel:${digits}` : null;
}

function mailUrl(contacto: string | null) {
  return contacto?.includes("@") ? `mailto:${contacto}` : null;
}

export function LeadDetailModal({
  lead,
  vehiculos,
  usuarios,
  canAsignar,
  cotizacion,
  onClose,
  onUpdated,
}: {
  lead: LeadDTO;
  vehiculos: VehiculoOption[];
  usuarios: UsuarioOption[];
  canAsignar: boolean;
  // La que eligió la agencia (viene del server). null = sin "≈".
  cotizacion: CotizacionVista | null;
  onClose: () => void;
  onUpdated: (lead: LeadDTO) => void;
}) {
  const [showReassignInModal, setShowReassignInModal] = useState(false);
  const [savingEtapa, setSavingEtapa] = useState(false);
  const [savingVendedor, setSavingVendedor] = useState(false);

  useBodyScrollLock(true);

  // Mismo criterio que en Stock: primero vehículos disponibles de la misma
  // categoría, después por precio más cercano al del auto vendido
  // (comparando en USD; sin cotización, los que no se pueden comparar van
  // al final).
  function suggestedVehiculosFor(
    target: { categoria?: string | null; precio?: number; moneda?: Moneda } | null | undefined
  ) {
    const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE");
    if (!target) return disponibles;
    const ref =
      typeof target.precio === "number"
        ? aUsdParaComparar(target.precio, target.moneda ?? "USD", cotizacion?.venta)
        : null;
    return disponibles.slice().sort((a, b) => {
      const aSame = a.categoria === target.categoria ? 0 : 1;
      const bSame = b.categoria === target.categoria ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      const pa = aUsdParaComparar(a.precio, a.moneda, cotizacion?.venta);
      const pb = aUsdParaComparar(b.precio, b.moneda, cotizacion?.venta);
      if (ref === null || pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
      return Math.abs(pa - ref) - Math.abs(pb - ref);
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
      id: target.id,
      marca: target.marca,
      modelo: target.modelo,
      estado: target.estado,
      categoria: target.categoria,
      precio: target.precio,
      moneda: target.moneda,
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

  async function handleVendedorChange(vendedorId: string) {
    setSavingVendedor(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendedorId: vendedorId || null }),
    });
    setSavingVendedor(false);
    if (res.ok) {
      const saved: LeadDTO = await res.json();
      onUpdated(saved);
    }
  }

  const idx = stages.findIndex((s) => s.key === lead.etapa);
  const next = stages[idx + 1];
  const wa = whatsappUrl(lead.contacto);
  const tel = telUrl(lead.contacto);
  const mail = mailUrl(lead.contacto);
  const monedaVehiculo = lead.vehiculo?.moneda ?? "USD";
  const precioEquivalente =
    typeof lead.vehiculo?.precio === "number"
      ? equivalente(lead.vehiculo.precio, monedaVehiculo, cotizacion?.venta)
      : null;

  return (
    <div className={`${styles.drawerBg} ${styles.show}`} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <div className={styles.avatar} style={{ width: 40, height: 40, fontSize: 14 }}>
            {lead.nombreCliente
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("") || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="disp" style={{ marginBottom: 0 }}>
              {lead.nombreCliente}
            </h3>
            {lead.contacto && <div className={styles.phone}>{lead.contacto}</div>}
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className={styles.drawerActions}>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className={styles.drawerActionBtn}>
              <WhatsAppGlyph size={15} />
              WhatsApp
            </a>
          )}
          {tel && (
            <a href={tel} className={styles.drawerActionBtn}>
              <Phone size={15} />
              Llamar
            </a>
          )}
          {mail && (
            <a href={mail} className={styles.drawerActionBtn}>
              <Mail size={15} />
              Email
            </a>
          )}
        </div>

        {next && (
          <button
            type="button"
            className={styles.advanceBtn}
            disabled={savingEtapa}
            onClick={() => handleEtapaChange(next.key)}
          >
            Avanzar a {next.label} →
          </button>
        )}

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
          <span className={styles.detailLabel}>Vehículo de interés</span>
          <span className={styles.detailValue}>
            {lead.vehiculo ? (
              <>
                {lead.vehiculo.marca} {lead.vehiculo.modelo}
                {typeof lead.vehiculo.precio === "number" && (
                  <div className={styles.detailPrice}>
                    {formatearPrecio(lead.vehiculo.precio, monedaVehiculo)}
                    {precioEquivalente && cotizacion && (
                      <span
                        className={styles.detailPriceArs}
                        title={`Equivalente aproximado con el ${cotizacion.nombre} del ${cotizacion.fecha}`}
                      >
                        {" "}
                        ≈ {formatearPrecio(precioEquivalente.monto, precioEquivalente.moneda)}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              "Sin vehículo asignado"
            )}
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
                      {v.marca} {v.modelo} — {formatearPrecio(v.precio, v.moneda)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.reassignCancel}
                  onClick={() => setShowReassignInModal(false)}
                  aria-label="Cancelar reasignación"
                >
                  <X size={12} />
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
            <ChannelBadge canal={lead.canal} />
          </span>
        </div>

        {canAsignar ? (
          <div className={styles.field}>
            <label>Vendedor asignado</label>
            <select
              value={lead.vendedor?.id ?? ""}
              disabled={savingVendedor}
              onChange={(e) => handleVendedorChange(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : (
          lead.vendedor && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Vendedor asignado</span>
              <span className={styles.detailValue}>{lead.vendedor.nombre}</span>
            </div>
          )
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

        <div className={styles.field}>
          <label>Recorrido</label>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <span className={styles.timelineDot} />
              <div>
                <div className={styles.timelineLabel}>Creado</div>
                <div className={styles.timelineMeta}>{formatFecha(lead.createdAt)}</div>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <span className={`${styles.timelineDot} ${styles.timelineDotActive}`} />
              <div>
                <div className={styles.timelineLabel}>
                  Etapa actual: {stages.find((s) => s.key === lead.etapa)?.label}
                </div>
              </div>
            </div>
          </div>
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
