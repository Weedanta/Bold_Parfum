import Link from "next/link";

import { cn, formatIDR } from "@/lib/utils";
import { VIBE_LABELS, lowestPrice, type Product } from "@/lib/products";
import { BottleImage } from "@/components/bottle-image";
import { StockBadge } from "@/components/stock-badge";

/** "fresh, woody, dan dark": daftar dibaca sebagai kalimat, bukan deret tag. */
const vibeList = new Intl.ListFormat("id", { style: "long", type: "conjunction" });

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
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw",
}: Props) {
  const vibes = vibeList.format(product.vibes.map((v) => VIBE_LABELS[v].toLowerCase()));

  return (
    <article className={cn("group @container relative flex flex-col", className)}>
      <div className="relative">
        <BottleImage
          product={product}
          sizes={sizes}
          priority={priority}
          showAtmosphereOnHover
          className="aspect-3/4 rounded-[3px] ring-1 ring-line transition-shadow duration-700 ease-[var(--ease-out-soft)] ring-inset group-hover:ring-ink/20"
        />

        {/* Suasana aroma ikut muncul bersama layer hover: teks dan visual
            membicarakan hal yang sama, di tempat yang sama. */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-3 max-w-[70%] translate-y-2 text-right font-display text-sm font-light text-ink/85 italic opacity-0 transition-[opacity,translate] duration-700 ease-[var(--ease-out-soft)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {product.atmosphere.label}
        </p>
      </div>

      {/* pointer-events-none supaya lencana tidak menghalangi lapisan tautan
          yang menutupi seluruh kartu lewat after:inset-0 di bawah. */}
      <StockBadge stock={product.stock} className="pointer-events-none absolute top-3 left-3 z-10" />

      <div className="mt-5 flex flex-col gap-2 @[17rem]:mt-6 @[17rem]:flex-row @[17rem]:items-start @[17rem]:justify-between @[17rem]:gap-5">
        <div className="min-w-0">
          <h3 className="font-display text-[1.4rem] leading-[1.05] @[17rem]:text-[1.75rem] font-light tracking-[-0.02em]">
            <Link
              href={`/koleksi/${product.slug}`}
              className="link-sweep after:absolute after:inset-0"
            >
              {product.name}
            </Link>
          </h3>
          <p className="mt-2 text-sm text-muted">{product.subtitle}</p>
        </div>

        <p className="shrink-0 font-mono @[17rem]:pt-2 text-xs text-ink/80">
          <span className="sr-only">Mulai </span>
          {formatIDR(lowestPrice(product))}
        </p>
      </div>

      <p className="mt-4 text-caption text-faint">
        {product.family}, {vibes}
      </p>
    </article>
  );
}
