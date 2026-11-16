/**
 * Scent Profiler, 4 pertanyaan, teks diambil dari website 20plan.md Bagian 2.
 *
 * Skoring memakai bobot sifat, bukan tabel if/else. Tiap jawaban menambah poin
 * ke beberapa sifat, tiap produk punya afinitas sifat sendiri, pemenangnya adalah
 * dot product tertinggi di dalam kategori yang dipilih pada Q1.
 *
 * Model ini dipilih karena mereproduksi seluruh pemetaan di PRD 5.3 sekaligus
 * menangani kombinasi jawaban campuran yang tidak disebut PRD. Tabel kaku akan
 * kehabisan cabang di kombinasi seperti itu. Uji kesesuaiannya ada di
 * lib/quiz.test.ts.
 */

import type { Category } from "@/lib/products";

/**
 * Skoring hanya butuh dua kolom dari tiap varian. Menerima bentuk sekecil ini,
 * bukan Product utuh, membuat matchProduct bisa dipanggil dari komponen client
 * yang hanya memegang CatalogEntry, sekaligus bisa diuji dengan data seed.
 */
export type QuizCandidate = { slug: string; category: Category };

export type Trait =
  | "misterius"
  | "fresh"
  | "bold"
  | "elegant"
  | "sweet"
  | "woody"
  | "floral"
  | "sporty"
  | "dark";

export type OptionId = "a" | "b" | "c" | "d";
export type Weights = Partial<Record<Trait, number>>;

export type QuizOption = {
  id: OptionId;
  label: string;
  /** Sifat yang ditambahkan jawaban ini. Kosong pada Q1 yang hanya memfilter. */
  weights?: Weights;
  /** Hanya pada Q1, menentukan koleksi yang dicari. */
  category?: Category;
};

export type QuizQuestion = {
  id: string;
  eyebrow: string;
  prompt: string;
  options: QuizOption[];
};

export const questions: QuizQuestion[] = [
  {
    id: "target",
    eyebrow: "Langkah awal",
    prompt: "Parfum ini nantinya mau dipakai siapa?",
    options: [
      { id: "a", label: "Saya mencari parfum pria (For Him)", category: "pria" },
      { id: "b", label: "Saya mencari parfum wanita (For Her)", category: "wanita" },
    ],
  },
  {
    id: "presence",
    eyebrow: "Kesan pertama",
    prompt: "Kalau lagi datang ke acara atau tempat baru, biasanya kamu tipe yang gimana?",
    options: [
      {
        id: "a",
        label: "Lebih suka duduk tenang dulu sambil mengamati suasana sekitar",
        weights: { misterius: 3, elegant: 1 },
      },
      {
        id: "b",
        label: "Gampang cair, murah senyum, dan asyik ngobrol sama siapa saja",
        weights: { fresh: 3, sporty: 1 },
      },
      {
        id: "c",
        label: "Tampil percaya diri dan nggak ragu jadi pusat perhatian",
        weights: { bold: 3, sweet: 1 },
      },
      {
        id: "d",
        label: "Kalem, rapi, dan lebih nyaman ngobrol hangat sama yang satu frekuensi",
        weights: { elegant: 3, woody: 1 },
      },
    ],
  },
  {
    id: "drive",
    eyebrow: "Suasana hati",
    prompt: "Hal apa yang paling bikin kamu bersemangat akhir-akhir ini?",
    options: [
      {
        id: "a",
        label: "Jalan-jalan, cari suasana segar, dan coba banyak hal baru",
        weights: { fresh: 3, sporty: 2 },
      },
      {
        id: "b",
        label: "Kejar target besar, fokus berkarya, dan tampil meyakinkan",
        weights: { woody: 3, bold: 2, elegant: 1 },
      },
      {
        id: "c",
        label: "Menikmati waktu seru dan bikin momen manis bareng orang terdekat",
        weights: { sweet: 3, bold: 1 },
      },
      {
        id: "d",
        label: "Hidup yang tenang, seimbang, dan jauh dari hiruk-pikuk",
        weights: { floral: 3, elegant: 1 },
      },
    ],
  },
  {
    id: "secret",
    eyebrow: "Sisi personal",
    prompt: "Kalau orang sudah kenal dekat, sisi apa yang paling sering mereka lihat dari kamu?",
    options: [
      {
        id: "a",
        label: "Kelihatannya santai, padahal aslinya rapi dan punya rencana matang",
        weights: { sporty: 3, fresh: 1 },
      },
      {
        id: "b",
        label: "Dari luar kelihatan kalem, tapi seru dan berani kalau suasana malam mulai hidup",
        weights: { dark: 3, misterius: 2 },
      },
      {
        id: "c",
        label: "Kelihatan tegas di luar, tapi sebenarnya hangat, perhatian, dan romantis",
        weights: { sweet: 3, bold: 1 },
      },
      {
        id: "d",
        label: "Tenang, dewasa, dan suka obrolan mendalam sampai larut",
        weights: { elegant: 3, woody: 1, misterius: 1 },
      },
    ],
  },
];

/** Afinitas sifat tiap varian, diturunkan dari pemetaan PRD 5.3. */
export const AFFINITY: Record<string, Weights> = {
  crown: { elegant: 3, bold: 3, woody: 2 },
  ether: { elegant: 3, woody: 3, misterius: 2 },
  azur: { fresh: 3, sporty: 2 },
  visionary: { fresh: 3, sporty: 3 },
  ultra: { bold: 3, sweet: 3 },
  "night-shift": { bold: 2, sweet: 3, dark: 3 },
  eclat: { misterius: 2, fresh: 2, sweet: 2 },
  "midnight-tide": { misterius: 3, dark: 2, fresh: 1 },
  voyage: { elegant: 3, fresh: 3, woody: 1 },
  muse: { floral: 3, elegant: 2, fresh: 2 },
  twist: { fresh: 3, sweet: 2, floral: 2 },
  reve: { elegant: 3, floral: 3 },
  lune: { bold: 3, sweet: 3 },
  "midnight-siren": { bold: 3, sweet: 2, dark: 2 },
  "secret-potion": { misterius: 3, dark: 3, sweet: 2 },
};

export type Answers = Record<string, OptionId>;

export function isComplete(answers: Answers) {
  return questions.every((q) => answers[q.id] !== undefined);
}

function selectedOption(question: QuizQuestion, answers: Answers) {
  const id = answers[question.id];
  return question.options.find((o) => o.id === id);
}

/** Menjumlahkan bobot sifat dari Q2 sampai Q4. */
export function tallyTraits(answers: Answers): Weights {
  const total: Weights = {};
  for (const question of questions) {
    const weights = selectedOption(question, answers)?.weights;
    if (!weights) continue;
    for (const [trait, value] of Object.entries(weights) as [Trait, number][]) {
      total[trait] = (total[trait] ?? 0) + value;
    }
  }
  return total;
}

export function selectedCategory(answers: Answers): Category | undefined {
  return selectedOption(questions[0], answers)?.category;
}

/**
 * Mengembalikan slug varian yang paling cocok.
 *
 * Seri diputus oleh urutan varian di dalam `catalog`, dan katalog datang terurut
 * dari Supabase (sort_order lalu code), jadi hasilnya tetap deterministik.
 */
export function matchProduct(
  answers: Answers,
  catalog: readonly QuizCandidate[],
): string | undefined {
  const category = selectedCategory(answers);
  if (!category) return undefined;

  const traits = tallyTraits(answers);
  const candidates = catalog.filter((p) => p.category === category);

  let best: { slug: string; score: number } | undefined;
  for (const product of candidates) {
    const affinity = AFFINITY[product.slug] ?? {};
    let score = 0;
    for (const [trait, weight] of Object.entries(affinity) as [Trait, number][]) {
      score += weight * (traits[trait] ?? 0);
    }
    if (!best || score > best.score) best = { slug: product.slug, score };
  }
  return best?.slug;
}

export const TOTAL_STEPS = questions.length;

const OPTION_IDS: OptionId[] = ["a", "b", "c", "d"];

/** Membaca jawaban tersimpan, membuang apa pun yang tidak dikenali. */
export function parseAnswers(raw: string | null): Answers {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Answers = {};
    for (const question of questions) {
      const value = (parsed as Record<string, unknown>)[question.id];
      if (typeof value !== "string") continue;
      if (!OPTION_IDS.includes(value as OptionId)) continue;
      if (!question.options.some((option) => option.id === value)) continue;
      result[question.id] = value as OptionId;
    }
    return result;
  } catch {
    return {};
  }
}

/** Langkah pertama yang belum dijawab; kalau semua sudah, langkah terakhir. */
export function firstUnansweredStep(answers: Answers) {
  const index = questions.findIndex((question) => answers[question.id] === undefined);
  return index === -1 ? questions.length - 1 : index;
}
