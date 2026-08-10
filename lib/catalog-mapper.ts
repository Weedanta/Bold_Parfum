/**
 * Pemetaan baris tabel `products` beserta tabel anaknya ke tipe Product.
 *
 * Dipisah dari lib/catalog.ts supaya bebas dari impor Next: pemetaan inilah
 * satu-satunya bagian jalur baca yang punya logika bercabang, dan memisahkannya
 * membuatnya bisa diuji langsung dengan `node --test` tanpa runtime Next.
 *
 * Sejak katalog dinormalisasi, bentuk note dan ukuran dijamin kolom dan CHECK
 * constraint di database. Yang tersisa di sini hanya dua hal yang memang tidak
 * bisa dijamin PostgREST: urutan baris anak, dan fakta bahwa nilai enum tiba
 * sebagai string biasa.
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

type NoteRow = {
  position: number;
  name: string;
  layer: string;
  onset: number;
  peak: number;
  fade: number;
};

type SizeRow = { ml: number; price: number };
type VibeRow = { vibe: string };
type LabelRow = { position: number; label: string };

export type ProductRow = {
  slug: string;
  code: string;
  name: string;
  subtitle: string;
  category: string;
  family: string;
  juice: string;
  atmosphere_label: string;
  atmosphere_from: string;
  atmosphere_to: string;
  story: string;
  longevity_min: number;
  longevity_max: number;
  sillage: string;
  photo_path: string | null;
  featured_for: string | null;
  product_notes: NoteRow[] | null;
  product_sizes: SizeRow[] | null;
  product_vibes: VibeRow[] | null;
  product_occasions: LabelRow[] | null;
  product_badges: LabelRow[] | null;
};

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

/** PostgREST tidak menjamin urutan baris tersemat, jadi diurutkan di sini. */
function byPosition<T extends { position: number }>(rows: T[] | null): T[] {
  return [...(rows ?? [])].sort((a, b) => a.position - b.position);
}

function toNotes(rows: NoteRow[] | null): Note[] {
  return byPosition(rows).flatMap((row): Note[] =>
    // Lapisan asing hanya mungkin muncul kalau enum di database diperluas tanpa
    // menyentuh kode ini. Note-nya dilewati, bukan menjatuhkan seluruh varian.
    oneOf(LAYERS, row.layer)
      ? [
          {
            name: row.name,
            layer: row.layer as Layer,
            onset: row.onset,
            peak: row.peak,
            fade: row.fade,
          },
        ]
      : [],
  );
}

function toSizes(rows: SizeRow[] | null, slug: string): { ml: Size; price: number }[] {
  const sizes = (rows ?? [])
    .filter((row): row is { ml: Size; price: number } => SIZES.includes(row.ml as Size))
    .sort((a, b) => a.ml - b.ml);

  // Varian tanpa ukuran tidak bisa dijual: harga, tombol beli, dan JSON-LD
  // semuanya bergantung padanya.
  if (sizes.length === 0) {
    throw new Error(`Varian "${slug}" tidak punya ukuran dan harga yang sah.`);
  }
  return sizes;
}

export function rowToProduct(row: ProductRow): Product {
  assertKnown(oneOf(CATEGORIES, row.category), row.slug, "category", row.category);
  assertKnown(oneOf(SILLAGES, row.sillage), row.slug, "sillage", row.sillage);

  return {
    slug: row.slug,
    name: row.name,
    code: row.code,
    subtitle: row.subtitle,
    category: row.category as Category,
    family: row.family,
    vibes: (row.product_vibes ?? [])
      .map((entry) => entry.vibe)
      .filter((vibe): vibe is Vibe => oneOf(VIBES, vibe)),
    juice: row.juice,
    atmosphere: {
      label: row.atmosphere_label,
      from: row.atmosphere_from,
      to: row.atmosphere_to,
    },
    story: row.story,
    longevity: [row.longevity_min, row.longevity_max],
    sillage: row.sillage as Sillage,
    occasions: byPosition(row.product_occasions).map((entry) => entry.label),
    notes: toNotes(row.product_notes),
    sizes: toSizes(row.product_sizes, row.slug),
    badges: byPosition(row.product_badges).map((entry) => entry.label),
    photoUrl: row.photo_path ? publicPhotoUrl(row.photo_path) : null,
    featuredFor: oneOf(CATEGORIES, row.featured_for) ? (row.featured_for as Category) : null,
  };
}
