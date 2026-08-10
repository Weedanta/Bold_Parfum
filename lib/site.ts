/**
 * Konfigurasi situs.
 *
 * PLACEHOLDER: `whatsappNumber` dan `url` masih nilai sementara. Ganti keduanya
 * sebelum situs dipublikasikan. Lihat spec bagian 2.
 */
export const site = {
  name: "The Bold",
  tagline: "Define Your Presence",
  description:
    "Temukan parfum yang cocok dengan kepribadianmu lewat Scent Profiler. Katalog parfum premium The Bold dengan visualisasi aroma dari menit pertama sampai jam ke-12.",

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://theboldparfum.com",

  /** Format internasional tanpa tanda plus, dipakai wa.me */
  whatsappNumber: "6281234567890",

  social: {
    instagram: "https://instagram.com/theboldparfum",
    tiktok: "https://tiktok.com/@theboldparfum",
  },

  locale: "id_ID",
} as const;
