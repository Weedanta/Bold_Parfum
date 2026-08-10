/**
 * Pemetaan baris tabel `products` ke tipe Product.
 *
 * Dipisah dari lib/catalog.ts supaya bebas dari impor Next: pemetaan inilah
 * satu-satunya bagian jalur baca yang punya logika bercabang, dan memisahkannya
 * membuatnya bisa diuji langsung dengan `node --test` tanpa runtime Next.
 */

import {
  CATEGORIES,
  LAYERS,
  SILLAGES,
  SIZES,
  VIBES,
  type Category,
  type Layer,
  type Note,
  type Product,
  type Sillage,
  type Size,
  type Vibe,
} from "@/lib/products";
import { publicPhotoUrl } from "@/lib/supabase/server";

export type ProductRow = {
  slug: string;
  code: string;
  name: string;
  subtitle: string;
  category: string;
  family: string;
  vibes: string[] | null;
  juice: string;
  atmosphere_label: string;
  atmosphere_from: string;
  atmosphere_to: string;
  story: string;
  longevity_min: number;
  longevity_max: number;
  sillage: string;
  occasions: string[] | null;
  badges: string[] | null;
  notes: unknown;
  sizes: unknown;
  photo_path: string | null;
  featured_for: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function oneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function assertKnown(
  condition: boolean,
  slug: string,
  field: string,
  value: unknown,
): asserts condition {
  if (!condition) {
    throw new Error(
      `Baris katalog "${slug}" punya nilai ${field} yang tidak dikenal: ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Note yang bentuknya rusak dibuang, bukan membatalkan seluruh varian: satu note
 * hilang hanya membuat kurva sillage kehilangan satu garis, sedangkan melempar
 * error akan menjatuhkan seluruh halaman produk.
 */
function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): Note[] => {
    if (!isRecord(entry)) return [];
    const { name, layer, onset, peak, fade } = entry;
    if (typeof name !== "string" || name.length === 0) return [];
    if (!oneOf(LAYERS, layer)) return [];
    if (!isFiniteNumber(onset) || !isFiniteNumber(peak) || !isFiniteNumber(fade)) return [];
    return [{ name, layer: layer as Layer, onset, peak, fade }];
  });
}

/**
 * Beda dengan note, varian tanpa ukuran yang sah tidak bisa dijual: harga, tombol
 * beli, dan JSON-LD semuanya bergantung padanya. Kasus itu dilempar dengan
 * menyebut slug-nya supaya ketahuan baris mana yang perlu diperbaiki.
 */
function parseSizes(raw: unknown, slug: string): { ml: Size; price: number }[] {
  const parsed = Array.isArray(raw)
    ? raw.flatMap((entry): { ml: Size; price: number }[] => {
        if (!isRecord(entry)) return [];
        const { ml, price } = entry;
        if (!isFiniteNumber(ml) || !SIZES.includes(ml as Size)) return [];
        if (!isFiniteNumber(price) || price <= 0) return [];
        return [{ ml: ml as Size, price }];
      })
    : [];

  if (parsed.length === 0) {
    throw new Error(`Varian "${slug}" tidak punya ukuran dan harga yang sah.`);
  }
  return parsed;
}

export function rowToProduct(row: ProductRow): Product {
  assertKnown(oneOf(CATEGORIES, row.category), row.slug, "category", row.category);
  assertKnown(oneOf(SILLAGES, row.sillage), row.slug, "sillage", row.sillage);

  const vibes = (row.vibes ?? []).filter((vibe): vibe is Vibe => oneOf(VIBES, vibe));

  return {
    slug: row.slug,
    name: row.name,
    code: row.code,
    subtitle: row.subtitle,
    category: row.category as Category,
    family: row.family,
    vibes,
    juice: row.juice,
    atmosphere: {
      label: row.atmosphere_label,
      from: row.atmosphere_from,
      to: row.atmosphere_to,
    },
    story: row.story,
    longevity: [row.longevity_min, row.longevity_max],
    sillage: row.sillage as Sillage,
    occasions: row.occasions ?? [],
    notes: parseNotes(row.notes),
    sizes: parseSizes(row.sizes, row.slug),
    badges: row.badges ?? [],
    photoUrl: row.photo_path ? publicPhotoUrl(row.photo_path) : null,
    featuredFor: oneOf(CATEGORIES, row.featured_for) ? (row.featured_for as Category) : null,
  };
}
