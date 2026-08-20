"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CarSVG } from "../CarSVG";
import styles from "../public.module.css";

export type EstadoVehiculo = "DISPONIBLE" | "RESERVADO";

export type VehiculoCatalogoDTO = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precioUsd: number;
  estado: EstadoVehiculo;
};

const estadoLabel: Record<EstadoVehiculo, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
};

export function CatalogoView({
  items,
  dominio,
}: {
  items: VehiculoCatalogoDTO[];
  dominio: string;
}) {
  const [marca, setMarca] = useState("");
  const [estado, setEstado] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  const marcas = useMemo(
    () => Array.from(new Set(items.map((v) => v.marca))).sort(),
    [items]
  );

  const filtrados = useMemo(() => {
    const max = Number(precioMax);
    return items.filter((v) => {
      if (marca && v.marca !== marca) return false;
      if (estado && v.estado !== estado) return false;
      if (precioMax && !Number.isNaN(max) && max > 0 && v.precioUsd > max) return false;
      return true;
    });
  }, [items, marca, estado, precioMax]);

  return (
    <>
      <div className={styles.filterBar}>
        <select value={marca} onChange={(e) => setMarca(e.target.value)}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Disponibles y reservados</option>
          <option value="DISPONIBLE">Solo disponibles</option>
          <option value="RESERVADO">Solo reservados</option>
        </select>
        <input
          type="number"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          placeholder="Precio máx. (USD)"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className={styles.empty}>No hay vehículos que coincidan con estos filtros.</p>
      ) : (
        <div className={styles.grid}>
          {filtrados.map((v) => (
            <Link href={`/c/${dominio}/${v.id}`} className={styles.card} key={v.id}>
              <div className={styles.cardPhoto}>
                <span className={`${styles.cardBadge} ${styles[v.estado.toLowerCase()]}`}>
                  {estadoLabel[v.estado]}
                </span>
                <CarSVG />
              </div>
              <div className={styles.cardBody}>
                <div className={`${styles.cardTitle} disp`}>
                  {v.marca} {v.modelo}
                </div>
                <div className={styles.cardMeta}>
                  {v.anio} · {v.km.toLocaleString("es-AR")} km
                </div>
                <div className={styles.cardFoot}>
                  <div className={`${styles.cardPrice} disp`}>
                    USD {v.precioUsd.toLocaleString("es-AR")}
                  </div>
                  <div className={styles.cardArrow}>→</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
