import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/supabase/server";

/**
 * Klien Supabase yang membawa sesi pengguna dari cookie.
 *
 * Berbeda dari createSupabaseServerClient() yang anonim dan dipakai jalur baca
 * publik, klien ini bertindak atas nama admin yang sedang login. Karena tetap
 * memakai kunci publishable, setiap tulisan tetap melewati RLS: kalau sesinya
 * bukan admin, database yang menolak, bukan kode di sini.
 *
 * Itulah alasan service role key tidak dipakai di mana pun. Kunci itu melewati
 * RLS sepenuhnya, jadi satu bug otorisasi akan membuka seluruh database.
 */
export async function createSupabaseSessionClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Penyegaran token sudah
          // ditangani proxy.ts, jadi kasus ini aman diabaikan.
        }
      },
    },
  });
}

export type AdminSession = {
  userId: string;
  email: string;
};

/**
 * Mengembalikan admin yang sedang login, atau undefined.
 *
 * Memakai getUser(), bukan getSession(), karena getUser() memverifikasi token ke
 * server Supabase. Isi cookie sesi bisa dipalsukan; hasil getUser() tidak.
 */
export async function getAdminSession(): Promise<AdminSession | undefined> {
  const supabase = await createSupabaseSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;

  // Pengecekan kedua, ke tabel admin_users. Punya akun saja tidak cukup.
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return undefined;
  return { userId: data.user_id, email: data.email };
}

/** Dipakai di awal tiap halaman admin. Melempar pengunjung non-admin ke halaman masuk. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/masuk");
  return session;
}
