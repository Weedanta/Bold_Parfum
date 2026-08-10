import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk sisi server.
 *
 * Memakai publishable key, bukan service role. Situs hanya membaca, dan RLS di
 * migrasi 0001 sudah membatasi baris yang boleh terbaca ke varian yang terbit.
 * Menaruh service role di sini akan melewati RLS tanpa alasan.
 *
 * `persistSession: false`, karena tidak ada sesi pengguna yang perlu disimpan:
 * setiap render server berdiri sendiri.
 */

export const PHOTO_BUCKET = "product-photos";

function requireEnv(name: string, fallbackName?: string) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (value) return value;

  const names = fallbackName ? `${name} atau ${fallbackName}` : name;
  throw new Error(
    `Environment variable ${names} belum diisi. Salin .env.example ke .env.local lalu isi dari Supabase, Project Settings > API.`,
  );
}

export function createSupabaseServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * URL publik sebuah objek di bucket foto.
 *
 * Dirakit dari string, bukan lewat `storage.getPublicUrl()`, supaya fungsi ini
 * tetap murni dan bisa diuji tanpa membuat klien. Bentuk URL-nya ditetapkan
 * Supabase dan tidak berubah untuk bucket publik.
 */
export function publicPhotoUrl(path: string) {
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
