"use client";

import { useState } from "react";
import { CarSVG } from "./CarSVG";
import styles from "./public.module.css";

export function PhotoGallery({ fotos }: { fotos: string[] }) {
  const [active, setActive] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className={styles.galleryMain}>
        <CarSVG />
      </div>
    );
  }

  return (
    <>
      <div className={styles.galleryMain}>
        <img className={styles.galleryImg} src={fotos[active]} alt="" />
      </div>
      {fotos.length > 1 && (
        <div className={styles.galleryThumbs}>
          {fotos.map((url, i) => (
            <button
              type="button"
              key={url}
              className={`${styles.galleryThumb} ${i === active ? styles.galleryThumbActive : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
