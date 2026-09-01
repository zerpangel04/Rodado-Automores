"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import {
  X,
  RotateCcw,
  Plus,
  Sparkles,
  LayoutGrid,
  Table2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import styles from "./stock.module.css";
import panelStyles from "../panel.module.css";
import { docStatus, diasHastaVtv } from "@/lib/docs";
import { estimarPrecio } from "@/lib/tasacion";
import { KpiBar } from "../KpiBar";
import { FOTOS_MAX_COUNT, FOTO_MAX_BYTES, FOTO_ALLOWED_TYPES } from "@/lib/validation";
import { getCroppedImageFile } from "@/lib/cropImage";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const FOTO_ASPECT = 4 / 3;

export type EstadoVehiculo = "DISPONIBLE" | "RESERVADO" | "VENDIDO";

export type VehiculoDTO = {
  id: string;
  sucursalId: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precioUsd: number;
  estado: EstadoVehiculo;
  categoria: string | null;
  transmision: string | null;
  motor: string | null;
  docTitulo: boolean;
  docCedula: boolean;
  docDominio: boolean;
  docLibreDeuda: boolean;
  vtvVencimiento: string | null;
  fotos: string[];
  mlItemId: string | null;
  mlPermalink: string | null;
  mlStatus: string | null;
  mlLastError: string | null;
  fechaIngreso: string;
};

export type LeadActivoDTO = {
  id: string;
  nombreCliente: string;
  contacto: string | null;
  etapa: string;
  vehiculoId: string;
};

type SaleWarningLead = LeadActivoDTO & {
  reassignTo?: { id: string; marca: string; modelo: string };
};

type UsuarioOption = { id: string; nombre: string };
type SucursalOption = { id: string; nombre: string };

const etapaLabel: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  TEST_DRIVE: "Test drive",
  NEGOCIACION: "Negociación",
};

type FormState = {
  sucursalId: string;
  marca: string;
  modelo: string;
  anio: string;
  km: string;
  precioUsd: string;
  categoria: string;
  transmision: string;
  motor: string;
  docTitulo: boolean;
  docCedula: boolean;
  docDominio: boolean;
  docLibreDeuda: boolean;
  vtvVencimiento: string;
};

const emptyForm: FormState = {
  sucursalId: "",
  marca: "",
  modelo: "",
  anio: "",
  km: "",
  precioUsd: "",
  categoria: "Sedán",
  transmision: "",
  motor: "",
  docTitulo: false,
  docCedula: false,
  docDominio: false,
  docLibreDeuda: false,
  vtvVencimiento: "",
};

type SaleForm = {
  vendedorId: string;
  compradorNombre: string;
  precioFinal: string;
  comision: string;
};

const stateLabel: Record<EstadoVehiculo, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

const stateColor: Record<EstadoVehiculo, string> = {
  DISPONIBLE: "var(--success)",
  RESERVADO: "var(--warn)",
  VENDIDO: "var(--ink-soft)",
};

const steps = [
  { key: "fotos", label: "Fotos" },
  { key: "datos", label: "Datos" },
  { key: "precio", label: "Precio" },
  { key: "docs", label: "Documentación" },
] as const;
type StepKey = (typeof steps)[number]["key"];

function CarSVG() {
  return (
    <svg viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 82 C20 66 40 58 60 56 L90 38 C98 32 110 29 122 29 L200 29 C215 29 227 34 235 44 L255 56 C278 58 296 66 298 82 L298 88 L272 88 C272 75 262 65 249 65 C236 65 226 75 226 88 L94 88 C94 75 84 65 71 65 C58 65 48 75 48 88 L20 88 Z"
        fill="var(--input-bg)"
        stroke="var(--ink-soft)"
        strokeWidth="1.6"
      />
      <circle cx="71" cy="88" r="16" fill="var(--ink-soft)" />
      <circle cx="249" cy="88" r="16" fill="var(--ink-soft)" />
    </svg>
  );
}

const docTierClass: Record<string, string> = {
  ok: "ok",
  warn: "warnSoon",
  expired: "warn",
};

export function StockView({
  initialItems,
  usuarios,
  sucursales,
  defaultSucursalId,
  userId,
  canRevertirVenta,
  leadsActivos,
}: {
  initialItems: VehiculoDTO[];
  usuarios: UsuarioOption[];
  sucursales: SucursalOption[];
  defaultSucursalId: string;
  userId: string;
  canRevertirVenta: boolean;
  leadsActivos: LeadActivoDTO[];
}) {
  const [items, setItems] = useState<VehiculoDTO[]>(initialItems);
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  const [filter, setFilter] = useState<"todos" | EstadoVehiculo>("todos");
  const [orden, setOrden] = useState<"reciente" | "precio" | "dias">("reciente");
  const [vista, setVista] = useState<"grilla" | "tabla">("grilla");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<StepKey>("fotos");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [saleTarget, setSaleTarget] = useState<VehiculoDTO | null>(null);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    vendedorId: userId,
    compradorNombre: "",
    precioFinal: "",
    comision: "",
  });
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleWarningLeads, setSaleWarningLeads] = useState<SaleWarningLead[] | null>(null);
  const [saleWarningExpanded, setSaleWarningExpanded] = useState(false);
  const [reassigningLeadId, setReassigningLeadId] = useState<string | null>(null);

  const [leadsState, setLeadsState] = useState<LeadActivoDTO[]>(leadsActivos);
  useEffect(() => {
    setLeadsState(leadsActivos);
  }, [leadsActivos]);

  const leadsPorVehiculo = useMemo(() => {
    const map = new Map<string, LeadActivoDTO[]>();
    for (const l of leadsState) {
      const arr = map.get(l.vehiculoId) ?? [];
      arr.push(l);
      map.set(l.vehiculoId, arr);
    }
    return map;
  }, [leadsState]);

  // Vehículos disponibles para reasignar un lead, priorizando misma
  // categoría y después precio más cercano al del vehículo que se vendió —
  // con lo que ya tenemos en `items` alcanza, sin pedir nada nuevo al server.
  function suggestedVehiculos(target: VehiculoDTO | null): VehiculoDTO[] {
    if (!target) return [];
    return items
      .filter((v) => v.estado === "DISPONIBLE" && v.id !== target.id)
      .slice()
      .sort((a, b) => {
        const aSame = a.categoria === target.categoria ? 0 : 1;
        const bSame = b.categoria === target.categoria ? 0 : 1;
        if (aSame !== bSame) return aSame - bSame;
        return Math.abs(a.precioUsd - target.precioUsd) - Math.abs(b.precioUsd - target.precioUsd);
      });
  }

  async function handleReassign(lead: SaleWarningLead, newVehiculoId: string) {
    if (!newVehiculoId) return;
    const target = items.find((v) => v.id === newVehiculoId);
    if (!target) return;

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehiculoId: newVehiculoId }),
    });
    if (!res.ok) {
      setReassigningLeadId(null);
      return;
    }

    setLeadsState((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, vehiculoId: newVehiculoId } : l))
    );
    setSaleWarningLeads((prev) =>
      prev
        ? prev.map((l) =>
            l.id === lead.id
              ? { ...l, reassignTo: { id: target.id, marca: target.marca, modelo: target.modelo } }
              : l
          )
        : prev
    );
    setReassigningLeadId(null);
    showToast();
  }

  const [iaResult, setIaResult] = useState<number | null>(null);
  const [iaFuente, setIaFuente] = useState<"real" | "simulada" | null>(null);
  const [iaVersion, setIaVersion] = useState<string | null>(null);
  const [iaAnioReferencia, setIaAnioReferencia] = useState<number | null>(null);
  const [iaLoading, setIaLoading] = useState(false);

  const [existingFotos, setExistingFotos] = useState<string[]>([]);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const fotoPreviews = useMemo(
    () => fotoFiles.map((f) => URL.createObjectURL(f)),
    [fotoFiles]
  );
  useEffect(() => {
    return () => fotoPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [fotoPreviews]);

  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropTarget, setCropTarget] = useState<{ file: File; url: string } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropSaving, setCropSaving] = useState(false);

  useBodyScrollLock(showModal || !!cropTarget || !!saleTarget || !!saleWarningLeads);

  useEffect(() => {
    if (cropTarget || cropQueue.length === 0) return;
    const [next, ...rest] = cropQueue;
    setCropQueue(rest);
    setCropTarget({ file: next, url: URL.createObjectURL(next) });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [cropQueue, cropTarget]);

  function handleFotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    const inFlight = fotoFiles.length + cropQueue.length + (cropTarget ? 1 : 0);
    const remaining = FOTOS_MAX_COUNT - existingFotos.length - inFlight;
    const accepted: File[] = [];
    let error: string | null = null;
    for (const file of selected) {
      if (accepted.length >= remaining) {
        error = `Máximo ${FOTOS_MAX_COUNT} fotos por vehículo`;
        break;
      }
      if (!FOTO_ALLOWED_TYPES.includes(file.type as (typeof FOTO_ALLOWED_TYPES)[number])) {
        error = `${file.name}: usá JPG, PNG o WEBP`;
        continue;
      }
      if (file.size > FOTO_MAX_BYTES) {
        error = `${file.name}: pesa más de 5MB`;
        continue;
      }
      accepted.push(file);
    }
    setFotoError(error);
    if (accepted.length > 0) setCropQueue((prev) => [...prev, ...accepted]);
  }

  function removeExistingFoto(url: string) {
    setExistingFotos((prev) => prev.filter((u) => u !== url));
  }

  function removeNewFoto(index: number) {
    setFotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirmCrop() {
    if (!cropTarget || !croppedAreaPixels) return;
    setCropSaving(true);
    try {
      const cropped = await getCroppedImageFile(
        cropTarget.url,
        croppedAreaPixels,
        cropTarget.file.name
      );
      setFotoFiles((prev) => [...prev, cropped]);
    } catch {
      setFotoError("No se pudo procesar el recorte, probá de nuevo");
    } finally {
      URL.revokeObjectURL(cropTarget.url);
      setCropTarget(null);
      setCropSaving(false);
    }
  }

  function cancelCrop() {
    if (cropTarget) URL.revokeObjectURL(cropTarget.url);
    setCropTarget(null);
  }

  const ordenLabel: Record<typeof orden, string> = {
    reciente: "Más reciente",
    precio: "Mayor precio",
    dias: "Más días en stock",
  };

  function cycleOrden() {
    setOrden((o) => (o === "reciente" ? "precio" : o === "precio" ? "dias" : "reciente"));
  }

  const diasEnStock = (v: VehiculoDTO) =>
    Math.floor((Date.now() - new Date(v.fechaIngreso).getTime()) / 86400000);

  const visible = useMemo(() => {
    const base = filter === "todos" ? items : items.filter((i) => i.estado === filter);
    return base.slice().sort((a, b) => {
      if (orden === "precio") return b.precioUsd - a.precioUsd;
      if (orden === "dias") return diasEnStock(b) - diasEnStock(a);
      return new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime();
    });
  }, [items, filter, orden]);

  const kpis = useMemo(() => {
    const activos = items.filter((v) => v.estado !== "VENDIDO");
    const total = activos.length || 1;
    const disponibles = activos.filter((v) => v.estado === "DISPONIBLE").length;
    const reservados = activos.filter((v) => v.estado === "RESERVADO").length;
    const aRevisar = activos.filter((v) => docStatus(v).tier !== "ok").length;
    const antiguedadProm = activos.length
      ? Math.round(activos.reduce((sum, v) => sum + diasEnStock(v), 0) / activos.length)
      : 0;
    return {
      disponibles,
      reservados,
      aRevisar,
      antiguedadProm,
      pctDisponibles: Math.round((disponibles / total) * 100),
      pctReservados: Math.round((reservados / total) * 100),
      pctARevisar: Math.round((aRevisar / total) * 100),
      pctAntiguedad: Math.min(100, Math.round((antiguedadProm / 45) * 100)),
    };
  }, [items]);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 1400);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sucursalId: defaultSucursalId });
    setError(null);
    setIaResult(null);
    setIaFuente(null);
    setIaVersion(null);
    setIaAnioReferencia(null);
    setExistingFotos([]);
    setFotoFiles([]);
    setFotoError(null);
    setCropQueue([]);
    setCropTarget(null);
    setStep("fotos");
    setShowModal(true);
  }

  async function suggestPrice() {
    const anio = Number(form.anio);
    if (!anio) return;

    setIaLoading(true);
    setIaFuente(null);
    setIaVersion(null);
    setIaAnioReferencia(null);

    const marca = form.marca.trim();
    const modelo = form.modelo.trim();

    if (marca && modelo) {
      try {
        const params = new URLSearchParams({ marca, modelo, anio: String(anio) });
        const res = await fetch(`/api/tasacion/mercado?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.referencia) {
            setIaResult(data.referencia.precioUsd);
            setIaFuente("real");
            setIaVersion(`${data.referencia.marca} ${data.referencia.modelo} — ${data.referencia.version}`);
            setIaAnioReferencia(data.referencia.anio);
            setIaLoading(false);
            return;
          }
        }
      } catch {
        // sigue al fallback simulado — nunca debe romper la sugerencia.
      }
    }

    const precio = estimarPrecio({
      categoria: form.categoria,
      anio,
      km: Number(form.km) || 0,
    });
    setIaResult(precio);
    setIaFuente("simulada");
    setIaLoading(false);
  }

  function useIaPrice() {
    if (iaResult === null) return;
    setForm((f) => ({ ...f, precioUsd: String(iaResult) }));
  }

  function openEdit(v: VehiculoDTO) {
    setEditingId(v.id);
    setForm({
      sucursalId: v.sucursalId,
      marca: v.marca,
      modelo: v.modelo,
      anio: String(v.anio),
      km: String(v.km),
      precioUsd: String(v.precioUsd),
      categoria: v.categoria ?? "Sedán",
      transmision: v.transmision ?? "",
      motor: v.motor ?? "",
      docTitulo: v.docTitulo,
      docCedula: v.docCedula,
      docDominio: v.docDominio,
      docLibreDeuda: v.docLibreDeuda,
      vtvVencimiento: v.vtvVencimiento ?? "",
    });
    setError(null);
    setExistingFotos(v.fotos);
    setFotoFiles([]);
    setFotoError(null);
    setCropQueue([]);
    setCropTarget(null);
    setStep("fotos");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.marca.trim() || !form.modelo.trim()) {
      setError("Completá al menos marca y modelo");
      return;
    }
    if (!form.sucursalId) {
      setError("Elegí una sucursal");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      sucursalId: form.sucursalId,
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: Number(form.anio) || new Date().getFullYear(),
      km: Number(form.km) || 0,
      precioUsd: Number(form.precioUsd) || 0,
      categoria: form.categoria,
      transmision: form.transmision.trim() || null,
      motor: form.motor.trim() || null,
      docTitulo: form.docTitulo,
      docCedula: form.docCedula,
      docDominio: form.docDominio,
      docLibreDeuda: form.docLibreDeuda,
      vtvVencimiento: form.vtvVencimiento || null,
    };

    try {
      const res = await fetch(
        editingId ? `/api/vehiculos/${editingId}` : "/api/vehiculos",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo guardar el vehículo");
        setSaving(false);
        return;
      }
      let saved: VehiculoDTO = await res.json();
      const isNew = !editingId;

      if (fotoFiles.length > 0 || existingFotos.length !== saved.fotos.length) {
        const fd = new FormData();
        fd.append("keep", JSON.stringify(existingFotos));
        fotoFiles.forEach((f) => fd.append("files", f));

        try {
          const fotoRes = await fetch(`/api/vehiculos/${saved.id}/fotos`, {
            method: "POST",
            body: fd,
          });
          if (fotoRes.ok) {
            saved = await fotoRes.json();
          } else {
            const data = await fotoRes.json().catch(() => null);
            if (isNew) setEditingId(saved.id);
            setItems((prev) =>
              isNew ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i))
            );
            setError(
              data?.error ?? "El vehículo se guardó pero no se pudieron subir las fotos"
            );
            setSaving(false);
            return;
          }
        } catch {
          if (isNew) setEditingId(saved.id);
          setItems((prev) =>
            isNew ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i))
          );
          setError("El vehículo se guardó pero hubo un error de conexión subiendo las fotos");
          setSaving(false);
          return;
        }
      }

      setItems((prev) =>
        isNew ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i))
      );
      showToast();
      setShowModal(false);
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function toggleReserva(v: VehiculoDTO) {
    const nextEstado: EstadoVehiculo =
      v.estado === "DISPONIBLE" ? "RESERVADO" : "DISPONIBLE";
    const res = await fetch(`/api/vehiculos/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nextEstado }),
    });
    if (res.ok) {
      const saved: VehiculoDTO = await res.json();
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      showToast();
    }
  }

  async function publishToMercadoLibre(v: VehiculoDTO) {
    setPublishingId(v.id);
    try {
      const res = await fetch(`/api/vehiculos/${v.id}/mercadolibre`, { method: "POST" });
      const data = await res.json();
      const saved: VehiculoDTO | undefined = res.ok ? data : data.vehiculo;
      if (saved) {
        setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      }
      showToast();
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === v.id ? { ...i, mlLastError: "Error de conexión, intentá de nuevo" } : i
        )
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este vehículo del stock?")) return;
    const res = await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar el vehículo");
    }
  }

  function openSaleModal(v: VehiculoDTO) {
    setSaleTarget(v);
    setSaleForm({
      vendedorId: canRevertirVenta ? "" : userId,
      compradorNombre: "",
      precioFinal: String(v.precioUsd),
      comision: "",
    });
    setSaleError(null);
    setSaleWarningLeads(null);
    setSaleWarningExpanded(false);
    setReassigningLeadId(null);
  }

  async function submitSale() {
    if (!saleTarget) return;
    setSaleSaving(true);
    setSaleError(null);

    try {
      const res = await fetch(`/api/vehiculos/${saleTarget.id}/venta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendedorId: saleForm.vendedorId,
          compradorNombre: saleForm.compradorNombre.trim() || undefined,
          precioFinal: Number(saleForm.precioFinal) || 0,
          comision: Number(saleForm.comision) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSaleError(data?.error ?? "No se pudo registrar la venta");
        setSaleSaving(false);
        setSaleWarningLeads(null);
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === saleTarget.id ? { ...i, estado: "VENDIDO" } : i))
      );
      showToast();
      setSaleTarget(null);
      setSaleWarningLeads(null);
    } catch {
      setSaleError("Error de conexión, intentá de nuevo");
      setSaleWarningLeads(null);
    } finally {
      setSaleSaving(false);
    }
  }

  function handleConfirmVentaClick() {
    if (!saleTarget) return;
    if (!saleForm.vendedorId) {
      setSaleError("Elegí un vendedor");
      return;
    }
    const activos = leadsPorVehiculo.get(saleTarget.id) ?? [];
    if (activos.length > 0) {
      setSaleError(null);
      setSaleWarningLeads(activos);
      return;
    }
    submitSale();
  }

  async function revertVenta(v: VehiculoDTO) {
    if (!confirm(`¿Revertir la venta de ${v.marca} ${v.modelo} y volverlo a Disponible?`)) return;
    const res = await fetch(`/api/vehiculos/${v.id}/venta`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === v.id ? { ...i, estado: "DISPONIBLE" } : i))
      );
      showToast();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo revertir la venta");
    }
  }

  return (
    <>
      <div className={styles.topActions}>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <Plus size={14} />
          Nuevo vehículo
        </button>
      </div>

      <div className={panelStyles.kpiRow} style={{ marginBottom: 18 }}>
        <KpiBar
          color="var(--success)"
          label="Disponibles"
          value={String(kpis.disponibles)}
          percent={kpis.pctDisponibles}
        />
        <KpiBar
          color="var(--warn)"
          label="Reservados"
          value={String(kpis.reservados)}
          percent={kpis.pctReservados}
        />
        <KpiBar
          color="var(--danger)"
          label="Documentación a revisar"
          value={String(kpis.aRevisar)}
          percent={kpis.pctARevisar}
        />
        <KpiBar
          color="var(--info)"
          label="Antigüedad promedio en stock"
          value={String(kpis.antiguedadProm)}
          unit="días"
          percent={kpis.pctAntiguedad}
        />
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          {(["todos", "DISPONIBLE", "RESERVADO", "VENDIDO"] as const).map((f) => (
            <button
              key={f}
              className={`${styles.fbtn} ${filter === f ? styles.active : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "todos" ? "Todos" : stateLabel[f]}
            </button>
          ))}
        </div>
        <div className={styles.filterRight}>
          <button type="button" className={styles.ordenBtn} onClick={cycleOrden}>
            <ArrowUpDown size={13} />
            {ordenLabel[orden]}
          </button>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={vista === "grilla" ? styles.active : ""}
              onClick={() => setVista("grilla")}
              aria-label="Ver en grilla"
              title="Grilla"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              className={vista === "tabla" ? styles.active : ""}
              onClick={() => setVista("tabla")}
              aria-label="Ver en tabla"
              title="Tabla"
            >
              <Table2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>No hay vehículos en este filtro.</p>
      ) : vista === "tabla" ? (
        <div className={panelStyles.tableWrap}>
          <table className={panelStyles.table}>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Precio</th>
                <th>Documentación</th>
                <th>Días en stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => {
                const ds = docStatus(v);
                return (
                  <tr key={v.id} onClick={() => openEdit(v)} style={{ cursor: "pointer" }}>
                    <td>
                      {v.marca} {v.modelo}
                      <div className={panelStyles.tableSub}>
                        {v.anio} · {v.km.toLocaleString("es-AR")} km
                      </div>
                    </td>
                    <td>
                      <span className={styles.tableStateChip}>
                        <span style={{ background: stateColor[v.estado] }} />
                        {stateLabel[v.estado]}
                      </span>
                    </td>
                    <td className="mono">USD {v.precioUsd.toLocaleString("es-AR")}</td>
                    <td>
                      <span className={`${styles.docs} ${styles[docTierClass[ds.tier]]}`}>
                        {ds.label}
                      </span>
                    </td>
                    <td className="mono">{diasEnStock(v)}</td>
                    <td>
                      {v.estado !== "VENDIDO" && (
                        <button
                          className={styles.btnGhost}
                          onClick={(e) => {
                            e.stopPropagation();
                            openSaleModal(v);
                          }}
                        >
                          Vender
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((v) => {
            const ds = docStatus(v);
            const vendido = v.estado === "VENDIDO";
            return (
              <div className={styles.card} key={v.id} onClick={() => openEdit(v)}>
                <div className={styles.photo}>
                  <div className={styles.state}>
                    <button
                      type="button"
                      className={styles.stateChip}
                      disabled={vendido}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!vendido) toggleReserva(v);
                      }}
                    >
                      <span style={{ background: stateColor[v.estado], boxShadow: `0 0 6px ${stateColor[v.estado]}` }} />
                      {stateLabel[v.estado]}
                    </button>
                    {(leadsPorVehiculo.get(v.id)?.length ?? 0) > 0 && (
                      <span className={styles.interesados}>
                        {leadsPorVehiculo.get(v.id)!.length} interesado
                        {leadsPorVehiculo.get(v.id)!.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  {vendido ? (
                    canRevertirVenta && (
                      <button
                        className={styles.del}
                        title="Revertir venta"
                        onClick={(e) => {
                          e.stopPropagation();
                          revertVenta(v);
                        }}
                      >
                        <RotateCcw size={12} />
                      </button>
                    )
                  ) : (
                    <button
                      className={styles.del}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(v.id);
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                  {v.fotos.length > 0 ? (
                    <img className={styles.photoImg} src={v.fotos[0]} alt="" />
                  ) : (
                    <CarSVG />
                  )}
                </div>
                <div className={styles.body}>
                  <div className={`${styles.title} disp`}>
                    {v.marca} {v.modelo}
                  </div>
                  <div className={`${styles.meta} mono`}>
                    {v.anio} · {v.km.toLocaleString("es-AR")} km
                  </div>
                  <div className={`${styles.docs} ${styles[docTierClass[ds.tier]]}`}>
                    {ds.label}
                  </div>
                  <div className={styles.foot}>
                    <div className={`${styles.price} disp`}>
                      USD {v.precioUsd.toLocaleString("es-AR")}
                    </div>
                    {!vendido && (
                      <button
                        className={styles.btnGhost}
                        onClick={(e) => {
                          e.stopPropagation();
                          openSaleModal(v);
                        }}
                      >
                        Vender
                      </button>
                    )}
                  </div>

                  <div className={styles.mlRow}>
                    {v.mlPermalink ? (
                      <a
                        href={v.mlPermalink}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.mlLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Image
                          className={styles.mlWordmark}
                          src="/logos/mercadolibre.svg"
                          alt="Mercado Libre"
                          width={70}
                          height={12}
                        />
                        {v.mlStatus === "payment_required" ? "Ver (pendiente de pago) ↗" : "Ver ↗"}
                      </a>
                    ) : (
                      <button
                        className={styles.mlBtn}
                        disabled={publishingId === v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          publishToMercadoLibre(v);
                        }}
                      >
                        <Image
                          className={styles.mlWordmark}
                          src="/logos/mercadolibre.svg"
                          alt="Mercado Libre"
                          width={70}
                          height={12}
                        />
                        {publishingId === v.id ? "Publicando…" : "Publicar"}
                      </button>
                    )}
                    {v.mlLastError && (
                      <p className={styles.mlError}>{v.mlLastError}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`${styles.modalBg} ${showModal ? styles.show : ""}`}
        onClick={() => setShowModal(false)}
      >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h3 className="disp">{editingId ? "Editar vehículo" : "Nuevo vehículo"}</h3>

          <div className={styles.stepper}>
            {steps.map((s, i) => (
              <button
                type="button"
                key={s.key}
                className={`${styles.stepTab} ${step === s.key ? styles.active : ""}`}
                onClick={() => setStep(s.key)}
              >
                <span className={styles.stepNum}>{i + 1}</span>
                {s.label}
              </button>
            ))}
          </div>

          {error && <div className={styles.errorBox} style={{ marginTop: 14 }}>{error}</div>}

          {step === "fotos" && (
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label>Fotos (hasta {FOTOS_MAX_COUNT})</label>
              <p className={styles.fotoTip}>
                Recomendamos fotos horizontales para mejor visualización.
              </p>
              <div className={styles.fotosGrid}>
                {existingFotos.map((url) => (
                  <div className={styles.fotoThumb} key={url}>
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className={styles.fotoRemove}
                      onClick={() => removeExistingFoto(url)}
                      aria-label="Sacar foto"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {fotoFiles.map((file, i) => (
                  <div className={styles.fotoThumb} key={`${file.name}-${i}`}>
                    <img src={fotoPreviews[i]} alt="" />
                    <button
                      type="button"
                      className={styles.fotoRemove}
                      onClick={() => removeNewFoto(i)}
                      aria-label="Sacar foto"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {existingFotos.length + fotoFiles.length < FOTOS_MAX_COUNT && (
                  <label className={styles.fotoAddTile}>
                    <Plus size={18} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFotosSelected}
                      hidden
                    />
                  </label>
                )}
              </div>
              <p className={styles.fotoTip} style={{ marginTop: 8, marginBottom: 0 }}>
                {existingFotos.length + fotoFiles.length} de {FOTOS_MAX_COUNT}
              </p>
              {fotoError && <p className={styles.fotoHint}>{fotoError}</p>}
            </div>
          )}

          {step === "datos" && (
            <>
              {sucursales.length > 1 && (
                <div className={styles.field} style={{ marginTop: 16 }}>
                  <label>Sucursal</label>
                  <select
                    value={form.sucursalId}
                    onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.fieldRow} style={{ marginTop: sucursales.length > 1 ? 0 : 16 }}>
                <div className={styles.field}>
                  <label>Marca</label>
                  <input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div className={styles.field}>
                  <label>Modelo</label>
                  <input
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Corolla XEI"
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Año</label>
                  <input
                    type="number"
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                    placeholder="2024"
                  />
                </div>
                <div className={styles.field}>
                  <label>Km</label>
                  <input
                    type="number"
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    placeholder="12000"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  <option value="Compacto">Compacto</option>
                  <option value="Sedán">Sedán</option>
                  <option value="SUV">SUV</option>
                  <option value="Pickup">Pickup</option>
                </select>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Transmisión</label>
                  <input
                    value={form.transmision}
                    onChange={(e) => setForm({ ...form, transmision: e.target.value })}
                    placeholder="Automática, Manual, CVT…"
                  />
                </div>
                <div className={styles.field}>
                  <label>Motor</label>
                  <input
                    value={form.motor}
                    onChange={(e) => setForm({ ...form, motor: e.target.value })}
                    placeholder="1.8L 16v, 3.0 V6 TDI…"
                  />
                </div>
              </div>
            </>
          )}

          {step === "precio" && (
            <>
              {!editingId && (
                <div className={styles.iaBox} style={{ marginTop: 16 }}>
                  <div className={styles.iaBoxHead}>
                    <span>
                      <Sparkles size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                      Tasación con IA
                    </span>
                    <button
                      type="button"
                      className={styles.iaSuggestBtn}
                      onClick={suggestPrice}
                      disabled={iaLoading}
                    >
                      {iaLoading ? "Buscando…" : "Sugerir precio"}
                    </button>
                  </div>
                  <div
                    className={`${styles.iaResult} ${iaFuente === "real" ? styles.iaResultReal : ""}`}
                  >
                    {iaResult !== null ? `USD ${iaResult.toLocaleString("es-AR")}` : "—"}
                  </div>
                  <div className={styles.iaNote}>
                    {iaLoading ? (
                      "Buscando precio de referencia en Arg Autos API…"
                    ) : iaResult !== null ? (
                      <>
                        {iaFuente === "real" ? (
                          <>
                            <span className={styles.iaBadgeReal}>● Dato real de mercado</span>
                            <br />
                            Precio de referencia CCA
                            {iaAnioReferencia && iaAnioReferencia !== Number(form.anio)
                              ? ` (año ${iaAnioReferencia}, más cercano disponible)`
                              : ""}
                            : <b>USD {iaResult.toLocaleString("es-AR")}</b> — fuente: Arg Autos API.
                            {iaVersion && (
                              <>
                                <br />
                                {iaVersion}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={styles.iaBadgeSim}>● Estimación simulada</span>
                            <br />
                            Estimación según categoría, año y kilometraje.{" "}
                            <b>No son datos reales de mercado</b> — no encontramos esta marca/modelo
                            en Arg Autos API, o el servicio no respondió.
                          </>
                        )}
                        <br />
                        <button type="button" className={styles.iaUseBtn} onClick={useIaPrice}>
                          Usar este precio →
                        </button>
                      </>
                    ) : (
                      'Completá marca, modelo, año, km y categoría, y tocá "Sugerir precio" para ver una estimación.'
                    )}
                  </div>
                </div>
              )}

              <div className={styles.field} style={{ marginTop: editingId ? 16 : 0 }}>
                <label>Precio (USD)</label>
                <input
                  type="number"
                  value={form.precioUsd}
                  onChange={(e) => setForm({ ...form, precioUsd: e.target.value })}
                  placeholder="24500"
                />
              </div>
            </>
          )}

          {step === "docs" && (
            <>
              <div className={styles.sectionLabel} style={{ marginTop: 16, paddingTop: 0, borderTop: "none" }}>
                Documentación
              </div>
              <div className={styles.docGrid}>
                <label className={styles.docCheck}>
                  <input
                    type="checkbox"
                    checked={form.docTitulo}
                    onChange={(e) => setForm({ ...form, docTitulo: e.target.checked })}
                  />
                  Título
                </label>
                <label className={styles.docCheck}>
                  <input
                    type="checkbox"
                    checked={form.docCedula}
                    onChange={(e) => setForm({ ...form, docCedula: e.target.checked })}
                  />
                  Cédula
                </label>
                <label className={styles.docCheck}>
                  <input
                    type="checkbox"
                    checked={form.docDominio}
                    onChange={(e) => setForm({ ...form, docDominio: e.target.checked })}
                  />
                  Informe de dominio
                </label>
                <label className={styles.docCheck}>
                  <input
                    type="checkbox"
                    checked={form.docLibreDeuda}
                    onChange={(e) => setForm({ ...form, docLibreDeuda: e.target.checked })}
                  />
                  Libre de deuda
                </label>
              </div>
              <div className={styles.field} style={{ marginTop: 12 }}>
                <label>Vencimiento VTV</label>
                <input
                  type="date"
                  value={form.vtvVencimiento}
                  onChange={(e) => setForm({ ...form, vtvVencimiento: e.target.value })}
                />
                {form.vtvVencimiento &&
                  (() => {
                    const dias = diasHastaVtv(form.vtvVencimiento);
                    if (dias === null) return null;
                    if (dias < 0) {
                      return (
                        <p style={{ fontSize: 11.5, color: "var(--danger-text)", marginTop: 6 }}>
                          ⚠ Vencida hace {Math.abs(dias)} día{Math.abs(dias) === 1 ? "" : "s"}
                        </p>
                      );
                    }
                    if (dias <= 30) {
                      return (
                        <p style={{ fontSize: 11.5, color: "var(--warn-text)", marginTop: 6 }}>
                          Vence en {dias} día{dias === 1 ? "" : "s"}
                        </p>
                      );
                    }
                    return null;
                  })()}
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            {step === "fotos" ? (
              <button className={styles.btnGhost} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setStep(steps[steps.findIndex((s) => s.key === step) - 1].key)}
              >
                <ChevronLeft size={14} />
                Atrás
              </button>
            )}
            {step === "docs" ? (
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar vehículo"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setStep(steps[steps.findIndex((s) => s.key === step) + 1].key)}
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`${styles.modalBg} ${cropTarget ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">Encuadrá la foto</h3>
          <p className={styles.fotoTip}>Arrastrá para mover y usá el control para hacer zoom.</p>

          <div className={styles.cropArea}>
            {cropTarget && (
              <Cropper
                image={cropTarget.url}
                crop={crop}
                zoom={zoom}
                aspect={FOTO_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.cropZoom}
          />

          <div className={styles.modalActions}>
            <button className={styles.btnGhost} onClick={cancelCrop}>
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={confirmCrop} disabled={cropSaving}>
              {cropSaving ? "Procesando…" : "Confirmar recorte"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.modalBg} ${saleTarget ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">
            Registrar venta {saleTarget ? `— ${saleTarget.marca} ${saleTarget.modelo}` : ""}
          </h3>

          {saleError && <div className={styles.errorBox} style={{ marginTop: 14 }}>{saleError}</div>}

          {canRevertirVenta && (
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label>Vendedor</label>
              <select
                value={saleForm.vendedorId}
                onChange={(e) => setSaleForm({ ...saleForm, vendedorId: e.target.value })}
              >
                <option value="">Elegí un vendedor</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.field} style={canRevertirVenta ? undefined : { marginTop: 16 }}>
            <label>Nombre del comprador (opcional)</label>
            <input
              type="text"
              value={saleForm.compradorNombre}
              onChange={(e) => setSaleForm({ ...saleForm, compradorNombre: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Precio final (USD)</label>
              <input
                type="number"
                value={saleForm.precioFinal}
                onChange={(e) => setSaleForm({ ...saleForm, precioFinal: e.target.value })}
                placeholder="24500"
              />
            </div>
            <div className={styles.field}>
              <label>Comisión (USD)</label>
              <input
                type="number"
                value={saleForm.comision}
                onChange={(e) => setSaleForm({ ...saleForm, comision: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.btnGhost} onClick={() => setSaleTarget(null)}>
              Cancelar
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleConfirmVentaClick}
              disabled={saleSaving}
            >
              {saleSaving ? "Guardando…" : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.modalBg} ${saleWarningLeads ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">¿Revisar leads antes de vender?</h3>

          <p className={styles.warnText}>
            Hay {saleWarningLeads?.length ?? 0} lead
            {(saleWarningLeads?.length ?? 0) === 1 ? "" : "s"} interesado
            {(saleWarningLeads?.length ?? 0) === 1 ? "" : "s"} en{" "}
            {saleTarget ? `${saleTarget.marca} ${saleTarget.modelo}` : "este vehículo"} que no se
            cerraron. ¿Querés revisarlos antes de continuar?
          </p>

          <button
            type="button"
            className={styles.btnGhost}
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setSaleWarningExpanded((v) => !v)}
          >
            {saleWarningExpanded
              ? "Ocultar leads"
              : `Ver los ${saleWarningLeads?.length ?? 0} leads`}
          </button>

          {saleWarningExpanded && (
            <div className={styles.warnList}>
              {saleWarningLeads?.map((l) => (
                <div className={styles.warnLeadRow} key={l.id}>
                  <div className={styles.warnLeadMain}>
                    <div>
                      <div className={styles.warnLeadName}>{l.nombreCliente}</div>
                      <div className={styles.warnLeadContacto}>{l.contacto || "Sin contacto"}</div>
                    </div>
                    <span className={styles.warnLeadEtapa}>{etapaLabel[l.etapa] ?? l.etapa}</span>
                  </div>

                  {l.reassignTo ? (
                    <div className={styles.warnReassignedTag}>
                      <Check size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                      Reasignado a {l.reassignTo.marca} {l.reassignTo.modelo}
                    </div>
                  ) : reassigningLeadId === l.id ? (
                    <div className={styles.warnReassignRow}>
                      <select
                        className={styles.warnReassignSelect}
                        autoFocus
                        defaultValue=""
                        onChange={(e) => handleReassign(l, e.target.value)}
                      >
                        <option value="" disabled>
                          Elegí un vehículo…
                        </option>
                        {suggestedVehiculos(saleTarget).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.marca} {v.modelo} — USD {v.precioUsd.toLocaleString("es-AR")}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.warnReassignCancel}
                        onClick={() => setReassigningLeadId(null)}
                        aria-label="Cancelar reasignación"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.warnReassignBtn}
                      onClick={() => setReassigningLeadId(l.id)}
                    >
                      Reasignar a otro vehículo
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {saleError && <div className={styles.errorBox} style={{ marginTop: 14 }}>{saleError}</div>}

          <div className={styles.modalActions}>
            <button
              className={styles.btnGhost}
              onClick={() => {
                setSaleWarningLeads(null);
                setReassigningLeadId(null);
              }}
            >
              Cancelar
            </button>
            <button className={styles.btnPrimary} onClick={submitSale} disabled={saleSaving}>
              {saleSaving ? "Guardando…" : "Continuar con la venta"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </>
  );
}
