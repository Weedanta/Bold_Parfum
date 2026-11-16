"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { getProductGallery, type Product } from "@/lib/products";
import { BottleImage } from "@/components/bottle-image";

type ProductGalleryProps = {
  product: Product;
};

/**
 * Galeri interaktif di halaman detail produk.
 *
 * Panggung utama memakai BottleImage agar paralaks, siluet fallback, dan kode
 * varian tetap konsisten, ditambah kontrol geser sentuh, navigasi papan ketik,
 * penghitung slide, dan deretan thumbnail foto maupun video di bawahnya.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  const gallery = getProductGallery(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const total = gallery.length;
  const safeIndex = total > 0 ? ((activeIndex % total) + total) % total : 0;

  function go(next: number) {
    if (total <= 1) return;
    setActiveIndex(((next % total) + total) % total);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (total <= 1) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(safeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(safeIndex + 1);
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchRef.current;
    touchRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || total <= 1) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? safeIndex + 1 : safeIndex - 1);
    }
  }

  return (
    <div
      tabIndex={total > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription={total > 1 ? "carousel" : undefined}
      aria-label={`Galeri ${product.name}`}
      className="outline-none"
    >
      <div className="relative">
        <BottleImage
          product={product}
          sizes="(min-width: 1024px) 55vw, 100vw"
          priority
          parallax={44}
          activeIndex={safeIndex}
          onActiveIndexChange={setActiveIndex}
          showGalleryControls={false}
          videoControls
          className="aspect-4/5 max-h-[64svh] w-full rounded-[3px] lg:aspect-auto lg:h-[calc(100svh-13rem)] lg:max-h-[52rem] lg:min-h-[28rem]"
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Media sebelumnya"
              onClick={() => go(safeIndex - 1)}
              className="absolute top-1/2 left-3 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/20 bg-obsidian/65 text-ink backdrop-blur-xs transition-[border-color,background-color,opacity,transform] duration-300 hover:border-gold-bright hover:bg-obsidian/85 hover:text-gold-bright focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              aria-label="Media berikutnya"
              onClick={() => go(safeIndex + 1)}
              className="absolute top-1/2 right-3 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/20 bg-obsidian/65 text-ink backdrop-blur-xs transition-[border-color,background-color,opacity,transform] duration-300 hover:border-gold-bright hover:bg-obsidian/85 hover:text-gold-bright focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>

            <span
              aria-live="polite"
              className="pointer-events-none absolute right-3 bottom-3 z-20 rounded-full border border-ink/15 bg-obsidian/65 px-2.5 py-1 font-mono text-[10px] tracking-widest text-ink/90 backdrop-blur-xs"
            >
              {String(safeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div
          role="group"
          aria-label="Pilih foto atau video"
          className="mt-3 flex gap-2.5 overflow-x-auto pb-1"
        >
          {gallery.map((item, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                key={item.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${item.type === "video" ? "Putar video" : "Tampilkan foto"} ${index + 1} dari ${total}`}
                className={cn(
                  "relative aspect-square w-16 shrink-0 overflow-hidden rounded-[3px] border bg-charcoal transition-[border-color,opacity,box-shadow] duration-300 sm:w-20",
                  isActive
                    ? "border-gold-bright opacity-100 ring-1 ring-gold-bright/50"
                    : "border-line opacity-60 hover:border-ink/40 hover:opacity-100",
                )}
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={item.src}
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center bg-obsidian/35 text-ink"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full border border-ink/30 bg-obsidian/70 backdrop-blur-xs">
                        <Play className="size-3.5 translate-x-[1px] fill-current" />
                      </span>
                    </span>
                  </>
                ) : (
                  <Image
                    src={item.src}
                    alt={`${product.name} tampilan ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
