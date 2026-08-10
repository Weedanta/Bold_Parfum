import assert from "node:assert/strict";
import { test } from "node:test";

// publicPhotoUrl membaca env saat dipanggil, jadi cukup diisi sebelum uji jalan.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://contohproyek.supabase.co";

import { rowToProduct, type ProductRow } from "@/lib/catalog-mapper";

/** Baris sintetis, bukan salinan data katalog sebenarnya. */
function row(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    slug: "contoh",
    code: "TB-99",
    name: "Contoh",
    subtitle: "Varian uji",
    category: "pria",
    family: "Fresh Spicy",
    juice: "#c98a3c",
    atmosphere_label: "ruang uji",
    atmosphere_from: "#c98a3c",
    atmosphere_to: "#3a2410",
    story: "Cerita contoh.",
    longevity_min: 6,
    longevity_max: 8,
    sillage: "Sedang",
    photo_path: null,
    featured_for: null,
    product_notes: [{ position: 0, name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 45 }],
    product_sizes: [{ ml: 30, price: 149000 }],
    product_vibes: [{ vibe: "fresh" }, { vibe: "woody" }],
    product_occasions: [{ position: 0, label: "Harian" }],
    product_badges: [],
    ...overrides,
  };
}

test("memetakan baris utuh ke bentuk Product", () => {
  const product = rowToProduct(row());

  assert.equal(product.slug, "contoh");
  assert.deepEqual(product.longevity, [6, 8]);
  assert.deepEqual(product.atmosphere, {
    label: "ruang uji",
    from: "#c98a3c",
    to: "#3a2410",
  });
  assert.deepEqual(product.vibes, ["fresh", "woody"]);
  assert.deepEqual(product.occasions, ["Harian"]);
  assert.equal(product.notes.length, 1);
  assert.equal(product.photoUrl, null);
  assert.equal(product.featuredFor, null);
});

/**
 * PostgREST tidak menjamin urutan baris tersemat, sedangkan urutan note ikut
 * menentukan bacaan halaman produk. Kolom position yang menjaganya.
 */
test("note dan label diurutkan berdasarkan position, bukan urutan datang", () => {
  const product = rowToProduct(
    row({
      product_notes: [
        { position: 2, name: "Cedarwood", layer: "base", onset: 90, peak: 240, fade: 720 },
        { position: 0, name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 45 },
        { position: 1, name: "Lavender", layer: "heart", onset: 20, peak: 80, fade: 220 },
      ],
      product_occasions: [
        { position: 1, label: "Acara formal" },
        { position: 0, label: "Kantor" },
      ],
      product_badges: [
        { position: 1, label: "Signature" },
        { position: 0, label: "Best Seller" },
      ],
    }),
  );

  assert.deepEqual(
    product.notes.map((note) => note.name),
    ["Bergamot", "Lavender", "Cedarwood"],
  );
  assert.deepEqual(product.occasions, ["Kantor", "Acara formal"]);
  assert.deepEqual(product.badges, ["Best Seller", "Signature"]);
});

test("photo_path jadi URL publik bucket, null tetap null", () => {
  assert.equal(
    rowToProduct(row({ photo_path: "contoh.webp" })).photoUrl,
    "https://contohproyek.supabase.co/storage/v1/object/public/product-photos/contoh.webp",
  );
  assert.equal(rowToProduct(row({ photo_path: null })).photoUrl, null);
});

test("vibe yang tidak dikenal dibuang, sisanya tetap terbaca", () => {
  const product = rowToProduct(
    row({ product_vibes: [{ vibe: "fresh" }, { vibe: "entahapa" }, { vibe: "dark" }] }),
  );
  assert.deepEqual(product.vibes, ["fresh", "dark"]);
});

test("lapisan note yang tidak dikenal membuang note itu saja", () => {
  const product = rowToProduct(
    row({
      product_notes: [
        { position: 0, name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 45 },
        { position: 1, name: "Lapisan asing", layer: "middle", onset: 0, peak: 10, fade: 45 },
      ],
    }),
  );

  assert.deepEqual(
    product.notes.map((note) => note.name),
    ["Bergamot"],
  );
});

test("tabel anak yang kosong jadi larik kosong", () => {
  const product = rowToProduct(
    row({
      product_vibes: null,
      product_occasions: null,
      product_badges: null,
      product_notes: null,
    }),
  );
  assert.deepEqual(product.vibes, []);
  assert.deepEqual(product.occasions, []);
  assert.deepEqual(product.badges, []);
  assert.deepEqual(product.notes, []);
});

test("ukuran di luar 30 dan 50 ml diabaikan, sisanya urut menaik", () => {
  const product = rowToProduct(
    row({
      product_sizes: [
        { ml: 50, price: 219000 },
        { ml: 100, price: 399000 },
        { ml: 30, price: 149000 },
      ],
    }),
  );

  assert.deepEqual(product.sizes, [
    { ml: 30, price: 149000 },
    { ml: 50, price: 219000 },
  ]);
});

test("varian tanpa ukuran yang sah melempar error yang menyebut slug", () => {
  assert.throws(() => rowToProduct(row({ slug: "rusak", product_sizes: [] })), /rusak/);
});

test("kategori tidak dikenal melempar error yang menyebut slug", () => {
  assert.throws(() => rowToProduct(row({ slug: "rusak", category: "unisex" })), /rusak/);
});

test("featured_for terbaca sebagai kategori", () => {
  assert.equal(rowToProduct(row({ featured_for: "wanita" })).featuredFor, "wanita");
  assert.equal(rowToProduct(row({ featured_for: "entahapa" })).featuredFor, null);
});
