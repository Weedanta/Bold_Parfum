import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatIDR } from "@/lib/utils";
import { CATEGORY_LABELS, VIBE_LABELS, lowestPrice, type Product } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { BottleImage } from "@/components/bottle-image";

/**
 * Featured Scent of the Month (PRD 5.1).
 *
 * Sengaja mendatar dan tidak memakai ProductCard: bagian ini menyorot dua varian
 * saja, jadi bentuknya harus berbeda dari grid katalog supaya terbaca sebagai
 * pilihan kurator, bukan potongan katalog yang dipindah ke depan.
 */
export function FeaturedCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col gap-6 border border-line bg-surface p-5 transition-colors duration-500 hover:border-gold/40 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8 sm:p-7">
      <BottleImage
        product={product}
        sizes="(min-width: 1024px) 10rem, (min-width: 640px) 10rem, 100vw"
        showAtmosphereOnHover
        parallax={34}
        className="aspect-4/3 w-full border border-line sm:aspect-3/4 sm:w-auto"
      />

      <div className="flex min-w-0 flex-col">
        <p className="font-mono text-label tracking-label text-muted uppercase">
          {CATEGORY_LABELS[product.category]}
        </p>

        <h3 className="mt-3 font-display text-3xl leading-none">{product.name}</h3>
        <p className="mt-2 text-sm text-muted">{product.subtitle}</p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {product.stock === "tersedia" ? null : (
            <li>
              <StockBadge stock={product.stock} />
            </li>
          )}
          <li>
            <Badge variant="gold">{product.family}</Badge>
          </li>
          {product.vibes.map((vibe) => (
            <li key={vibe}>
              <Badge>{VIBE_LABELS[vibe]}</Badge>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-sm leading-relaxed text-muted">{product.story}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-7">
          <span className="font-mono text-sm text-gold">
            mulai {formatIDR(lowestPrice(product))}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/koleksi/${product.slug}`}>
              Lihat detail <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
