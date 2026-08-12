/**
 * Data awal katalog The Bold, 13 varian.
 *
 * Ini BUKAN sumber data situs. Situs membaca katalog dari Supabase
 * (lihat lib/catalog.ts). File ini punya dua tugas saja:
 *
 *  1. Sumber untuk `npm run seed:sql`, yang menuliskannya jadi supabase/seed.sql.
 *  2. Fixture untuk lib/quiz.test.ts, supaya uji skoring tetap jalan tanpa jaringan.
 *
 * Setelah data dipindah ke Supabase, dashboard yang jadi tempat mengedit.
 * Perubahan di file ini tidak akan tampil di situs sampai di-seed ulang.
 *
 * Sumber copy `story`: website 20plan.md Bagian 3 (dikutip apa adanya).
 *
 * PERHATIAN, data yang masih perlu dikonfirmasi klien:
 *  1. `notes`  : PRD hanya menyebut keluarga aroma ("Fresh Spicy", "Woody/Niche"),
 *                bukan komposisi note sebenarnya. Note di bawah adalah usulan yang
 *                masuk akal untuk tiap keluarga, BUKAN formula asli. Wajib diganti
 *                dengan komposisi dari perfumer sebelum publikasi. Menayangkan
 *                komposisi karangan sebagai fakta akan menyesatkan pembeli.
 *  2. `sizes`  : harga masih placeholder seragam.
 *  3. `longevity` / `sillage` : angka Crown diambil dari PRD 5.5, sisanya usulan.
 *
 * Waktu pada note dihitung dalam menit sejak disemprot. Tiga angka itu yang
 * menggerakkan Kurva Sillage: onset (mulai terasa), peak (puncak), fade (habis).
 */

import type { Category, Product, Size } from "@/lib/products";

/**
 * Tanpa `photoUrl` karena URL foto lahir dari Supabase Storage, tanpa
 * `featuredFor` karena varian unggulan dicatat terpisah di SEED_FEATURED, dan
 * tanpa `stock` karena semua varian bawaan lahir tersedia — itu sudah jadi
 * nilai bawaan kolomnya di database.
 */
export type SeedProduct = Omit<Product, "photoUrl" | "featuredFor" | "stock">;

const PRICES: { ml: Size; price: number }[] = [
  { ml: 30, price: 149000 },
  { ml: 50, price: 219000 },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "crown",
    name: "Crown",
    code: "TB-01",
    subtitle: "Charisma in a Bottle",
    category: "pria",
    family: "Fresh Spicy",
    vibes: ["fresh", "woody"],
    juice: "#c98a3c",
    atmosphere: { label: "cahaya lampu gantung di ruang rapat petang", from: "#c98a3c", to: "#3a2410" },
    story:
      "Karaktermu yang kuat dan dominan membutuhkan aroma yang dihormati. Crown adalah simbol karisma yang tak terbantahkan.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Kantor", "Acara formal petang"],
    notes: [
      { name: "Bergamot Calabria", layer: "top", onset: 0, peak: 10, fade: 45 },
      { name: "Lada Merah Muda", layer: "top", onset: 0, peak: 12, fade: 40 },
      { name: "Grapefruit", layer: "top", onset: 0, peak: 8, fade: 35 },
      { name: "Lavender", layer: "heart", onset: 20, peak: 80, fade: 220 },
      { name: "Kayu Manis", layer: "heart", onset: 25, peak: 90, fade: 240 },
      { name: "Pala", layer: "heart", onset: 30, peak: 95, fade: 230 },
      { name: "Cedarwood", layer: "base", onset: 90, peak: 240, fade: 720 },
      { name: "Ambergris", layer: "base", onset: 100, peak: 260, fade: 720 },
      { name: "Vetiver", layer: "base", onset: 95, peak: 250, fade: 660 },
    ],
    sizes: PRICES,
    badges: ["Best Seller", "Signature"],
  },
  {
    slug: "ether",
    name: "Ether",
    code: "TB-02",
    subtitle: "Kemewahan yang Tenang",
    category: "pria",
    family: "Woody Niche",
    vibes: ["woody"],
    juice: "#7c8b7a",
    atmosphere: { label: "asap dupa di ruang berlantai kayu", from: "#7c8b7a", to: "#1c2320" },
    story:
      "Aura eksklusivitas mengelilingimu. Ether adalah harmoni sempurna untuk kamu yang berkelas dan menyukai kemewahan yang tenang.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Acara formal", "Signature harian"],
    notes: [
      { name: "Elemi", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Jeruk Pahit", layer: "top", onset: 0, peak: 9, fade: 35 },
      { name: "Iris", layer: "heart", onset: 25, peak: 90, fade: 240 },
      { name: "Cengkeh", layer: "heart", onset: 30, peak: 100, fade: 230 },
      { name: "Gaharu Ringan", layer: "heart", onset: 35, peak: 110, fade: 260 },
      { name: "Oud", layer: "base", onset: 95, peak: 250, fade: 720 },
      { name: "Sandalwood", layer: "base", onset: 90, peak: 240, fade: 700 },
      { name: "Musk Putih", layer: "base", onset: 100, peak: 260, fade: 720 },
    ],
    sizes: PRICES,
    badges: ["Signature"],
  },
  {
    slug: "azur",
    name: "Azur",
    code: "TB-03",
    subtitle: "Kesegaran Absolut",
    category: "pria",
    family: "Fresh Citrus",
    vibes: ["fresh"],
    juice: "#7fc8d6",
    atmosphere: { label: "ombak siang di laut dangkal", from: "#7fc8d6", to: "#0e3540" },
    story:
      "Kamu adalah pribadi yang santai dan menyukai kebersihan. Azur akan menemani hari aktifmu dengan kesegaran absolut.",
    longevity: [5, 7],
    sillage: "Sedang",
    occasions: ["Harian", "Siang hari"],
    notes: [
      { name: "Lemon Sisilia", layer: "top", onset: 0, peak: 8, fade: 35 },
      { name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Daun Mint", layer: "top", onset: 0, peak: 7, fade: 30 },
      { name: "Neroli", layer: "heart", onset: 20, peak: 70, fade: 180 },
      { name: "Teh Putih", layer: "heart", onset: 25, peak: 80, fade: 190 },
      { name: "Musk Bersih", layer: "base", onset: 85, peak: 200, fade: 420 },
      { name: "Cedar Muda", layer: "base", onset: 90, peak: 210, fade: 420 },
    ],
    sizes: PRICES,
    badges: ["Best Seller"],
  },
  {
    slug: "visionary",
    name: "Visionary",
    code: "TB-04",
    subtitle: "Dorongan Semangat Harian",
    category: "pria",
    family: "Aquatic Sporty",
    vibes: ["fresh"],
    juice: "#5c8bb0",
    atmosphere: { label: "udara pagi berkabut di tepi dermaga", from: "#5c8bb0", to: "#12222f" },
    story:
      "Fokus, segar, dan maskulin. Visionary adalah dorongan semangat harianmu untuk jiwa yang bebas.",
    longevity: [6, 8],
    sillage: "Sedang",
    occasions: ["Olahraga", "Kasual"],
    notes: [
      { name: "Nota Laut", layer: "top", onset: 0, peak: 9, fade: 40 },
      { name: "Jeruk Mandarin", layer: "top", onset: 0, peak: 8, fade: 35 },
      { name: "Rosemary", layer: "heart", onset: 22, peak: 75, fade: 200 },
      { name: "Geranium", layer: "heart", onset: 25, peak: 85, fade: 210 },
      { name: "Garam Air", layer: "heart", onset: 20, peak: 80, fade: 220 },
      { name: "Kayu Apung", layer: "base", onset: 88, peak: 220, fade: 480 },
      { name: "Musk Abu", layer: "base", onset: 90, peak: 230, fade: 480 },
    ],
    sizes: PRICES,
    badges: [],
  },
  {
    slug: "ultra",
    name: "Ultra",
    code: "TB-05",
    subtitle: "Manis yang Intens",
    category: "pria",
    family: "Sweet Seductive",
    vibes: ["sweet"],
    juice: "#8e2f45",
    atmosphere: { label: "lampu merah panggung sebelum tengah malam", from: "#8e2f45", to: "#2a0d16" },
    story:
      "Kamu adalah nyawa dari setiap suasana. Ultra dirancang untuk memikat perhatian dengan aroma manis yang intens.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Pesta", "Malam"],
    notes: [
      { name: "Nanas", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Bergamot", layer: "top", onset: 0, peak: 9, fade: 35 },
      { name: "Kayu Manis", layer: "heart", onset: 25, peak: 90, fade: 230 },
      { name: "Melati", layer: "heart", onset: 28, peak: 95, fade: 240 },
      { name: "Vanila Bourbon", layer: "base", onset: 95, peak: 250, fade: 720 },
      { name: "Kemenyan", layer: "base", onset: 100, peak: 260, fade: 700 },
      { name: "Amber", layer: "base", onset: 95, peak: 255, fade: 720 },
    ],
    sizes: PRICES,
    badges: ["Night Out"],
  },
  {
    slug: "night-shift",
    name: "Night Shift",
    code: "TB-06",
    subtitle: "Daya Tarik Pemberontak",
    category: "pria",
    family: "Sweet Nightlife",
    vibes: ["sweet", "dark"],
    juice: "#6f4a9c",
    atmosphere: { label: "gemerlap kota selepas tengah malam", from: "#6f4a9c", to: "#160f24" },
    story:
      "Malam adalah waktumu beraksi. Night Shift memiliki daya tarik pemberontak yang manis namun sangat maskulin.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Kelab", "Malam panjang"],
    notes: [
      { name: "Absinth", layer: "top", onset: 0, peak: 11, fade: 45 },
      { name: "Kapulaga", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Bunga Jeruk", layer: "heart", onset: 25, peak: 85, fade: 220 },
      { name: "Lavender Gelap", layer: "heart", onset: 30, peak: 95, fade: 235 },
      { name: "Tonka Bean", layer: "base", onset: 95, peak: 250, fade: 720 },
      { name: "Vanila Asap", layer: "base", onset: 100, peak: 260, fade: 720 },
      { name: "Cedar Hitam", layer: "base", onset: 95, peak: 245, fade: 700 },
    ],
    sizes: PRICES,
    badges: ["Night Out", "Best Seller"],
  },
  {
    slug: "eclat",
    name: "Eclat",
    code: "TB-07",
    subtitle: "Segar dengan Sentuhan Manis",
    category: "pria",
    family: "Sweet Aquatic",
    vibes: ["fresh", "sweet"],
    juice: "#4fb3a5",
    atmosphere: { label: "kolam jernih di bawah langit sore", from: "#4fb3a5", to: "#0f2e2c" },
    story:
      "Santai namun tetap stand out. Eclat memberikan kesegaran dengan sentuhan manis yang sangat modern.",
    longevity: [6, 8],
    sillage: "Sedang",
    occasions: ["Harian", "Kencan siang"],
    notes: [
      { name: "Bergamot Manis", layer: "top", onset: 0, peak: 9, fade: 38 },
      { name: "Pir", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Nota Laut", layer: "heart", onset: 22, peak: 80, fade: 200 },
      { name: "Melati Air", layer: "heart", onset: 25, peak: 85, fade: 210 },
      { name: "Musk Manis", layer: "base", onset: 88, peak: 220, fade: 480 },
      { name: "Ambroxan", layer: "base", onset: 90, peak: 230, fade: 480 },
    ],
    sizes: PRICES,
    badges: [],
  },
  {
    slug: "midnight-tide",
    name: "Midnight Tide",
    code: "TB-08",
    subtitle: "Kedalaman Lautan Malam",
    category: "pria",
    family: "Deep Marine",
    vibes: ["fresh", "dark"],
    juice: "#2e7d8a",
    atmosphere: { label: "laut gelap di bawah bulan", from: "#2e7d8a", to: "#0a1b1f" },
    story:
      "Tenang dan dalam seperti lautan malam. Mencerminkan kedewasaan dan kedalaman karaktermu yang misterius.",
    longevity: [8, 10],
    sillage: "Kuat",
    occasions: ["Malam", "Formal tenang"],
    notes: [
      { name: "Garam Laut", layer: "top", onset: 0, peak: 10, fade: 42 },
      { name: "Jeruk Bali", layer: "top", onset: 0, peak: 9, fade: 36 },
      { name: "Rumput Laut", layer: "heart", onset: 24, peak: 85, fade: 215 },
      { name: "Sage", layer: "heart", onset: 28, peak: 90, fade: 225 },
      { name: "Ambergris Gelap", layer: "base", onset: 92, peak: 245, fade: 600 },
      { name: "Vetiver Basah", layer: "base", onset: 95, peak: 250, fade: 600 },
      { name: "Musk Mineral", layer: "base", onset: 90, peak: 240, fade: 600 },
    ],
    sizes: PRICES,
    badges: ["Signature"],
  },
  {
    slug: "twist",
    name: "Twist",
    code: "TB-09",
    subtitle: "Energi Positif Setiap Hari",
    category: "wanita",
    family: "Fruity Floral Sweet",
    vibes: ["sweet", "floral"],
    juice: "#e8735f",
    atmosphere: { label: "kelopak dan buah di meja pagi", from: "#e8735f", to: "#3d1a16" },
    story:
      "Ceria dan menyenangkan. Twist memancarkan pesona mudamu yang selalu membawa energi positif di setiap suasana.",
    longevity: [5, 7],
    sillage: "Sedang",
    occasions: ["Harian", "Kampus"],
    notes: [
      { name: "Raspberry", layer: "top", onset: 0, peak: 9, fade: 35 },
      { name: "Jeruk Mandarin", layer: "top", onset: 0, peak: 8, fade: 32 },
      { name: "Peony", layer: "heart", onset: 22, peak: 75, fade: 185 },
      { name: "Melati Manis", layer: "heart", onset: 25, peak: 80, fade: 195 },
      { name: "Musk Putih", layer: "base", onset: 85, peak: 200, fade: 420 },
      { name: "Vanila Ringan", layer: "base", onset: 88, peak: 210, fade: 420 },
    ],
    sizes: PRICES,
    badges: ["Best Seller"],
  },
  {
    slug: "reve",
    name: "Reve",
    code: "TB-10",
    subtitle: "Kecantikan yang Elegan",
    category: "wanita",
    family: "White Floral",
    vibes: ["floral"],
    juice: "#e6dcc8",
    atmosphere: { label: "kelopak putih di ruang berkain linen", from: "#e6dcc8", to: "#33302a" },
    story:
      "Anggun dan penuh percaya diri. Reve merangkum kecantikan elegan yang cocok untuk wanita berselera tinggi.",
    longevity: [7, 9],
    sillage: "Sedang",
    occasions: ["Kantor", "Acara formal"],
    notes: [
      { name: "Bergamot", layer: "top", onset: 0, peak: 9, fade: 38 },
      { name: "Pir Putih", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Tuberose", layer: "heart", onset: 25, peak: 90, fade: 240 },
      { name: "Melati Sambac", layer: "heart", onset: 28, peak: 95, fade: 245 },
      { name: "Gardenia", layer: "heart", onset: 30, peak: 100, fade: 250 },
      { name: "Musk Halus", layer: "base", onset: 90, peak: 235, fade: 540 },
      { name: "Sandalwood Krem", layer: "base", onset: 92, peak: 240, fade: 540 },
    ],
    sizes: PRICES,
    badges: ["Best Seller", "Signature"],
  },
  {
    slug: "lune",
    name: "Lune",
    code: "TB-11",
    subtitle: "Jejak yang Sulit Dilupakan",
    category: "wanita",
    family: "Sweet Praline",
    vibes: ["sweet"],
    juice: "#c08552",
    atmosphere: { label: "karamel hangat di bawah lampu temaram", from: "#c08552", to: "#33200f" },
    story:
      "Aromamu meninggalkan jejak yang sulit dilupakan. Lune diciptakan untuk kamu yang berani tampil memukau.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Malam", "Kencan"],
    notes: [
      { name: "Almond", layer: "top", onset: 0, peak: 11, fade: 42 },
      { name: "Bergamot", layer: "top", onset: 0, peak: 9, fade: 35 },
      { name: "Bunga Jeruk", layer: "heart", onset: 25, peak: 88, fade: 225 },
      { name: "Praline", layer: "heart", onset: 30, peak: 100, fade: 250 },
      { name: "Tonka Bean", layer: "base", onset: 95, peak: 250, fade: 720 },
      { name: "Vanila", layer: "base", onset: 100, peak: 255, fade: 720 },
      { name: "Musk Hangat", layer: "base", onset: 95, peak: 245, fade: 700 },
    ],
    sizes: PRICES,
    badges: ["Best Seller"],
  },
  {
    slug: "midnight-siren",
    name: "Midnight Siren",
    code: "TB-12",
    subtitle: "Berani dan Sensual",
    category: "wanita",
    family: "Tonka Bold",
    vibes: ["sweet", "dark"],
    juice: "#8c3a63",
    atmosphere: { label: "beludru gelap di ruang tanpa jendela", from: "#8c3a63", to: "#25101c" },
    story:
      "Keseimbangan sempurna yang sangat berani, powerful, namun tetap sensual di saat bersamaan.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Malam", "Acara besar"],
    notes: [
      { name: "Plum", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Lada Merah Muda", layer: "top", onset: 0, peak: 9, fade: 36 },
      { name: "Mawar Gelap", layer: "heart", onset: 25, peak: 90, fade: 235 },
      { name: "Iris", layer: "heart", onset: 30, peak: 95, fade: 245 },
      { name: "Tonka Bean", layer: "base", onset: 95, peak: 250, fade: 720 },
      { name: "Patchouli", layer: "base", onset: 98, peak: 255, fade: 700 },
      { name: "Amber Gelap", layer: "base", onset: 95, peak: 250, fade: 720 },
    ],
    sizes: PRICES,
    badges: ["Night Out"],
  },
  {
    slug: "secret-potion",
    name: "Secret Potion",
    code: "TB-13",
    subtitle: "Senjata Rahasia Malammu",
    category: "wanita",
    family: "Vanilla Coffee Dark",
    vibes: ["sweet", "dark"],
    juice: "#7a4a2f",
    atmosphere: { label: "kopi hitam dan kayu di larut malam", from: "#7a4a2f", to: "#1d100a" },
    story:
      "Gelap, adiktif, dan menggoda. Ini adalah senjata rahasiamu untuk malam yang tak terlupakan. Sangat memikat.",
    longevity: [8, 12],
    sillage: "Kuat",
    occasions: ["Malam", "Suasana intim"],
    notes: [
      { name: "Kopi Panggang", layer: "top", onset: 0, peak: 12, fade: 50 },
      { name: "Kapulaga", layer: "top", onset: 0, peak: 10, fade: 40 },
      { name: "Bunga Jeruk", layer: "heart", onset: 25, peak: 85, fade: 220 },
      { name: "Kakao", layer: "heart", onset: 30, peak: 95, fade: 240 },
      { name: "Vanila Gelap", layer: "base", onset: 95, peak: 255, fade: 720 },
      { name: "Benzoin", layer: "base", onset: 100, peak: 260, fade: 720 },
      { name: "Musk Hitam", layer: "base", onset: 95, peak: 250, fade: 700 },
    ],
    sizes: PRICES,
    badges: ["Night Out", "Signature"],
  },
];

/** Varian yang tampil di Featured Scent of the Month (PRD 5.1) */
export const SEED_FEATURED: Record<Category, string> = {
  pria: "crown",
  wanita: "reve",
};
