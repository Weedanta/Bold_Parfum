import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "@/lib/supabase/server";

/**
 * Menyegarkan token sesi Supabase sebelum rute admin dirender.
 *
 * Server Component tidak boleh menulis cookie, jadi tanpa lapisan ini sesi admin
 * akan mati begitu access token kedaluwarsa, meski refresh token-nya masih sah.
 *
 * Ini bukan lapisan otorisasi. Keputusan siapa boleh apa tetap di RLS database
 * dan di requireAdmin(); di sini hanya cookie yang diperbarui. Dokumentasi Next
 * pun menegaskan proxy tidak dimaksudkan sebagai solusi otorisasi.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
