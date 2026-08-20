"use client";

import { useState } from "react";
import styles from "./equipo.module.css";

export type Rol = "DUENIO" | "ADMIN" | "VENDEDOR";

export type UsuarioDTO = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

const rolLabel: Record<Rol, string> = {
  DUENIO: "Dueño",
  ADMIN: "Admin",
  VENDEDOR: "Vendedor",
};

type FormState = {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
};

const emptyForm: FormState = {
  nombre: "",
  email: "",
  password: "",
  rol: "VENDEDOR",
};

export function EquipoView({
  initialItems,
  userId,
}: {
  initialItems: UsuarioDTO[];
  userId: string;
}) {
  const [items, setItems] = useState<UsuarioDTO[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

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
      const saved: UsuarioDTO = await res.json();
      setItems((prev) => [...prev, saved]);
      showToast();
      setShowModal(false);
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este usuario?")) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar el usuario");
    }
  }

  return (
    <>
      <div className={styles.topActions}>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Nuevo usuario
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>
                <span className={styles.rolBadge}>{rolLabel[u.rol]}</span>
              </td>
              <td>
                {u.id !== userId && (
                  <button className={styles.mini} onClick={() => handleDelete(u.id)}>
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`${styles.modalBg} ${showModal ? styles.show : ""}`}>
        <div className={styles.modal}>
          <h3 className="disp">Nuevo usuario</h3>

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
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
            >
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

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>Guardado ✓</div>
    </>
  );
}
