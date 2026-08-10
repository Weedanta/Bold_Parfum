import { cache } from "react";

import { createSupabaseSessionClient } from "@/lib/supabase/auth";
import type { Category } from "@/lib/products";

export type AdminVariant = {
  slug: string;
  code: string;
  name: string;
  category: Category;
  is_published: boolean;
  photo_path: string | null;
  featured_for: Category | null;
  sort_order: number;
};

/**
 * Daftar varian untuk panel admin.
 *
 * Dibaca lewat klien sesi, bukan getCatalog(), karena admin perlu melihat varian
 * yang disembunyikan juga, dan hasilnya tidak boleh ikut ter-cache bersama
 * katalog publik.
 *
 * Dibungkus cache() dari React supaya sidebar di layout dan daftar di halaman
 * beranda berbagi satu query dalam render yang sama, bukan dua. Cakupannya per
 * permintaan, jadi tidak ada data admin yang tersimpan lintas pengunjung.
 */
export const listVariants = cache(async (): Promise<AdminVariant[]> => {
  const supabase = await createSupabaseSessionClient();

  const { data, error } = await supabase
    .from("products")
    .select("slug, code, name, category, is_published, photo_path, featured_for, sort_order")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) throw new Error(`Gagal membaca katalog: ${error.message}`);
  return (data ?? []) as AdminVariant[];
});
