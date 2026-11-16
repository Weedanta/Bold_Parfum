"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";
import { Parallax } from "@/components/motion/parallax";
import { getProductGallery, type Product } from "@/lib/products";

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
 * product-photos atau tidak tersedia di galeri lokal, komponen menampilkan bidang
 * atmosfer berwarna cairan varian dengan siluet botol tipis. Saat media tersedia,
 * foto dan video bisa digeser langsung lewat kontrol di dalam bingkai.
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
   */
  parallax?: number;
  /** Kontrol opsional untuk dipakai bersama ProductGallery di halaman detail. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  showGalleryControls?: boolean;
  videoControls?: boolean;
};

export function BottleImage({
  product,
  className,
  sizes,
  priority,
  showAtmosphereOnHover,
  parallax = 0,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  showGalleryControls = true,
  videoControls = false,
}: BottleImageProps) {
  const gallery = getProductGallery(product);
  const [internalIndex, setInternalIndex] = useState(0);
  // Catat per URL yang gagal dimuat supaya kegagalan satu slide tidak menyembunyikan slide lain.
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});

  const rawIndex = controlledIndex ?? internalIndex;
  const safeIndex = gallery.length > 0 ? ((rawIndex % gallery.length) + gallery.length) % gallery.length : 0;
  const activeMedia = gallery[safeIndex];
  const showMedia = Boolean(activeMedia) && !failedSrcs[activeMedia.src];

  function setIndex(next: number) {
    if (gallery.length === 0) return;
    const normalized = ((next % gallery.length) + gallery.length) % gallery.length;
    if (onActiveIndexChange) {
      onActiveIndexChange(normalized);
    } else {
      setInternalIndex(normalized);
    }
  }

  function handleControlClick(event: MouseEvent, targetIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    setIndex(targetIndex);
  }

  function markFailed(src: string) {
    setFailedSrcs((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }

  const bottle = showMedia ? (
    activeMedia.type === "video" ? (
      <video
        key={activeMedia.src}
        src={activeMedia.src}
        autoPlay
        muted
        loop
        playsInline
        controls={videoControls}
        aria-label={`Video botol parfum ${product.name}, ${product.family}`}
        onError={() => markFailed(activeMedia.src)}
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
      />
    ) : (
      <Image
        key={activeMedia.src}
        src={activeMedia.src}
        alt={`Botol parfum ${product.name}, ${product.family}${gallery.length > 1 ? ` (${safeIndex + 1}/${gallery.length})` : ""}`}
        fill
        sizes={sizes}
        priority={priority && safeIndex === 0}
        onError={() => markFailed(activeMedia.src)}
        className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
      />
    )
  ) : (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <BottleSilhouette
        juice={product.juice}
        className="max-h-[78%] transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
      />
    </div>
  );

  const hasMultiple = gallery.length > 1;

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
        <Parallax
          className={showMedia ? "absolute -inset-y-6 inset-x-0" : "absolute inset-0"}
          distance={parallax}
        >
          {bottle}
        </Parallax>
      ) : (
        bottle
      )}

      {showMedia ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-obsidian/80 via-obsidian/30 to-transparent"
        />
      ) : null}

      {showGalleryControls && hasMultiple ? (
        <>
          <button
            type="button"
            aria-label={`Media ${product.name} sebelumnya`}
            onClick={(event) => handleControlClick(event, safeIndex - 1)}
            className="absolute top-1/2 left-2.5 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink/20 bg-obsidian/65 text-ink/90 backdrop-blur-xs transition-[opacity,border-color,background-color,transform] duration-300 hover:border-gold-bright hover:bg-obsidian/85 hover:text-gold-bright focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            aria-label={`Media ${product.name} berikutnya`}
            onClick={(event) => handleControlClick(event, safeIndex + 1)}
            className="absolute top-1/2 right-2.5 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink/20 bg-obsidian/65 text-ink/90 backdrop-blur-xs transition-[opacity,border-color,background-color,transform] duration-300 hover:border-gold-bright hover:bg-obsidian/85 hover:text-gold-bright focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronRight className="size-4" />
          </button>

          <div
            role="group"
            aria-label={`Pilih media ${product.name}`}
            className="relative z-20 mx-auto mt-auto flex w-fit items-center gap-1.5 rounded-full bg-obsidian/55 px-2.5 py-1.5 backdrop-blur-xs"
            style={{ position: "absolute", bottom: "0.75rem", left: "50%", transform: "translateX(-50%)" }}
          >
            {gallery.map((item, index) => {
              const isActive = index === safeIndex;
              return (
                <button
                  key={item.src}
                  type="button"
                  aria-label={`Tampilkan ${item.type === "video" ? "video" : "foto"} ${index + 1} dari ${gallery.length}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => handleControlClick(event, index)}
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-300",
                    isActive
                      ? "w-4 bg-gold-bright"
                      : "w-1.5 bg-ink/45 hover:bg-ink/80",
                  )}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <span className="pointer-events-none absolute bottom-3 left-3 z-10 font-mono text-[10px] tracking-widest text-muted/70">
        {product.code}
      </span>
    </div>
  );
}

type PhotoThumb = Bottle & { photoUrl?: string | null };

export function BottleThumb({
  product,
  className,
}: {
  product: PhotoThumb;
  className?: string;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(product.photoUrl) && !photoFailed;

  return (
    <div
      className={cn("relative overflow-hidden border border-line", className)}
      style={{
        backgroundImage: `radial-gradient(110% 90% at 50% 10%, ${product.atmosphere.from}26, ${product.atmosphere.to} 75%)`,
      }}
    >
      {showPhoto ? (
        <Image
          src={product.photoUrl!}
          alt={`Botol parfum ${product.name}`}
          fill
          sizes="96px"
          onError={() => setPhotoFailed(true)}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <BottleSilhouette juice={product.juice} className="max-h-[80%]" />
        </div>
      )}
    </div>
  );
}
