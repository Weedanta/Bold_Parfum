import Link from "next/link";

import type { Product } from "@/lib/products";

/**
 * Pita nama varian yang bergeser pelan.
 *
 * Homepage hanya menyorot dua varian, sedangkan koleksinya tiga belas. Pita ini
 * menampilkan semuanya sekaligus sebagai tautan, jadi keluasan koleksi terlihat
 * tanpa menambah satu section penuh. Berhenti saat disentuh kursor atau saat ada
 * tautan yang menerima fokus keyboard, dan diam sepenuhnya bila pengguna
 * meminta gerakan dikurangi.
 */
export function VariantMarquee({ products }: { products: Product[] }) {
  const track = [...products, ...products];

  return (
    <div className="marquee relative overflow-hidden border-y border-line py-7">
      <ul className="marquee-track flex w-max items-center gap-10 pr-10">
        {track.map((product, index) => (
          <li
            key={`${product.slug}-${index}`}
            className="flex items-center gap-10"
            aria-hidden={index >= products.length ? "true" : undefined}
          >
            <Link
              href={`/koleksi/${product.slug}`}
              tabIndex={index >= products.length ? -1 : undefined}
              className="group flex items-center gap-3 whitespace-nowrap"
            >
              <span
                className="size-1.5 rounded-full transition-transform duration-300 group-hover:scale-[2.2]"
                style={{ backgroundColor: product.juice }}
              />
              <span className="font-display text-2xl text-muted transition-colors duration-300 group-hover:text-ink">
                {product.name}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-muted/60 uppercase">
                {product.family}
              </span>
            </Link>
            <span aria-hidden="true" className="text-line">
              &middot;
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
