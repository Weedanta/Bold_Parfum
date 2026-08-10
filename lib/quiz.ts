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
    eyebrow: "Filter utama",
    prompt: "Untuk siapa pencarian aroma ini?",
    options: [
      { id: "a", label: "Untuk diriku sendiri, saya mencari parfum pria", category: "pria" },
      { id: "b", label: "Untuk diriku sendiri, saya mencari parfum wanita", category: "wanita" },
    ],
  },
  {
    id: "presence",
    eyebrow: "Cara hadir",
    prompt: "Ketika memasuki ruangan yang penuh orang baru, bagaimana sikap Anda?",
    options: [
      {
        id: "a",
        label: "Mengamati dari sudut ruangan, tenang, dan membiarkan orang yang menyapa saya",
        weights: { misterius: 3, elegant: 1 },
      },
      {
        id: "b",
        label: "Langsung membaur, tersenyum, dan mudah memulai obrolan",
        weights: { fresh: 3, sporty: 1 },
      },
      {
        id: "c",
        label: "Berjalan percaya diri ke tengah ruangan; saya suka menjadi pusat perhatian",
        weights: { bold: 3, sweet: 1 },
      },
      {
        id: "d",
        label: "Bersikap sopan, menjaga postur, dan mencari rekan diskusi yang sefrekuensi",
        weights: { elegant: 3, woody: 1 },
      },
    ],
  },
  {
    id: "drive",
    eyebrow: "Dorongan hidup",
    prompt: "Apa yang menjadi dorongan terbesar dalam hidup Anda saat ini?",
    options: [
      {
        id: "a",
        label: "Kebebasan, petualangan, dan mengeksplorasi hal baru",
        weights: { fresh: 3, sporty: 2 },
      },
      {
        id: "b",
        label: "Ambisi, kesuksesan, dan dihormati oleh orang sekitar",
        weights: { woody: 3, bold: 2, elegant: 1 },
      },
      {
        id: "c",
        label: "Bersenang-senang dan menciptakan kenangan manis bersama orang terdekat",
        weights: { sweet: 3, bold: 1 },
      },
      {
        id: "d",
        label: "Kedamaian, keseimbangan emosional, dan harmoni",
        weights: { floral: 3, elegant: 1 },
      },
    ],
  },
  {
    id: "secret",
    eyebrow: "Sisi lain",
    prompt: "Rahasia kecil apa yang paling menggambarkan sisi lain diri Anda?",
    options: [
      {
        id: "a",
        label: "Terlihat santai, tapi sebenarnya sangat terencana dan fokus",
        weights: { sporty: 3, fresh: 1 },
      },
      {
        id: "b",
        label: "Terlihat pendiam, tapi punya sisi liar yang hanya diketahui orang terdekat",
        weights: { dark: 3, misterius: 2 },
      },
      {
        id: "c",
        label: "Terlihat kuat, tapi sebenarnya sangat menyukai hal manis dan romantis",
        weights: { sweet: 3, bold: 1 },
      },
      {
        id: "d",
        label: "Terlihat rapi, tapi sering memikirkan hal filosofis yang dalam",
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
