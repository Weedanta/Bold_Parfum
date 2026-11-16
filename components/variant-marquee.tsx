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
 *
 * Nama dicetak besar dan tipis, seperti daftar isi di sampul belakang majalah.
 * Pemisah antarnama hanya titik warna cairan varian itu sendiri, bukan tanda
 * baca: warnanya sudah cukup memberi jeda, dan sekaligus menjadi satu-satunya
 * petunjuk visual tentang isinya.
 */
export function VariantMarquee({ products }: { products: Product[] }) {
  const track = [...products, ...products];

  return (
    <div className="marquee relative overflow-hidden border-y border-line py-8 md:py-12">
      <ul className="marquee-track flex w-max items-center gap-14 pr-14 md:gap-20 md:pr-20">
        {track.map((product, index) => (
          <li
            key={`${product.slug}-${index}`}
            aria-hidden={index >= products.length ? "true" : undefined}
          >
            <Link
              href={`/koleksi/${product.slug}`}
              tabIndex={index >= products.length ? -1 : undefined}
              className="group flex items-center gap-4 whitespace-nowrap md:gap-5"
            >
              <span
                className="size-2 rounded-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[2.2]"
                style={{ backgroundColor: product.juice }}
              />
              <span className="font-display text-4xl font-light text-muted transition-colors duration-500 group-hover:text-ink md:text-6xl">
                {product.name}
              </span>
              <span className="self-end pb-1 text-caption text-faint italic md:pb-2">
                {product.family}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
