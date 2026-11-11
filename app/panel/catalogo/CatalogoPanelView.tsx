"use client";

import { useState } from "react";
import { CatalogLinkCard } from "../CatalogLinkCard";
import { CatalogoGeneralForm, type CatalogoGeneralDTO } from "./CatalogoGeneralForm";
import {
  CatalogoPersonalizacion,
  type CatalogoPersonalizacionDTO,
} from "./CatalogoPersonalizacion";
import styles from "./catalogo.module.css";

const PESTANIAS = [
  { key: "general", label: "General" },
  { key: "personalizacion", label: "Personalización" },
] as const;

export type Pestania = (typeof PESTANIAS)[number]["key"];

export function CatalogoPanelView({
  catalogUrl,
  general,
  personalizacion,
  pestaniaInicial,
}: {
  catalogUrl: string | null;
  general: CatalogoGeneralDTO;
  personalizacion: CatalogoPersonalizacionDTO;
  pestaniaInicial: Pestania;
}) {
  const [pestania, setPestania] = useState<Pestania>(pestaniaInicial);

  return (
    <>
      <div className={styles.pestanias}>
        {PESTANIAS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`${styles.pestania} ${pestania === p.key ? styles.pestaniaActiva : ""}`}
            aria-pressed={pestania === p.key}
            onClick={() => setPestania(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestania === "general" && (
        <>
          {catalogUrl ? (
            <CatalogLinkCard catalogUrl={catalogUrl} />
          ) : (
            <p className={styles.vacio}>Tu agencia todavía no tiene un catálogo público.</p>
          )}
          <CatalogoGeneralForm inicial={general} />
        </>
      )}

      {pestania === "personalizacion" && <CatalogoPersonalizacion inicial={personalizacion} />}
    </>
  );
}
