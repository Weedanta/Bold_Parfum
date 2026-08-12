"use client";

import { useActionState } from "react";

import { simpanVarian, type ActionState } from "@/app/admin/actions";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SILLAGES,
  STOCKS,
  STOCK_LABELS,
  VIBES,
  VIBE_LABELS,
  type Category,
  type Note,
  type Sillage,
  type Size,
  type Stock,
  type Vibe,
} from "@/lib/products";
import {
  ColorInput,
  Field,
  NotesEditor,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/form-fields";

/** Baris apa adanya dari database, termasuk kolom yang tidak dipakai situs publik. */
export type AdminProduct = {
  slug: string;
  code: string;
  name: string;
  subtitle: string;
  category: Category;
  family: string;
  vibes: Vibe[];
  juice: string;
  atmosphere_label: string;
  atmosphere_from: string;
  atmosphere_to: string;
  story: string;
  longevity_min: number;
  longevity_max: number;
  sillage: Sillage;
  occasions: string[];
  badges: string[];
  notes: Note[];
  sizes: { ml: Size; price: number }[];
  photo_path: string | null;
  featured_for: Category | null;
  sort_order: number;
  is_published: boolean;
  stock_status: Stock;
};

function priceOf(sizes: AdminProduct["sizes"], ml: Size) {
  return sizes.find((size) => size.ml === ml)?.price ?? "";
}

export function ProductForm({ product }: { product: AdminProduct }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(simpanVarian, {});

  return (
    <form action={action} className="mt-10 flex flex-col gap-10">
      <input type="hidden" name="slug" value={product.slug} />

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama">
          <TextInput name="name" defaultValue={product.name} required />
        </Field>
        <Field label="Tagline">
          <TextInput name="subtitle" defaultValue={product.subtitle} />
        </Field>
        <Field label="Keluarga aroma" hint="Misalnya Fresh Spicy, Woody Niche.">
          <TextInput name="family" defaultValue={product.family} />
        </Field>
        <Field label="Koleksi">
          <Select name="category" defaultValue={product.category}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cerita" className="sm:col-span-2">
          <TextArea name="story" defaultValue={product.story} />
        </Field>
      </section>

      <section>
        <span className="font-mono text-label tracking-label text-muted uppercase">Karakter</span>
        <ul className="mt-3 flex flex-wrap gap-2">
          {VIBES.map((vibe) => (
            <li key={vibe}>
              <label className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-sm transition-colors hover:border-gold">
                <input
                  type="checkbox"
                  name="vibes"
                  value={vibe}
                  defaultChecked={product.vibes.includes(vibe)}
                  className="accent-gold"
                />
                {VIBE_LABELS[vibe]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        <Field label="Warna cairan" hint="Dipakai kurva sillage dan sorotan kartu.">
          <ColorInput name="juice" defaultValue={product.juice} />
        </Field>
        <Field label="Atmosfer, dari">
          <ColorInput name="atmosphere_from" defaultValue={product.atmosphere_from} />
        </Field>
        <Field label="Atmosfer, ke">
          <ColorInput name="atmosphere_to" defaultValue={product.atmosphere_to} />
        </Field>
        <Field
          label="Deskripsi atmosfer"
          className="sm:col-span-3"
          hint="Satu frasa suasana, muncul saat kartu disentuh."
        >
          <TextInput name="atmosphere_label" defaultValue={product.atmosphere_label} />
        </Field>
      </section>

      <section className="grid gap-5 sm:grid-cols-4">
        <Field label="Tahan, minimal (jam)">
          <TextInput
            name="longevity_min"
            type="number"
            min={1}
            defaultValue={product.longevity_min}
          />
        </Field>
        <Field label="Tahan, maksimal (jam)">
          <TextInput
            name="longevity_max"
            type="number"
            min={1}
            defaultValue={product.longevity_max}
          />
        </Field>
        <Field label="Sillage" className="sm:col-span-2">
          <Select name="sillage" defaultValue={product.sillage}>
            {SILLAGES.map((sillage) => (
              <option key={sillage} value={sillage}>
                {sillage}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Harga 30 ml" hint="Kosongkan kalau ukuran ini tidak dijual.">
          <TextInput
            name="price_30"
            type="number"
            min={0}
            defaultValue={priceOf(product.sizes, 30)}
          />
        </Field>
        <Field label="Harga 50 ml" hint="Kosongkan kalau ukuran ini tidak dijual.">
          <TextInput
            name="price_50"
            type="number"
            min={0}
            defaultValue={priceOf(product.sizes, 50)}
          />
        </Field>
        <Field label="Kesempatan pakai" hint="Pisahkan dengan koma." className="sm:col-span-2">
          <TextInput name="occasions" defaultValue={product.occasions.join(", ")} />
        </Field>
        <Field
          label="Label"
          hint="Pisahkan dengan koma. Misalnya Best Seller."
          className="sm:col-span-4"
        >
          <TextInput name="badges" defaultValue={product.badges.join(", ")} />
        </Field>
      </section>

      <section>
        <NotesEditor notes={product.notes} />
      </section>

      <section className="grid gap-5 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Varian unggulan" hint="Hanya satu per koleksi. Yang lama otomatis dilepas.">
          <Select name="featured_for" defaultValue={product.featured_for ?? ""}>
            <option value="">Tidak diunggulkan</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Urutan tampil" hint="Angka kecil tampil lebih dulu.">
          <TextInput name="sort_order" type="number" defaultValue={product.sort_order} />
        </Field>
        {/* Dua sakelar bersebelahan yang sengaja dibedakan namanya. "Tayang"
            menentukan varian muncul atau tidak; "Ketersediaan" menentukan varian
            yang muncul itu bisa dibeli atau tidak. Varian kosong biasanya tetap
            ingin dipajang. */}
        <Field
          label="Ketersediaan"
          hint="Kosong mematikan tombol beli. Preorder tetap bisa dipesan."
        >
          <Select name="stock_status" defaultValue={product.stock_status}>
            {STOCKS.map((stock) => (
              <option key={stock} value={stock}>
                {STOCK_LABELS[stock]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tayang">
          <label className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={product.is_published}
              className="accent-gold"
            />
            Tampilkan di situs
          </label>
        </Field>
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-line bg-obsidian py-5">
        <button
          type="submit"
          disabled={pending}
          className="border border-gold-bright bg-gold-bright px-6 py-2.5 text-sm text-obsidian transition-opacity disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>

        {state.error ? (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p role="status" className="text-sm text-gold">
            {state.ok}
          </p>
        ) : null}
      </div>
    </form>
  );
}
