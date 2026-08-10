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

/** Kolom yang dibaca. `created_at`/`updated_at` tidak dipakai tampilan. */
const COLUMNS = [
  "slug",
  "code",
  "name",
  "subtitle",
  "category",
  "family",
  "vibes",
  "juice",
  "atmosphere_label",
  "atmosphere_from",
  "atmosphere_to",
  "story",
  "longevity_min",
  "longevity_max",
  "sillage",
  "occasions",
  "badges",
  "notes",
  "sizes",
  "photo_path",
  "featured_for",
].join(", ");

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
