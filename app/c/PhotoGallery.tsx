"use client";

import { useState } from "react";
import Image from "next/image";
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
        <Image
          className={styles.galleryImg}
          src={fotos[active]}
          alt=""
          fill
          sizes="(max-width: 860px) 100vw, 60vw"
          priority
        />
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
              <Image src={url} alt="" width={64} height={48} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
