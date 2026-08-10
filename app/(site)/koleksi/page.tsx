import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import {
  CATEGORY_LABELS,
  VIBE_LABELS,
  type Category,
  type Product,
  type Vibe,
} from "@/lib/products";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getCatalog()).length;

  return {
    title: "Koleksi",
    description: `Seluruh ${count} varian parfum The Bold untuk pria dan wanita. Saring berdasarkan karakter aroma: fresh, woody, sweet, floral, atau dark.`,
    alternates: { canonical: "/koleksi" },
    openGraph: {
      title: `Koleksi · ${site.name}`,
      description: `Seluruh ${count} varian parfum The Bold, lengkap dengan kurva sillage tiap varian.`,
      url: "/koleksi",
    },
  };
}

type Search = { kategori?: string; vibe?: string };

const categories: { value: Category | "semua"; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "pria", label: CATEGORY_LABELS.pria },
  { value: "wanita", label: CATEGORY_LABELS.wanita },
];

const vibes = Object.keys(VIBE_LABELS) as Vibe[];

function buildHref(kategori: string | undefined, vibe: string | undefined) {
  const params = new URLSearchParams();
  if (kategori && kategori !== "semua") params.set("kategori", kategori);
  if (vibe) params.set("vibe", vibe);
  const query = params.toString();
  return query ? `/koleksi?${query}` : "/koleksi";
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const catalog = await getCatalog();

  return (
    <div className="shell pt-16 pb-8 md:pt-24">
      <header>
        <p className="font-mono text-label tracking-label text-gold uppercase">Koleksi</p>
        <h1 className="mt-5 max-w-2xl font-display text-display font-light text-balance">
          {catalog.length} varian, masing-masing dengan jejak waktunya sendiri
        </h1>
      </header>

      {/* Judul di atas sama untuk semua kunjungan, jadi ia ikut cangkang statis.
          Filter dan grid bergantung pada searchParams yang baru ada saat ada
          permintaan, jadi keduanya distream terpisah. */}
      <Suspense fallback={<FilterSkeleton />}>
        <FilteredResults searchParams={searchParams} catalog={catalog} />
      </Suspense>
    </div>
  );
}

/** Tinggi kerangka disamakan dengan bilah filter supaya isi di bawahnya tidak melompat. */
function FilterSkeleton() {
  return (
    <div className="mt-12 border-y border-line py-6" aria-hidden="true">
      <div className="h-9 w-64 animate-pulse bg-surface" />
      <div className="mt-6 h-9 w-80 animate-pulse bg-surface" />
    </div>
  );
}

async function FilteredResults({
  searchParams,
  catalog,
}: {
  searchParams: Promise<Search>;
  catalog: Product[];
}) {
  const { kategori, vibe } = await searchParams;

  const activeCategory = categories.some((c) => c.value === kategori)
    ? (kategori as Category)
    : undefined;
  const activeVibe = vibes.includes(vibe as Vibe) ? (vibe as Vibe) : undefined;

  const visible = catalog.filter((product) => {
    if (activeCategory && product.category !== activeCategory) return false;
    if (activeVibe && !product.vibes.includes(activeVibe)) return false;
    return true;
  });

  return (
    <>
      {/* Filter berupa tautan, bukan tombol state: URL-nya bisa dibagikan dan di-index. */}
      <div className="mt-12 flex flex-col gap-6 border-y border-line py-6">
        <nav aria-label="Saring kategori" className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-mono text-label tracking-label text-muted uppercase">
            Untuk
          </span>
          {categories.map((category) => {
            const isActive =
              category.value === "semua" ? !activeCategory : activeCategory === category.value;
            return (
              <Link
                key={category.value}
                href={buildHref(category.value, activeVibe)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors duration-300",
                  isActive
                    ? "border-gold-bright bg-gold-bright text-obsidian"
                    : "border-line text-muted hover:border-gold hover:text-ink",
                )}
              >
                {category.label}
              </Link>
            );
          })}
        </nav>

        <nav aria-label="Saring karakter aroma" className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-mono text-label tracking-label text-muted uppercase">
            Karakter
          </span>
          <Link
            href={buildHref(activeCategory, undefined)}
            aria-current={!activeVibe ? "true" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors duration-300",
              !activeVibe
                ? "border-gold bg-gold/10 text-gold"
                : "border-line text-muted hover:border-gold hover:text-ink",
            )}
          >
            Semua
          </Link>
          {vibes.map((item) => {
            const isActive = activeVibe === item;
            return (
              <Link
                key={item}
                href={buildHref(activeCategory, isActive ? undefined : item)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors duration-300",
                  isActive
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-muted hover:border-gold hover:text-ink",
                )}
              >
                {VIBE_LABELS[item]}
              </Link>
            );
          })}
        </nav>
      </div>

      <p aria-live="polite" className="mt-6 font-mono text-xs text-muted">
        {visible.length} varian
      </p>

      {visible.length > 0 ? (
        <Reveal
          as="ul"
          stagger={0.07}
          className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((product, index) => (
            <li key={product.slug}>
              <ProductCard product={product} priority={index < 4} />
            </li>
          ))}
        </Reveal>
      ) : (
        <div className="mt-16 border border-line bg-surface px-8 py-20 text-center">
          <p className="font-display text-title">Belum ada yang cocok</p>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted">
            Kombinasi filter ini belum punya varian. Coba lepas salah satu filternya.
          </p>
          <Link
            href="/koleksi"
            className="mt-8 inline-block text-sm text-gold underline-offset-4 hover:underline"
          >
            Tampilkan semua varian
          </Link>
        </div>
      )}
    </>
  );
}
