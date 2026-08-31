"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { CarSVG } from "../CarSVG";
import { WhatsAppGlyph } from "../../icons/WhatsAppGlyph";
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
  fotos: string[];
  transmision: string | null;
  combustible: string | null;
  sucursal: string;
};

const estadoLabel: Record<EstadoVehiculo, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
};

const ordenes = [
  { key: "nuevos", label: "más nuevos" },
  { key: "precio", label: "menor precio" },
  { key: "km", label: "menos kilómetros" },
] as const;

function cuotaEstimada(precioUsd: number) {
  return Math.round(precioUsd * 0.0208);
}

export function CatalogoView({
  items,
  dominio,
}: {
  items: VehiculoCatalogoDTO[];
  dominio: string;
}) {
  const [marca, setMarca] = useState("");
  const [ordenIdx, setOrdenIdx] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  const marcas = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const v of items) conteo.set(v.marca, (conteo.get(v.marca) ?? 0) + 1);
    return Array.from(conteo.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let lista = items.filter((v) => {
      if (marca && v.marca !== marca) return false;
      if (q && !`${v.marca} ${v.modelo}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const ordenKey = ordenes[ordenIdx].key;
    lista = lista.slice().sort((a, b) => {
      if (ordenKey === "precio") return a.precioUsd - b.precioUsd;
      if (ordenKey === "km") return a.km - b.km;
      return b.anio - a.anio;
    });
    return lista;
  }, [items, marca, busqueda, ordenIdx]);

  const tituloLista = marca ? `${marca} disponibles` : "Vehículos disponibles";
  const subtituloLista = `${filtrados.length} ${
    filtrados.length === 1 ? "unidad" : "unidades"
  } · precios en dólares, actualizados hoy`;

  return (
    <>
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <Search size={14} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscá por marca o modelo — ej. Hilux, Cronos, SUV…"
          />
        </div>
        <button
          type="button"
          className={styles.ordenBtn}
          onClick={() => setOrdenIdx((i) => (i + 1) % ordenes.length)}
        >
          Ordenar: {ordenes[ordenIdx].label} ⇅
        </button>
      </div>

      <div className={styles.marcasRow}>
        <button
          type="button"
          className={`${styles.marcaChip} ${!marca ? styles.marcaChipActive : ""}`}
          onClick={() => setMarca("")}
        >
          Todas las marcas
          <span className={styles.marcaChipCount}>{items.length}</span>
        </button>
        {marcas.map(([m, count]) => (
          <button
            key={m}
            type="button"
            className={`${styles.marcaChip} ${marca === m ? styles.marcaChipActive : ""}`}
            onClick={() => setMarca(m)}
          >
            {m}
            <span className={styles.marcaChipCount}>{count}</span>
          </button>
        ))}
      </div>

      <div className={styles.listHead}>
        <div className={styles.listTitulo}>{tituloLista}</div>
        <div className={styles.listSubtitulo}>{subtituloLista}</div>
      </div>

      {filtrados.length === 0 ? (
        <p className={styles.empty}>No hay vehículos que coincidan con estos filtros.</p>
      ) : (
        <div className={styles.grid}>
          {filtrados.map((v) => (
            <Link href={`/c/${dominio}/${v.id}`} className={styles.card} key={v.id}>
              <div className={styles.cardPhoto}>
                {v.fotos.length > 0 ? (
                  <Image
                    className={styles.cardPhotoImg}
                    src={v.fotos[0]}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                ) : (
                  <div className={styles.cardPhotoPlaceholder}>
                    <CarSVG />
                  </div>
                )}
                <div className={styles.cardPhotoOverlay} />
                {v.estado === "RESERVADO" && (
                  <span className={`${styles.cardBadge} ${styles.reservado}`}>
                    <span className={styles.cardBadgeDot} />
                    {estadoLabel[v.estado]}
                  </span>
                )}
                {v.fotos.length > 0 && (
                  <span className={styles.cardFotosCount}>
                    {v.fotos.length} {v.fotos.length === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <div>
                  <div className={styles.cardPhotoModelo}>
                    {v.marca} {v.modelo}
                  </div>
                  <div className={styles.cardPhotoSpecs}>
                    {v.anio} · {v.km.toLocaleString("es-AR")} km
                    {v.transmision ? ` · ${v.transmision}` : ""}
                  </div>
                </div>

                <div className={styles.cardPriceRow}>
                  <div>
                    <div className={styles.cardPrice}>USD {v.precioUsd.toLocaleString("es-AR")}</div>
                    <div className={styles.cardPriceArs}>
                      ≈ ${Math.round(v.precioUsd * 1535).toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div className={styles.cardCuota}>
                    <div className={styles.cardCuotaLabel}>Cuotas desde</div>
                    <div className={styles.cardCuotaValue}>
                      USD {cuotaEstimada(v.precioUsd).toLocaleString("es-AR")}/mes
                    </div>
                  </div>
                </div>

                <div className={styles.cardFoot}>
                  <div className={styles.cardSucursal}>{v.sucursal}</div>
                  <div className={styles.cardActions}>
                    <span className={styles.cardWa}>
                      <WhatsAppGlyph size={14} />
                    </span>
                    <span className={styles.cardVerBtn}>Ver detalle</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
