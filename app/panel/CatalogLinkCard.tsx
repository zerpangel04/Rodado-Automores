"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import styles from "./panel.module.css";

export function CatalogLinkCard({ catalogUrl }: { catalogUrl: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // el navegador bloqueó el acceso al portapapeles (permiso o contexto
      // no seguro) — no hay mucho más que hacer que dejar que copien a mano
    }
  }

  const displayUrl = catalogUrl.replace(/^https?:\/\//, "");

  return (
    <div className={`${styles.card} ${styles.catalogLinkCard}`}>
      <div className={styles.catalogLinkInfo}>
        <span className={styles.catalogLinkLabel}>Tu catálogo público</span>
        <span className={styles.catalogLinkUrl}>{displayUrl}</span>
      </div>
      <div className={styles.catalogLinkActions}>
        <button type="button" className={styles.catalogLinkCopyBtn} onClick={copiarLink}>
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {copiado ? "¡Copiado!" : "Copiar link"}
        </button>
        <a
          href={catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.catalogLinkViewBtn}
        >
          <ExternalLink size={13} />
          Ver catálogo
        </a>
      </div>
    </div>
  );
}
