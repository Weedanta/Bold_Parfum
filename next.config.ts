import type { NextConfig } from "next";

/**
 * Host Supabase diambil dari env supaya konfigurasi ini tidak mengunci satu
 * proyek. Kalau env belum diisi, remotePatterns dibiarkan kosong: build tetap
 * jalan, hanya foto dari Storage yang belum bisa dioptimalkan.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Mengaktifkan `use cache`, yang dipakai getCatalog() di lib/catalog.ts.
  // Tanpa ini katalog akan diquery ulang pada setiap render halaman.
  cacheComponents: true,

  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/product-photos/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
