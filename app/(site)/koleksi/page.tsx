import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

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
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getCatalog()).length;

  return {
    title: "Koleksi",
    description: `Seluruh ${count} varian parfum The Bold untuk pria dan wanita. Saring berdasarkan karakter aroma: fresh, woody, sweet, floral, atau dark.`,
    alternates: { canonical: "/koleksi" },
    openGraph: {
      title: `Koleksi | ${site.name}`,
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
    <div className="shell pt-12 pb-10 md:pt-20">
      <header className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <HeadingReveal
          as="h1"
          className="font-display text-statement font-light text-balance lg:col-span-9"
        >
          {catalog.length} varian, masing-masing dengan <em className="italic">jam</em> sendiri
          di kulit
        </HeadingReveal>
        <p className="max-w-xs text-sm leading-relaxed text-muted lg:col-span-3 lg:justify-self-end lg:pb-3">
          Buka satu varian untuk melihat kapan tiap note-nya muncul, dan kapan ia pamit.
        </p>
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

/** Tinggi kerangka disamakan dengan dua baris kalimat filter supaya grid di bawahnya tidak melompat. */
function FilterSkeleton() {
  return (
    <div className="hairline mt-14 pt-8 md:mt-20" aria-hidden="true">
      <div className="h-11 w-72 max-w-full animate-pulse rounded-sm bg-surface" />
      <div className="mt-1 h-11 w-[28rem] max-w-full animate-pulse rounded-sm bg-surface" />
      <div className="mt-6 h-4 w-40 animate-pulse rounded-sm bg-surface" />
    </div>
  );
}

/**
 * Satu pilihan di dalam kalimat filter. Garis bawahnya menempel pada teks,
 * bukan pada kotak tautan, karena kotaknya sengaja dibuat setinggi 44px
 * supaya mudah diketuk.
 */
function FilterOption({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center transition-colors duration-500",
        active ? "text-ink" : "text-faint hover:text-ink",
      )}
    >
      <span className={cn("link-sweep", active && "[background-size:100%_1px]!")}>{children}</span>
    </Link>
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
      {/* Filter berupa tautan, bukan tombol state: URL-nya bisa dibagikan dan di-index.
          Kedua kelompok dibaca sebagai satu kalimat ("aroma untuk For Her,
          berkarakter woody"), jadi tidak perlu papan nama di depan tiap kelompok. */}
      <div className="hairline mt-14 flex flex-col pt-8 font-display text-title font-light md:mt-20">
        <nav aria-label="Saring kategori" className="flex flex-wrap items-center gap-x-5 md:gap-x-7">
          <span className="text-muted italic">Aroma untuk</span>
          {categories.map((category) => {
            const isActive =
              category.value === "semua" ? !activeCategory : activeCategory === category.value;
            return (
              <FilterOption
                key={category.value}
                href={buildHref(category.value, activeVibe)}
                active={isActive}
              >
                {category.label}
              </FilterOption>
            );
          })}
        </nav>

        <nav
          aria-label="Saring karakter aroma"
          className="flex flex-wrap items-center gap-x-5 md:gap-x-7"
        >
          <span className="text-muted italic">berkarakter</span>
          <FilterOption href={buildHref(activeCategory, undefined)} active={!activeVibe}>
            Apa saja
          </FilterOption>
          {vibes.map((item) => {
            const isActive = activeVibe === item;
            return (
              <FilterOption
                key={item}
                href={buildHref(activeCategory, isActive ? undefined : item)}
                active={isActive}
              >
                {VIBE_LABELS[item]}
              </FilterOption>
            );
          })}
        </nav>
      </div>

      <p aria-live="polite" className="mt-5 text-caption text-muted">
        {visible.length === catalog.length
          ? `Menampilkan semua ${catalog.length} varian.`
          : `Menampilkan ${visible.length} dari ${catalog.length} varian.`}
      </p>

      {visible.length > 0 ? (
        /* Kolom tengah diturunkan, bukan diberi kartu yang lebih besar: ritmenya
           berubah tanpa membuat lubang di grid berapa pun hasil filternya.
           Pergeseran memakai properti `translate`, jadi tidak bertabrakan dengan
           transform milik Reveal dan tidak menggeser tata letak tetangganya.
           Bantalan bawah menampung kolom yang turun di baris terakhir. */
        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-16 pb-16 sm:grid-cols-2 sm:pb-24 md:mt-16 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-24 lg:pb-36">
          {visible.map((product, index) => (
            <Reveal as="li" key={product.slug} delay={(index % 3) * 0.09}>
              <ProductCard
                product={product}
                priority={index < 3}
                className={cn(
                  index % 2 === 1 && "sm:max-lg:translate-y-16",
                  index % 3 === 1 && "lg:translate-y-28",
                )}
              />
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="mt-16 grid gap-6 pb-24 md:mt-24 md:grid-cols-12 md:pb-36">
          <p className="font-display text-display font-light md:col-span-7">
            Belum ada varian dengan kombinasi <em className="italic">ini</em>.
          </p>
          <div className="md:col-span-4 md:col-start-9 md:self-end">
            <p className="text-sm leading-relaxed text-muted">
              Coba lepas salah satu filternya, atau mulai lagi dari seluruh koleksi.
            </p>
            <Button asChild variant="link" className="mt-6">
              <Link href="/koleksi">Tampilkan semua varian</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
