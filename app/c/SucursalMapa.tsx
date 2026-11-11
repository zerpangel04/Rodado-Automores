"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { urlComoLlegar, urlMapaEmbed } from "@/lib/catalogo";
import styles from "./public.module.css";

// El iframe de Google recién se monta cuando el visitante toca "Ver mapa":
// antes de eso no se hace ningún pedido a Google (ni cookies de terceros).
export function SucursalMapa({ nombre, direccion }: { nombre: string; direccion: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={styles.mapa}>
      <div className={styles.mapaAcciones}>
        <button
          type="button"
          className={styles.mapaBtn}
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
        >
          <MapPin size={12} />
          {abierto ? "Ocultar mapa" : "Ver mapa"}
        </button>
        <a
          className={styles.mapaBtn}
          href={urlComoLlegar(direccion)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation size={12} />
          Cómo llegar
        </a>
      </div>
      {abierto && (
        <>
          <iframe
            className={styles.mapaFrame}
            src={urlMapaEmbed(direccion)}
            title={`Mapa de ${nombre}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className={styles.mapaNota}>Mapa de Google Maps. Google puede usar cookies propias.</div>
        </>
      )}
    </div>
  );
}
