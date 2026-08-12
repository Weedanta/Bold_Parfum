"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { CATALOG_TAG } from "@/lib/catalog";
import { createSupabaseSessionClient, requireAdmin } from "@/lib/supabase/auth";
import { PHOTO_BUCKET } from "@/lib/supabase/server";
import {
  CATEGORIES,
  LAYERS,
  SILLAGES,
  STOCKS,
  type Layer,
  type Size,
  type Stock,
} from "@/lib/products";

/**
 * Aksi panel admin.
 *
 * Semuanya berjalan lewat klien sesi, yang memakai kunci publishable. Jadi setiap
 * tulisan tetap diperiksa RLS: requireAdmin() di sini hanya memberi pesan yang
 * enak dibaca, sedangkan penolakan sebenarnya terjadi di database.
 *
 * Validasi di bawah sengaja mencerminkan CHECK constraint di migrasi 0001. Yang
 * lolos dari sini tetap dijaga database; yang tertahan di sini hanya supaya
 * pesannya dalam bahasa manusia, bukan pesan constraint Postgres.
 */

export type ActionState = { error?: string; ok?: string };

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Cerminan constraint products_slug_format di migrasi 0001. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"];

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function integer(form: FormData, name: string) {
  const value = Number(text(form, name));
  return Number.isFinite(value) ? Math.trunc(value) : Number.NaN;
}

/** "Kantor, Acara formal" jadi ["Kantor", "Acara formal"]. Entri kosong dibuang. */
function list(form: FormData, name: string) {
  return text(form, name)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Note dikirim sebagai lima larik sejajar, bukan satu blob JSON, supaya form
 * tetap berupa field HTML biasa dan tiap barisnya bisa divalidasi sendiri.
 */
function parseNotes(form: FormData) {
  const names = form.getAll("note_name").map(String);
  const layers = form.getAll("note_layer").map(String);
  const onsets = form.getAll("note_onset").map(String);
  const peaks = form.getAll("note_peak").map(String);
  const fades = form.getAll("note_fade").map(String);

  const notes: { name: string; layer: Layer; onset: number; peak: number; fade: number }[] = [];

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index]?.trim();
    if (!name) continue; // baris yang dikosongkan dianggap dihapus

    const layer = layers[index];
    if (!LAYERS.includes(layer as Layer)) {
      return { error: `Baris note "${name}" punya lapisan yang tidak dikenal.` } as const;
    }

    const onset = Number(onsets[index]);
    const peak = Number(peaks[index]);
    const fade = Number(fades[index]);
    if (![onset, peak, fade].every((value) => Number.isFinite(value) && value >= 0)) {
      return { error: `Waktu pada note "${name}" harus berupa angka menit, minimal 0.` } as const;
    }
    if (!(onset <= peak && peak <= fade)) {
      return {
        error: `Note "${name}": urutannya harus onset ≤ puncak ≤ habis. Sekarang ${onset} / ${peak} / ${fade}.`,
      } as const;
    }

    notes.push({ name, layer: layer as Layer, onset, peak, fade });
  }

  return { notes } as const;
}

function parseSizes(form: FormData) {
  const sizes: { ml: Size; price: number }[] = [];

  for (const ml of [30, 50] as Size[]) {
    const price = integer(form, `price_${ml}`);
    if (Number.isNaN(price) || price === 0) continue; // dikosongkan = ukuran tidak dijual
    if (price < 0) return { error: `Harga ${ml} ml tidak boleh negatif.` } as const;
    sizes.push({ ml, price });
  }

  if (sizes.length === 0) {
    return { error: "Minimal satu ukuran harus punya harga." } as const;
  }
  return { sizes } as const;
}

export async function simpanVarian(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const slug = text(form, "slug");
  if (!slug) return { error: "Varian tidak dikenali." };

  const name = text(form, "name");
  if (!name) return { error: "Nama varian tidak boleh kosong." };

  const category = text(form, "category");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Kategori harus For Him atau For Her." };
  }

  const sillage = text(form, "sillage");
  if (!SILLAGES.includes(sillage as (typeof SILLAGES)[number])) {
    return { error: "Sillage harus Lembut, Sedang, atau Kuat." };
  }

  for (const field of ["juice", "atmosphere_from", "atmosphere_to"]) {
    if (!HEX.test(text(form, field))) {
      return { error: `Warna pada ${field} harus format heksadesimal, misalnya #c98a3c.` };
    }
  }

  const longevityMin = integer(form, "longevity_min");
  const longevityMax = integer(form, "longevity_max");
  if (!(longevityMin > 0) || !(longevityMax >= longevityMin)) {
    return {
      error: "Ketahanan harus lebih dari 0 jam, dan batas atas tidak boleh di bawah batas bawah.",
    };
  }

  const stock = text(form, "stock_status");
  if (!STOCKS.includes(stock as Stock)) {
    return { error: "Status ketersediaan harus Tersedia, Stok Kosong, atau Preorder." };
  }

  const sizesResult = parseSizes(form);
  if ("error" in sizesResult) return { error: sizesResult.error };

  const notesResult = parseNotes(form);
  if ("error" in notesResult) return { error: notesResult.error };

  const featuredForRaw = text(form, "featured_for");
  const featuredFor = CATEGORIES.includes(featuredForRaw as (typeof CATEGORIES)[number])
    ? featuredForRaw
    : null;

  const sortOrder = integer(form, "sort_order");
  const supabase = await createSupabaseSessionClient();

  // Satu penyimpanan menyentuh enam tabel. Lewat RPC, semuanya berada dalam satu
  // transaksi: kalau ada yang gagal, tidak ada varian yang tertinggal dengan note
  // baru tapi ukuran lama. Pelepasan varian unggulan sebelumnya juga ikut di
  // dalam fungsi itu, jadi tidak ada celah antara dua panggilan terpisah.
  const { error } = await supabase.rpc("simpan_varian", {
    p_slug: slug,
    p_fields: {
      name,
      subtitle: text(form, "subtitle"),
      family: text(form, "family"),
      story: text(form, "story"),
      category,
      sillage,
      juice: text(form, "juice"),
      atmosphere_label: text(form, "atmosphere_label"),
      atmosphere_from: text(form, "atmosphere_from"),
      atmosphere_to: text(form, "atmosphere_to"),
      longevity_min: longevityMin,
      longevity_max: longevityMax,
      featured_for: featuredFor,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      is_published: form.get("is_published") === "on",
      stock_status: stock,
    },
    p_notes: notesResult.notes,
    p_sizes: sizesResult.sizes,
    p_vibes: form.getAll("vibes").map(String),
    p_occasions: list(form, "occasions"),
    p_badges: list(form, "badges"),
  });

  if (error) return { error: `Gagal menyimpan: ${error.message}` };

  updateTag(CATALOG_TAG);
  return { ok: `Perubahan pada ${name} tersimpan.` };
}

/**
 * Membuat varian baru sebagai draf.
 *
 * Hanya empat hal yang diminta di sini; dua puluh field sisanya diisi nilai
 * bawaan oleh fungsi buat_varian di database, dan varian lahir dalam keadaan
 * disembunyikan. Melengkapinya adalah pekerjaan form edit, bukan syarat sebelum
 * varian boleh ada.
 */
export async function buatVarian(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = text(form, "name");
  if (!name) return { error: "Nama varian tidak boleh kosong." };

  const code = text(form, "code");
  if (!code) return { error: "Kode varian tidak boleh kosong, misalnya TB-14." };

  const slug = text(form, "slug");
  if (!SLUG.test(slug)) {
    return {
      error: "Slug hanya boleh huruf kecil, angka, dan tanda hubung. Misalnya midnight-oud.",
    };
  }

  const category = text(form, "category");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Kategori harus For Him atau For Her." };
  }

  const sizesResult = parseSizes(form);
  if ("error" in sizesResult) return { error: sizesResult.error };

  const supabase = await createSupabaseSessionClient();

  const { error } = await supabase.rpc("buat_varian", {
    p_slug: slug,
    p_code: code,
    p_name: name,
    p_category: category,
    p_sizes: sizesResult.sizes,
  });

  // 23505 adalah pelanggaran unique. Dua kolom yang mungkin bentrok hanya slug
  // dan code, dan keduanya diketik sendiri oleh admin, jadi pesannya menyebut
  // keduanya alih-alih menerjemahkan nama constraint Postgres.
  if (error) {
    if (error.code === "23505") {
      return { error: `Slug "${slug}" atau kode "${code}" sudah dipakai varian lain.` };
    }
    return { error: `Gagal membuat varian: ${error.message}` };
  }

  updateTag(CATALOG_TAG);
  redirect(`/admin/${slug}`);
}

/**
 * Menghapus satu varian beserta note, harga, vibe, dan fotonya.
 *
 * Nama pembanding dibaca ulang dari database, bukan diambil dari form. Form bisa
 * dikirim tanpa lewat halaman ini, dan kalau nama yang dibandingkan ikut datang
 * dari pengirimnya, konfirmasi mengetik nama tidak membuktikan apa pun.
 */
export async function hapusVarian(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const slug = text(form, "slug");
  const confirmation = text(form, "confirm");

  const supabase = await createSupabaseSessionClient();

  const { data, error: readError } = await supabase
    .from("products")
    .select("name, photo_path")
    .eq("slug", slug)
    .maybeSingle();

  if (readError) return { error: `Gagal membaca varian: ${readError.message}` };
  if (!data) return { error: "Varian tidak ditemukan." };

  if (confirmation !== data.name) {
    return { error: `Ketik persis "${data.name}" untuk menghapus varian ini.` };
  }

  // Barisnya dihapus lebih dulu. Tabel anak ikut lewat ON DELETE CASCADE, dan
  // foto di Storage menyusul: objek yatim di bucket tidak merusak apa pun,
  // sedangkan baris yang menunjuk foto terhapus akan merusak halaman.
  const { error } = await supabase.from("products").delete().eq("slug", slug);
  if (error) return { error: `Gagal menghapus: ${error.message}` };

  if (data.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([data.photo_path]);

  updateTag(CATALOG_TAG);
  redirect("/admin");
}

export async function unggahFoto(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const slug = text(form, "slug");
  const file = form.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih dulu file fotonya." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { error: `Foto ${mb} MB, melebihi batas 2 MB. Kompres dulu sebelum diunggah.` };
  }
  if (!PHOTO_TYPES.includes(file.type)) {
    return { error: "Format foto harus WebP, JPEG, atau PNG." };
  }

  const extension =
    file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${slug}.${extension}`;

  const supabase = await createSupabaseSessionClient();

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: `Gagal mengunggah: ${uploadError.message}` };

  const { error } = await supabase.from("products").update({ photo_path: path }).eq("slug", slug);

  if (error) return { error: `Foto terunggah tapi gagal dicatat: ${error.message}` };

  updateTag(CATALOG_TAG);
  return { ok: "Foto diperbarui." };
}

export async function hapusFoto(
  _prevState: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const slug = text(form, "slug");
  const path = text(form, "photo_path");
  const supabase = await createSupabaseSessionClient();

  // Kolomnya dikosongkan lebih dulu. Kalau penghapusan objek gagal, situs sudah
  // terlanjur aman menampilkan siluet, bukan menunjuk gambar yang hilang.
  const { error } = await supabase.from("products").update({ photo_path: null }).eq("slug", slug);

  if (error) return { error: `Gagal menghapus: ${error.message}` };
  if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);

  updateTag(CATALOG_TAG);
  return { ok: "Foto dihapus, varian kembali memakai siluet botol." };
}

export async function masuk(_prevState: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");

  if (!email || !password) return { error: "Email dan kata sandi harus diisi." };

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Pesannya sengaja tidak membedakan email tidak terdaftar dari kata sandi
  // salah, supaya halaman ini tidak bisa dipakai menebak alamat email yang ada.
  if (error) return { error: "Email atau kata sandi salah." };

  redirect("/admin");
}

export async function keluar() {
  const supabase = await createSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/masuk");
}
