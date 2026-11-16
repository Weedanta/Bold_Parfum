"use client";

import { useActionState, useState } from "react";

import { buatVarian, type ActionState } from "@/app/admin/actions";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/products";
import { Field, Select, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

/**
 * Mengubah "Midnight Oud" menjadi "midnight-oud".
 *
 * Sengaja hanya membuang yang jelas tidak boleh ada di URL, bukan mentransliterasi
 * apa pun. Nama varian di sini selalu ASCII, dan slug yang ditebak terlalu pintar
 * lebih sulit diprediksi admin daripada slug yang bisa ia perbaiki sendiri.
 */
function keSlug(nama: string) {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Form varian baru.
 *
 * Empat pertanyaan saja. Sisanya diisi nilai bawaan di database dan dilengkapi di
 * form edit, yang langsung terbuka begitu varian ini tersimpan.
 *
 * Slug ikut mengetik bersama nama sampai admin menyentuhnya sendiri. Setelah itu
 * ia berhenti mengikuti: slug yang sudah diperbaiki tangan tidak boleh ditimpa
 * lagi oleh ketikan berikutnya di kolom nama.
 */
export function NewVariantForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(buatVarian, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDisunting, setSlugDisunting] = useState(false);

  return (
    <form action={action} className="mt-10 flex max-w-2xl flex-col gap-10">
      <section className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama">
          <TextInput
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugDisunting) setSlug(keSlug(event.target.value));
            }}
            placeholder="Midnight Oud"
            required
          />
        </Field>

        <Field label="Kode" hint="Nomor urut varian, misalnya TB-14.">
          <TextInput name="code" placeholder="TB-14" required />
        </Field>

        <Field label="Slug" hint="Dipakai di alamat halaman: /koleksi/slug.">
          <TextInput
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugDisunting(true);
            }}
            spellCheck={false}
            required
          />
        </Field>

        <Field label="Koleksi">
          <Select name="category" defaultValue="pria">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <fieldset>
        <legend className="text-base text-ink">Harga</legend>
        <p className="mt-2 text-caption text-muted">
          Rupiah, tanpa titik. Kosongkan salah satunya kalau ukuran itu tidak dijual, tapi
          minimal satu harus terisi.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="30 ml">
            <TextInput name="price_30" type="number" min={0} placeholder="149000" />
          </Field>
          <Field label="50 ml">
            <TextInput name="price_50" type="number" min={0} placeholder="219000" />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Membuat…" : "Buat varian"}
        </Button>

        <p className="text-caption text-faint">
          Varian dibuat dalam keadaan disembunyikan sampai kamu menayangkannya.
        </p>

        {state.error ? (
          <p role="alert" className="w-full text-sm text-red-300">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
