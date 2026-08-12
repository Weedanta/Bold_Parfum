/**
 * Menulis supabase/seed.sql dari lib/seed/products.seed.ts.
 *
 * Jalankan: npm run seed:sql
 *
 * Data awal ditulis sekali sebagai SQL, bukan di-push lewat API, supaya seeding
 * bisa dijalankan dari SQL Editor dashboard tanpa kredensial service role di
 * mesin siapa pun. Hasilnya idempoten dan aman dijalankan ulang; mengulanginya
 * akan mengembalikan isi katalog ke kondisi awal.
 *
 * Dua kolom sengaja tidak ikut ditimpa saat barisnya sudah ada:
 *
 *   photo_path   : foto yang sudah diunggah ke Storage tidak boleh lenyap hanya
 *                  karena seed dijalankan lagi.
 *   stock_status : ketersediaan adalah keadaan operasional harian, bukan isi
 *                  katalog. Seed yang mengembalikannya ke "tersedia" akan
 *                  menghidupkan lagi tombol beli varian yang stoknya habis.
 *
 * Tabel anak diganti utuh, bukan disamakan baris per baris: seed memang berniat
 * memulihkan keadaan awal, dan mengganti utuh sekalian membuang sisa baris yang
 * sudah tidak ada di sumbernya.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

import { SEED_FEATURED, seedProducts } from "@/lib/seed/products.seed";

function quote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Satu baris VALUES, misalnya `  ('crown', 0, 'Bergamot', 'top', 0, 10, 45)`. */
function tuple(values: (string | number)[]) {
  return `  (${values.join(", ")})`;
}

const SLUGS = seedProducts.map((product) => quote(product.slug)).join(", ");

const PRODUCT_COLUMNS = [
  "slug",
  "code",
  "name",
  "subtitle",
  "category",
  "family",
  "juice",
  "atmosphere_label",
  "atmosphere_from",
  "atmosphere_to",
  "story",
  "longevity_min",
  "longevity_max",
  "sillage",
  "featured_for",
  "sort_order",
];

const productRows = seedProducts.map((product, index) => {
  const featuredFor =
    SEED_FEATURED.pria === product.slug
      ? quote("pria")
      : SEED_FEATURED.wanita === product.slug
        ? quote("wanita")
        : "null";

  return tuple([
    quote(product.slug),
    quote(product.code),
    quote(product.name),
    quote(product.subtitle),
    quote(product.category),
    quote(product.family),
    quote(product.juice),
    quote(product.atmosphere.label),
    quote(product.atmosphere.from),
    quote(product.atmosphere.to),
    quote(product.story),
    product.longevity[0],
    product.longevity[1],
    quote(product.sillage),
    featuredFor,
    // Urutan di file seed adalah urutan kode varian, TB-01 sampai TB-13, dan
    // itulah urutan tampil yang diharapkan sampai klien mengubahnya sendiri.
    (index + 1) * 10,
  ]);
});

/**
 * Satu blok isi tabel anak: hapus milik slug yang di-seed, lalu isi ulang.
 *
 * product_id tidak pernah ditulis langsung karena id-nya lahir di database.
 * Barisnya disusun memakai slug, lalu di-join ke products untuk menukarnya jadi id.
 */
function childBlock(
  table: string,
  columns: string[],
  selectExpressions: string[],
  rows: string[],
) {
  const del =
    `delete from public.${table}\n` +
    ` where product_id in (select id from public.products where slug in (${SLUGS}));`;

  if (rows.length === 0) {
    return `${del}\n-- Tidak ada baris ${table} di data seed.`;
  }

  return `${del}

insert into public.${table} (product_id, ${columns.join(", ")})
select p.id, ${selectExpressions.join(", ")}
from (values
${rows.join(",\n")}
) as v(slug, ${columns.join(", ")})
join public.products p on p.slug = v.slug;`;
}

const noteRows = seedProducts.flatMap((product) =>
  product.notes.map((note, position) =>
    tuple([
      quote(product.slug),
      position,
      quote(note.name),
      quote(note.layer),
      note.onset,
      note.peak,
      note.fade,
    ]),
  ),
);

const sizeRows = seedProducts.flatMap((product) =>
  product.sizes.map((size) => tuple([quote(product.slug), size.ml, size.price])),
);

const vibeRows = seedProducts.flatMap((product) =>
  product.vibes.map((vibe) => tuple([quote(product.slug), quote(vibe)])),
);

const occasionRows = seedProducts.flatMap((product) =>
  product.occasions.map((label, position) =>
    tuple([quote(product.slug), position, quote(label)]),
  ),
);

const badgeRows = seedProducts.flatMap((product) =>
  product.badges.map((label, position) => tuple([quote(product.slug), position, quote(label)])),
);

const sql = `-- DIHASILKAN OTOMATIS oleh scripts/generate-seed-sql.ts. Jangan diedit tangan.
-- Sumber: lib/seed/products.seed.ts
-- Perbarui dengan: npm run seed:sql
--
-- Aman dijalankan berulang. Menjalankannya lagi akan menimpa perubahan isi yang
-- dibuat lewat panel admin, kecuali photo_path dan stock_status yang sengaja
-- dipertahankan.

begin;

insert into public.products (
  ${PRODUCT_COLUMNS.join(",\n  ")}
) values
${productRows.join(",\n")}
on conflict (slug) do update set
${PRODUCT_COLUMNS.filter((column) => column !== "slug")
  .map((column) => `  ${column} = excluded.${column}`)
  .join(",\n")};

${childBlock(
  "product_notes",
  ["position", "name", "layer", "onset", "peak", "fade"],
  ["v.position", "v.name", "v.layer::product_layer", "v.onset", "v.peak", "v.fade"],
  noteRows,
)}

${childBlock("product_sizes", ["ml", "price"], ["v.ml", "v.price"], sizeRows)}

${childBlock("product_vibes", ["vibe"], ["v.vibe::product_vibe"], vibeRows)}

${childBlock(
  "product_occasions",
  ["position", "label"],
  ["v.position", "v.label"],
  occasionRows,
)}

${childBlock("product_badges", ["position", "label"], ["v.position", "v.label"], badgeRows)}

commit;
`;

const target = path.join(process.cwd(), "supabase", "seed.sql");
writeFileSync(target, sql, "utf8");
console.log(
  `supabase/seed.sql ditulis: ${seedProducts.length} varian, ${noteRows.length} note, ` +
    `${sizeRows.length} ukuran, ${vibeRows.length} vibe, ${occasionRows.length} kesempatan, ` +
    `${badgeRows.length} label.`,
);
