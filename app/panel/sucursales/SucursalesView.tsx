"use client";

import { useState } from "react";
import styles from "./sucursales.module.css";

export type SucursalDTO = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  vehiculosCount: number;
};

type FormState = {
  nombre: string;
  direccion: string;
  telefono: string;
};

const emptyForm: FormState = {
  nombre: "",
  direccion: "",
  telefono: "",
};

export function SucursalesView({ initialItems }: { initialItems: SucursalDTO[] }) {
  const [items, setItems] = useState<SucursalDTO[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

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
    setForm({
      nombre: s.nombre,
      direccion: s.direccion ?? "",
      telefono: s.telefono ?? "",
    });
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
      const res = await fetch(
        editingId ? `/api/sucursales/${editingId}` : "/api/sucursales",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo guardar la sucursal");
        setSaving(false);
        return;
      }
      const saved: SucursalDTO = await res.json();
      setItems((prev) =>
        editingId
          ? prev.map((i) => (i.id === saved.id ? { ...saved, vehiculosCount: i.vehiculosCount } : i))
          : [...prev, { ...saved, vehiculosCount: 0 }]
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

  return (
    <>
      <div className={styles.topActions}>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Nueva sucursal
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Vehículos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td>{s.direccion || "—"}</td>
                <td>{s.telefono || "—"}</td>
                <td>
                  <span className={styles.countBadge}>{s.vehiculosCount}</span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <button className={styles.mini} onClick={() => openEdit(s)}>
                      Editar
                    </button>
                    {items.length > 1 && (
                      <button
                        className={styles.miniDanger}
                        onClick={() => handleDelete(s)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </>
  );
}
