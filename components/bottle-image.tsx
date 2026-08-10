"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";
import { Parallax } from "@/components/motion/parallax";
import type { Product } from "@/lib/products";

type Bottle = Pick<
  Product,
  "slug" | "name" | "code" | "juice" | "atmosphere" | "family"
>;

/** Bentuk yang dibutuhkan BottleImage: sama seperti Bottle plus URL fotonya. */
type PhotoBottle = Bottle & Pick<Product, "photoUrl">;

/**
 * Visual botol.
 *
 * Selama `photoUrl` masih null, yaitu selama foto varian belum diunggah ke bucket
 * product-photos, komponen menampilkan bidang atmosfer berwarna cairan varian
 * dengan siluet botol tipis yang jelas terbaca sebagai slot yang menunggu foto,
 * bukan ilustrasi produk palsu. Begitu fotonya diunggah lewat dashboard dan
 * photo_path diisi, foto langsung tampil tanpa ubah kode.
 */
function BottleSilhouette({
  juice,
  className,
}: {
  juice: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 160"
      className={cn("h-full w-auto", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="40"
        y="6"
        width="20"
        height="18"
        rx="2"
        stroke={juice}
        strokeOpacity="0.5"
      />
      <rect
        x="45"
        y="24"
        width="10"
        height="10"
        stroke={juice}
        strokeOpacity="0.35"
      />
      <rect
        x="22"
        y="34"
        width="56"
        height="118"
        rx="6"
        stroke={juice}
        strokeOpacity="0.55"
      />
      <rect
        x="22"
        y="96"
        width="56"
        height="56"
        rx="6"
        fill={juice}
        fillOpacity="0.14"
      />
    </svg>
  );
}

type BottleImageProps = {
  product: PhotoBottle;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Layer atmosfer kedua yang muncul saat kartu di-hover (FR-04). */
  showAtmosphereOnHover?: boolean;
  /**
   * Jarak hanyut botol di dalam bidang atmosfernya, dalam piksel. 0 = mati.
   *
   * Yang bergerak hanya botolnya; gradien atmosfer dan kode varian tetap diam,
   * jadi botol terbaca melayang di dalam bidang, bukan seluruh kartu bergeser.
   * Ruang gerak diambil dari padding di sekitar botol, jadi tepinya tidak
   * pernah tersingkap oleh `overflow-hidden` induknya.
   */
  parallax?: number;
};

export function BottleImage({
  product,
  className,
  sizes,
  priority,
  showAtmosphereOnHover,
  parallax = 0,
}: BottleImageProps) {
  // Jaring pengaman kalau objeknya dihapus dari bucket tanpa mengosongkan
  // photo_path: siluet tetap muncul, bukan kotak gambar rusak.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = product.photoUrl !== null && !photoFailed;

  const bottle = showPhoto ? (
    <Image
      src={product.photoUrl!}
      alt={`Botol parfum ${product.name}, ${product.family}`}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setPhotoFailed(true)}
      className="object-contain p-6 transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <BottleSilhouette
        juice={product.juice}
        className="max-h-[78%] transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
      />
    </div>
  );

  return (
    <div
      className={cn("relative overflow-hidden bg-charcoal", className)}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 50% 8%, ${product.atmosphere.from}26, ${product.atmosphere.to} 72%)`,
      }}
    >
      {showAtmosphereOnHover ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-[var(--ease-out-soft)] group-hover:opacity-100 group-focus-within:opacity-100"
          style={{
            backgroundImage: `radial-gradient(85% 65% at 50% 100%, ${product.atmosphere.from}66, transparent 70%)`,
          }}
        />
      ) : null}

      {showAtmosphereOnHover ? (
        <Spotlight color={product.juice} size={260} />
      ) : null}

      {/* Paralaks membungkus botol, bukan botolnya sendiri: botol sudah memakai
          transform lewat transisi CSS saat hover, dan dua sumber yang menulis
          properti yang sama akan saling menimpa. */}
      {parallax ? (
        <Parallax className="absolute inset-0" distance={parallax}>
          {bottle}
        </Parallax>
      ) : (
        bottle
      )}

      <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-widest text-muted/70">
        {product.code}
      </span>
    </div>
  );
}

export function BottleThumb({
  product,
  className,
}: {
  product: Bottle;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden border border-line", className)}
      style={{
        backgroundImage: `radial-gradient(110% 90% at 50% 10%, ${product.atmosphere.from}26, ${product.atmosphere.to} 75%)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <BottleSilhouette juice={product.juice} className="max-h-[80%]" />
      </div>
    </div>
  );
}
