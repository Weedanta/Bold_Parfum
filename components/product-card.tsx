import Link from "next/link";

import { cn, formatIDR } from "@/lib/utils";
import { VIBE_LABELS, lowestPrice, type Product } from "@/lib/products";
import { BottleImage } from "@/components/bottle-image";
import { StockBadge } from "@/components/stock-badge";

type Props = {
  product: Product;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function ProductCard({
  product,
  className,
  priority,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}: Props) {
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <BottleImage
        product={product}
        sizes={sizes}
        priority={priority}
        showAtmosphereOnHover
        className="aspect-3/4 border border-line"
      />

      {/* pointer-events-none supaya lencana tidak menghalangi lapisan tautan
          yang menutupi seluruh kartu lewat after:inset-0 di bawah. */}
      <StockBadge stock={product.stock} className="pointer-events-none absolute top-3 left-3 z-10" />

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl leading-none">
            <Link href={`/koleksi/${product.slug}`} className="after:absolute after:inset-0">
              {product.name}
            </Link>
          </h3>
          <span className="font-mono text-xs text-gold">{formatIDR(lowestPrice(product))}</span>
        </div>

        <p className="mt-2 text-sm text-muted">{product.subtitle}</p>

        <p className="mt-4 font-mono text-[11px] tracking-wider text-muted uppercase">
          {product.family} &middot; {product.vibes.map((v) => VIBE_LABELS[v]).join(" / ")}
        </p>

        {/* Suasana aroma yang muncul bersama layer hover, teks dan visual bicara hal yang sama */}
        <p className="mt-2 text-xs text-muted/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
          {product.atmosphere.label}
        </p>
      </div>
    </article>
  );
}
