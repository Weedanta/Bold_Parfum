"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn, formatIDR } from "@/lib/utils";
import { CATEGORY_LABELS, VIBE_LABELS, lowestPrice, type Product } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { BottleImage } from "@/components/bottle-image";
import { ScrollScale } from "@/components/motion/scroll-scale";
import { gsap, useGsapScope } from "@/components/motion/use-gsap";

/**
 * Featured Scent of the Month (PRD 5.1).
 *
 * Sengaja tidak memakai ProductCard: bagian ini menyorot dua varian saja, jadi
 * bentuknya dibuat seperti satu bentangan majalah, gambar besar di satu sisi
 * dan cerita di sisi lain. Grid katalog yang dipindah ke depan akan terbaca
 * sebagai potongan katalog, bukan pilihan kurator.
 *
 * `flip` menukar sisi gambar, supaya dua bentangan yang bertumpuk tidak terbaca
 * sebagai cetakan yang sama.
 */
export function FeaturedCard({ product, flip = false }: { product: Product; flip?: boolean }) {
  return (
    <article className="group grid h-full gap-8 border border-line bg-surface p-4 sm:p-6 lg:grid-cols-12 lg:gap-12 lg:p-8">
      {/* ScrollScale membuka bingkai gambar mengikuti scroll. BottleImage harus
          mengisi penuh pembungkusnya karena skala dikenakan pada anak pertama. */}
      <ScrollScale
        dimOnExit={false}
        className={cn(
          "aspect-4/5 border border-line sm:aspect-4/3 lg:col-span-7 lg:aspect-auto lg:h-full",
          flip && "lg:order-last",
        )}
      >
        <BottleImage
          product={product}
          sizes="(min-width: 1024px) 55vw, 100vw"
          showAtmosphereOnHover
          parallax={34}
          className="h-full w-full"
        />
      </ScrollScale>

      <div
        className={cn(
          "flex min-w-0 flex-col lg:col-span-5 lg:py-4",
          flip ? "lg:pl-4" : "lg:pr-4",
        )}
      >
        <h3 className="font-display text-display font-light">{product.name}</h3>
        <p className="mt-3 text-base text-muted">{product.subtitle}</p>

        <ul className="mt-6 flex flex-wrap gap-1.5">
          {product.stock === "tersedia" ? null : (
            <li>
              <StockBadge stock={product.stock} />
            </li>
          )}
          <li>
            <Badge variant="gold">{product.family}</Badge>
          </li>
          <li>
            <Badge>{CATEGORY_LABELS[product.category]}</Badge>
          </li>
          {product.vibes.map((vibe) => (
            <li key={vibe}>
              <Badge>{VIBE_LABELS[vibe]}</Badge>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-md text-base leading-relaxed text-muted lg:mt-auto">
          {product.story}
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-line pt-6">
          <p className="text-caption text-muted">
            Mulai dari
            <span className="mt-1 block font-mono text-lg text-ink">
              {formatIDR(lowestPrice(product))}
            </span>
          </p>
          <Button asChild variant="outline">
            <Link href={`/koleksi/${product.slug}`}>
              Lihat detail <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

/**
 * Tumpukan bentangan unggulan.
 *
 * Di layar lebar tiap bentangan menempel di bawah header (CSS sticky), lalu
 * bentangan berikutnya naik menutupinya seperti halaman majalah yang dibalik.
 * GSAP hanya menambahkan satu hal di atas itu: bentangan yang sedang tertutup
 * sedikit mengecil dan meredup, jadi terbaca mundur ke belakang, bukan sekadar
 * tertimpa. Tumpukan itu sendiri murni CSS, jadi tanpa JavaScript atau dengan
 * gerak dikurangi urutan bacanya tetap sama.
 *
 * Di ponsel bentangan lebih tinggi dari layar, dan sticky pada elemen setinggi
 * itu justru menyembunyikan isinya. Karena itu tumpukan hanya aktif mulai lg.
 */
export function FeaturedStack({ products }: { products: Product[] }) {

  const ref = useGsapScope<HTMLDivElement>(
    ({ root, reduced }) => {
      if (reduced) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const slots = root.querySelectorAll<HTMLElement>("[data-stack-slot]");
        slots.forEach((slot, index) => {
          const next = slots[index + 1];
          const card = slot.firstElementChild as HTMLElement | null;
          if (!next || !card) return;

          gsap.to(card, {
            scale: 0.92,
            opacity: 0.35,
            transformOrigin: "50% 0%",
            ease: "none",
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: "top 6rem",
              scrub: true,
            },
          });
        });
      });

      return () => mm.revert();
    },
    [products.length],
  );

  return (
    <div ref={ref} className="flex flex-col gap-6 lg:gap-[12svh]">
      {products.map((product, index) => (
        <div
          key={product.slug}
          data-stack-slot
          className="lg:sticky lg:top-24 lg:h-[calc(100svh-7.5rem)] lg:min-h-[32rem]"
        >
          <FeaturedCard product={product} flip={index % 2 === 1} />
        </div>
      ))}
    </div>
  );
}
