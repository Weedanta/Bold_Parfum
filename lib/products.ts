/**
 * Bentuk data katalog The Bold.
 *
 * Modul ini hanya berisi tipe, label, dan fungsi murni. Datanya sendiri datang
 * dari Supabase lewat lib/catalog.ts. Pemisahan ini disengaja: komponen client
 * boleh mengimpor tipe dan label dari sini tanpa ikut menarik klien database
 * ke dalam bundle browser.
 *
 * Data awal 13 varian ada di lib/seed/products.seed.ts, dipakai untuk seeding
 * dan sebagai fixture uji.
 *
 * Waktu pada note dihitung dalam menit sejak disemprot. Tiga angka itu yang
 * menggerakkan Kurva Sillage: onset (mulai terasa), peak (puncak), fade (habis).
 */

export type Layer = "top" | "heart" | "base";
export type Vibe = "fresh" | "woody" | "sweet" | "floral" | "dark";
export type Category = "pria" | "wanita";
export type Sillage = "Lembut" | "Sedang" | "Kuat";
export type Size = 30 | 50;

/**
 * Ketersediaan varian, terpisah dari keputusan tayang.
 *
 * `is_published` di database menjawab "varian ini muncul di situs atau tidak".
 * `stock` menjawab "varian yang muncul itu bisa dibeli sekarang atau tidak".
 * Parfum yang habis tetap layak dipajang, justru supaya orang menunggunya, jadi
 * kedua pertanyaan itu tidak bisa diwakili satu sakelar.
 */
export type Stock = "tersedia" | "kosong" | "preorder";

export type Note = {
  name: string;
  layer: Layer;
  onset: number;
  peak: number;
  fade: number;
};

export type Product = {
  slug: string;
  name: string;
  code: string;
  subtitle: string;
  category: Category;
  family: string;
  vibes: Vibe[];
  /** Warna cairan, satu-satunya warna varian, dipakai di kurva, hover, hasil kuis */
  juice: string;
  atmosphere: { label: string; from: string; to: string };
  /** Kutipan dari website 20plan.md Bagian 3 */
  story: string;
  longevity: [number, number];
  sillage: Sillage;
  occasions: string[];
  notes: Note[];
  sizes: { ml: Size; price: number }[];
  badges: string[];
  /**
   * URL publik foto botol di Supabase Storage, atau null kalau fotonya belum
   * diunggah. Saat null, BottleImage menggambar siluet botol, bukan meminta
   * gambar yang tidak ada.
   */
  photoUrl: string | null;
  /** Ketersediaan varian. Lihat tipe Stock di atas. */
  stock: Stock;
  /**
   * Kategori tempat varian ini tampil di Featured Scent of the Month, atau null
   * kalau tidak diunggulkan. Menggantikan konstanta `featured` yang dulu
   * di-hardcode, jadi klien bisa menggantinya lewat dashboard.
   */
  featuredFor: Category | null;
};

/**
 * Potongan produk yang dikirim ke komponen client lewat CatalogProvider.
 *
 * Sengaja tidak memuat `notes`, `story`, `occasions`, `longevity`, dan `badges`:
 * semuanya hanya dirender komponen server yang sudah menerima Product utuh
 * sebagai prop. Yang tersisa hanya yang benar-benar dibutuhkan kuis dan
 * keranjang, jadi payload yang diserialisasi ke tiap halaman tetap kecil.
 */
export type CatalogEntry = Pick<
  Product,
  | "slug"
  | "name"
  | "code"
  | "subtitle"
  | "category"
  | "family"
  | "vibes"
  | "juice"
  | "atmosphere"
  | "sizes"
  // Ikut dikirim karena keranjang hidup di sisi client dan harus tahu mana baris
  // yang tidak bisa dipesan, tanpa memanggil server lagi.
  | "stock"
>;

export function toCatalogEntry(product: Product): CatalogEntry {
  return {
    slug: product.slug,
    name: product.name,
    code: product.code,
    subtitle: product.subtitle,
    category: product.category,
    family: product.family,
    vibes: product.vibes,
    juice: product.juice,
    atmosphere: product.atmosphere,
    sizes: product.sizes,
    stock: product.stock,
  };
}

export const VIBE_LABELS: Record<Vibe, string> = {
  fresh: "Fresh",
  woody: "Woody",
  sweet: "Sweet",
  floral: "Floral",
  dark: "Dark / Nightlife",
};

export const STOCK_LABELS: Record<Stock, string> = {
  tersedia: "Tersedia",
  kosong: "Stok Kosong",
  preorder: "Preorder",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  pria: "For Him",
  wanita: "For Her",
};

export const LAYER_LABELS: Record<Layer, string> = {
  top: "Top",
  heart: "Heart",
  base: "Base",
};

/** Penjelasan tiap lapisan, kalimatnya dari PRD 5.5 */
export const LAYER_CAPTIONS: Record<Layer, string> = {
  top: "Aroma awal, 15 menit pertama",
  heart: "Inti aroma, muncul setelah 30 menit",
  base: "Aroma dasar, bertahan setelah 2 jam",
};

/** Nilai yang sah untuk tiap enum, dipakai validator saat memetakan baris DB. */
export const LAYERS: Layer[] = ["top", "heart", "base"];
export const VIBES: Vibe[] = ["fresh", "woody", "sweet", "floral", "dark"];
export const CATEGORIES: Category[] = ["pria", "wanita"];
export const SILLAGES: Sillage[] = ["Lembut", "Sedang", "Kuat"];
export const SIZES: Size[] = [30, 50];
export const STOCKS: Stock[] = ["tersedia", "kosong", "preorder"];

/**
 * Kosong satu-satunya status yang menutup jalur beli.
 *
 * Preorder justru sebaliknya: pesanannya diterima, pengirimannya yang menyusul,
 * jadi tombolnya tetap hidup dan hanya kata-katanya yang berubah.
 */
export function bisaDibeli(stock: Stock) {
  return stock !== "kosong";
}

/** Pencarian di dalam daftar yang sudah ada di memori, untuk sisi client. */
export function findInCatalog<T extends { slug: string }>(
  catalog: readonly T[],
  slug: string,
): T | undefined {
  return catalog.find((item) => item.slug === slug);
}

export function lowestPrice(product: Pick<Product, "sizes">) {
  return Math.min(...product.sizes.map((s) => s.price));
}
