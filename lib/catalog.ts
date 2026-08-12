import { cacheLife, cacheTag } from "next/cache";

import {
  CATEGORIES,
  findInCatalog,
  toCatalogEntry,
  type CatalogEntry,
  type Product,
} from "@/lib/products";
import { rowToProduct, type ProductRow } from "@/lib/catalog-mapper";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sumber katalog situs: tabel `products` di Supabase.
 *
 * Semua pembacaan lewat `getCatalog()`. Katalognya hanya 13 baris, jadi mengambil
 * seluruhnya sekali lalu menyaring di memori lebih murah daripada satu query per
 * halaman, dan membuat detail varian, varian terkait, serta sitemap berbagi satu
 * entri cache yang sama.
 *
 * Cache dipegang `use cache` dengan tag tunggal. Saat panel admin masuk di Fase B,
 * `revalidateTag(CATALOG_TAG)` sesudah menyimpan sudah cukup membuat seluruh situs
 * menampilkan data baru.
 */

export const CATALOG_TAG = "catalog";

export { rowToProduct, type ProductRow };

/**
 * Kolom yang dibaca, plus tabel anak yang disemat.
 *
 * Semuanya ditarik dalam satu permintaan, bukan satu query per tabel: PostgREST
 * menerjemahkan bentuk bersarang ini menjadi join di sisi database, jadi biaya
 * normalisasi tidak berubah menjadi enam perjalanan bolak-balik jaringan.
 *
 * `created_at`/`updated_at` tidak dipakai tampilan, jadi tidak ikut diambil.
 */
const COLUMNS = `
  slug, code, name, subtitle, category, family, juice,
  atmosphere_label, atmosphere_from, atmosphere_to, story,
  longevity_min, longevity_max, sillage, photo_path, featured_for, stock_status,
  product_notes (position, name, layer, onset, peak, fade),
  product_sizes (ml, price),
  product_vibes (vibe),
  product_occasions (position, label),
  product_badges (position, label)
`;

export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    // RLS sudah menyaring baris yang belum terbit. Filter ini ditulis ulang di
    // sini supaya niatnya terbaca dari kode, bukan hanya dari migrasi.
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    throw new Error(`Gagal membaca katalog dari Supabase: ${error.message}`);
  }

  return (data as unknown as ProductRow[]).map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return findInCatalog(await getCatalog(), slug);
}

/** Daftar ringkas untuk komponen client, lihat CatalogProvider. */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  return (await getCatalog()).map(toCatalogEntry);
}

/**
 * Varian unggulan, satu per kategori, urut For Him lalu For Her.
 * Kosong kalau klien belum menandai satu pun di dashboard.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  const catalog = await getCatalog();
  return CATEGORIES.flatMap((category) => {
    const match = catalog.find((product) => product.featuredFor === category);
    return match ? [match] : [];
  });
}
