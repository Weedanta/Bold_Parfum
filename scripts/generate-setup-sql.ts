/**
 * Menulis supabase/setup.sql dari seluruh migrasi plus seed.
 *
 * Jalankan: npm run setup:sql
 *
 * setup.sql adalah satu berkas sekali-tempel untuk membangun database dari nol
 * lewat SQL Editor dashboard, tanpa Supabase CLI. Sebelumnya berkas ini digabung
 * tangan, dan itulah yang membuatnya diam-diam ketinggalan saat migrasi
 * normalisasi masuk: tidak ada yang mengingatkan bahwa ia perlu diperbarui.
 * Sekarang ia dihasilkan, jadi menambah migrasi baru cukup diikuti satu perintah.
 *
 * Tiap bagian dilucuti begin/commit-nya lalu dibungkus satu transaksi bersama.
 * Postgres tidak mengenal transaksi bersarang, dan setengah setup yang berhasil
 * lebih menyulitkan daripada setup yang gagal utuh.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");

/** Membuang `begin;` dan `commit;` yang berdiri sendiri di awal baris. */
function tanpaTransaksi(sql: string) {
  return sql
    .replace(/^[ \t]*(begin|commit)[ \t]*;[ \t]*\r?\n/gim, "")
    .trim();
}

const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const bagian = [
  ...migrations.map((name) => ({
    judul: `supabase/migrations/${name}`,
    sql: tanpaTransaksi(readFileSync(path.join(migrationsDir, name), "utf8")),
  })),
  {
    judul: "supabase/seed.sql",
    sql: tanpaTransaksi(readFileSync(path.join(root, "supabase", "seed.sql"), "utf8")),
  },
];

const sql = `-- DIHASILKAN OTOMATIS oleh scripts/generate-setup-sql.ts. Jangan diedit tangan.
-- Perbarui dengan: npm run setup:sql
--
-- SETUP SEKALI JALAN untuk katalog The Bold: gabungan seluruh migrasi dan seed.
-- Tempel seluruh isi berkas ini ke Supabase SQL Editor lalu Run.
-- Aman dijalankan berulang.
--
-- Bagian:
${bagian.map((b) => `--   ${b.judul}`).join("\n")}

begin;

${bagian
  .map(
    (b) =>
      `-- ${"=".repeat(74)}\n-- ${b.judul}\n-- ${"=".repeat(74)}\n\n${b.sql}`,
  )
  .join("\n\n")}

commit;
`;

writeFileSync(path.join(root, "supabase", "setup.sql"), sql, "utf8");
console.log(`supabase/setup.sql ditulis dari ${bagian.length} bagian.`);
