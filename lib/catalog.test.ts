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
    vibes: ["fresh", "woody"],
    juice: "#c98a3c",
    atmosphere_label: "ruang uji",
    atmosphere_from: "#c98a3c",
    atmosphere_to: "#3a2410",
    story: "Cerita contoh.",
    longevity_min: 6,
    longevity_max: 8,
    sillage: "Sedang",
    occasions: ["Harian"],
    badges: [],
    notes: [{ name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 45 }],
    sizes: [{ ml: 30, price: 149000 }],
    photo_path: null,
    featured_for: null,
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
  assert.equal(product.notes.length, 1);
  assert.equal(product.photoUrl, null);
  assert.equal(product.featuredFor, null);
});

test("photo_path jadi URL publik bucket, null tetap null", () => {
  assert.equal(
    rowToProduct(row({ photo_path: "contoh.webp" })).photoUrl,
    "https://contohproyek.supabase.co/storage/v1/object/public/product-photos/contoh.webp",
  );
  assert.equal(rowToProduct(row({ photo_path: null })).photoUrl, null);
});

test("vibe yang tidak dikenal dibuang, sisanya tetap terbaca", () => {
  const product = rowToProduct(row({ vibes: ["fresh", "entahapa", "dark"] }));
  assert.deepEqual(product.vibes, ["fresh", "dark"]);
});

test("note yang bentuknya rusak dibuang tanpa menjatuhkan varian", () => {
  const product = rowToProduct(
    row({
      notes: [
        { name: "Bergamot", layer: "top", onset: 0, peak: 10, fade: 45 },
        { name: "Tanpa layer", onset: 0, peak: 10, fade: 45 },
        { name: "Layer asing", layer: "middle", onset: 0, peak: 10, fade: 45 },
        { layer: "base", onset: 0, peak: 10, fade: 45 },
        "bukan objek",
      ],
    }),
  );

  assert.deepEqual(
    product.notes.map((note) => note.name),
    ["Bergamot"],
  );
});

test("kolom array yang null jadi array kosong", () => {
  const product = rowToProduct(row({ vibes: null, occasions: null, badges: null }));
  assert.deepEqual(product.vibes, []);
  assert.deepEqual(product.occasions, []);
  assert.deepEqual(product.badges, []);
});

test("ukuran di luar 30 dan 50 ml diabaikan", () => {
  const product = rowToProduct(
    row({
      sizes: [
        { ml: 30, price: 149000 },
        { ml: 100, price: 399000 },
        { ml: 50, price: 0 },
      ],
    }),
  );

  assert.deepEqual(product.sizes, [{ ml: 30, price: 149000 }]);
});

test("varian tanpa ukuran yang sah melempar error yang menyebut slug", () => {
  assert.throws(() => rowToProduct(row({ slug: "rusak", sizes: [] })), /rusak/);
});

test("kategori tidak dikenal melempar error yang menyebut slug", () => {
  assert.throws(() => rowToProduct(row({ slug: "rusak", category: "unisex" })), /rusak/);
});

test("featured_for terbaca sebagai kategori", () => {
  assert.equal(rowToProduct(row({ featured_for: "wanita" })).featuredFor, "wanita");
  assert.equal(rowToProduct(row({ featured_for: "entahapa" })).featuredFor, null);
});
