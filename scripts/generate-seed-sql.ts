/**
 * Menulis supabase/seed.sql dari lib/seed/products.seed.ts.
 *
 * Jalankan: npm run seed:sql
 *
 * Data awal ditulis sekali sebagai SQL, bukan di-push lewat API, supaya seeding
 * bisa dijalankan dari SQL Editor dashboard tanpa kredensial service role di
 * mesin siapa pun. Hasilnya idempoten: `on conflict (slug) do update`, jadi
 * aman dijalankan ulang, dan mengulanginya akan mengembalikan katalog ke
 * kondisi awal.
 *
 * `photo_path` sengaja tidak disentuh perintah update supaya foto yang sudah
 * diunggah ke Storage tidak ikut terhapus saat seed dijalankan lagi.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

import { SEED_FEATURED, seedProducts } from "@/lib/seed/products.seed";

function quote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function textArray(values: string[]) {
  return values.length === 0
    ? "'{}'"
    : `array[${values.map(quote).join(", ")}]`;
}

/** Array enum butuh cast eksplisit; array kosong tidak punya tipe yang bisa ditebak. */
function enumArray(values: string[], type: string) {
  return values.length === 0
    ? `'{}'::${type}[]`
    : `array[${values.map(quote).join(", ")}]::${type}[]`;
}

function json(value: unknown) {
  return `${quote(JSON.stringify(value))}::jsonb`;
}

const COLUMNS = [
  "slug",
  "code",
  "name",
  "subtitle",
  "category",
  "family",
  "vibes",
  "juice",
  "atmosphere_label",
  "atmosphere_from",
  "atmosphere_to",
  "story",
  "longevity_min",
  "longevity_max",
  "sillage",
  "occasions",
  "badges",
  "notes",
  "sizes",
  "featured_for",
  "sort_order",
];

const rows = seedProducts.map((product, index) => {
  const featuredFor =
    SEED_FEATURED.pria === product.slug
      ? quote("pria")
      : SEED_FEATURED.wanita === product.slug
        ? quote("wanita")
        : "null";

  const values = [
    quote(product.slug),
    quote(product.code),
    quote(product.name),
    quote(product.subtitle),
    quote(product.category),
    quote(product.family),
    enumArray(product.vibes, "product_vibe"),
    quote(product.juice),
    quote(product.atmosphere.label),
    quote(product.atmosphere.from),
    quote(product.atmosphere.to),
    quote(product.story),
    String(product.longevity[0]),
    String(product.longevity[1]),
    quote(product.sillage),
    textArray(product.occasions),
    textArray(product.badges),
    json(product.notes),
    json(product.sizes),
    featuredFor,
    // Urutan di file seed adalah urutan kode varian, TB-01 sampai TB-13, dan
    // itulah urutan tampil yang diharapkan sampai klien mengubahnya sendiri.
    String((index + 1) * 10),
  ];

  return `  (\n    ${values.join(",\n    ")}\n  )`;
});

const sql = `-- DIHASILKAN OTOMATIS oleh scripts/generate-seed-sql.ts. Jangan diedit tangan.
-- Sumber: lib/seed/products.seed.ts
-- Perbarui dengan: npm run seed:sql
--
-- Aman dijalankan berulang. Menjalankannya lagi akan menimpa perubahan yang
-- dibuat lewat dashboard, kecuali photo_path yang sengaja dipertahankan.

insert into public.products (
  ${COLUMNS.join(",\n  ")}
) values
${rows.join(",\n")}
on conflict (slug) do update set
${COLUMNS.filter((column) => column !== "slug")
  .map((column) => `  ${column} = excluded.${column}`)
  .join(",\n")};
`;

const target = path.join(process.cwd(), "supabase", "seed.sql");
writeFileSync(target, sql, "utf8");
console.log(`supabase/seed.sql ditulis, ${seedProducts.length} varian.`);
