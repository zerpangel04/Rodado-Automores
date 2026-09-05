"use client";

// Copiado y adaptado del modal de recorte de fotos de vehículos
// (app/panel/stock/StockView.tsx) — mismo paso "seleccionar → recortar →
// confirmar" con react-easy-crop, forzando 1:1 en vez de 4:3 porque acá
// se recorta el logo de la agencia, que se muestra como ícono cuadrado.

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageFile } from "@/lib/cropImage";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import styles from "./LogoCropModal.module.css";

const LOGO_ASPECT = 1;

export function LogoCropModal({
  imageUrl,
  fileName,
  onCancel,
  onConfirm,
}: {
  imageUrl: string;
  fileName: string;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useBodyScrollLock(true);

  async function confirmCrop() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const cropped = await getCroppedImageFile(imageUrl, croppedAreaPixels, fileName);
      await onConfirm(cropped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBg}>
      <div className={styles.modal}>
        <h3 className="disp">Encuadrá el logo</h3>
        <p className={styles.tip}>Arrastrá para mover y usá el control para hacer zoom.</p>

        <div className={styles.cropArea}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={LOGO_ASPECT}
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
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

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={styles.btnPrimary} onClick={confirmCrop} disabled={saving}>
            {saving ? "Procesando…" : "Confirmar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
