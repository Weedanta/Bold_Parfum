import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseSessionClient, requireAdmin } from "@/lib/supabase/auth";
import { publicPhotoUrl } from "@/lib/supabase/server";
import { ProductForm, type AdminProduct } from "@/components/admin/product-form";
import { PhotoPanel } from "@/components/admin/photo-panel";
import { DangerZone } from "@/components/admin/danger-zone";

/** Sama seperti /admin: rute di balik login, cangkang statis tidak berguna. */
export const instant = false;

const COLUMNS = `
  slug, code, name, subtitle, category, family, juice,
  atmosphere_label, atmosphere_from, atmosphere_to, story,
  longevity_min, longevity_max, sillage, photo_path, featured_for,
  sort_order, is_published, stock_status,
  product_notes (position, name, layer, onset, peak, fade),
  product_sizes (ml, price),
  product_vibes (vibe),
  product_occasions (position, label),
  product_badges (position, label)
`;

type Positioned = { position: number };

/** PostgREST tidak menjamin urutan baris tersemat, jadi diurutkan di sini. */
function byPosition<T extends Positioned>(rows: T[] | null | undefined): T[] {
  return [...(rows ?? [])].sort((a, b) => a.position - b.position);
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Gagal membaca varian: ${error.message}`);
  if (!data) notFound();

  // Tabel anak diratakan di sini supaya ProductForm tetap menerima satu objek
  // datar. Bentuk tiap barisnya sudah dijaga enum dan CHECK constraint, jadi di
  // sini cukup diurutkan; validasi yang sebenarnya terjadi saat menyimpan.
  const row = data as unknown as Record<string, never> & {
    product_notes: (Positioned & AdminProduct["notes"][number])[];
    product_sizes: AdminProduct["sizes"];
    product_vibes: { vibe: AdminProduct["vibes"][number] }[];
    product_occasions: (Positioned & { label: string })[];
    product_badges: (Positioned & { label: string })[];
  };

  const product: AdminProduct = {
    ...(data as unknown as AdminProduct),
    notes: byPosition(row.product_notes).map(({ name, layer, onset, peak, fade }) => ({
      name,
      layer,
      onset,
      peak,
      fade,
    })),
    sizes: [...(row.product_sizes ?? [])].sort((a, b) => a.ml - b.ml),
    vibes: (row.product_vibes ?? []).map((entry) => entry.vibe),
    occasions: byPosition(row.product_occasions).map((entry) => entry.label),
    badges: byPosition(row.product_badges).map((entry) => entry.label),
  };

  return (
    <div>
      <Link
        href="/admin"
        className="font-mono text-label tracking-label text-muted uppercase transition-colors hover:text-ink"
      >
        &larr; Semua varian
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted">{product.code}</p>
          <h1 className="mt-2 font-display text-display font-light">{product.name}</h1>
        </div>
        <Link
          href={`/koleksi/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gold underline-offset-4 hover:underline"
        >
          Lihat di situs
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        {/* Penghapusan berada di bawah form, bukan di dalamnya: form HTML tidak
            boleh bersarang, dan menaruhnya di kaki halaman membuat tombolnya jauh
            dari tombol simpan yang dipakai setiap hari. */}
        <div className="min-w-0">
          <ProductForm product={product} />
          <DangerZone slug={product.slug} name={product.name} />
        </div>

        <div className="lg:sticky lg:top-8 lg:mt-10">
          <PhotoPanel
            slug={product.slug}
            photoPath={product.photo_path}
            photoUrl={product.photo_path ? publicPhotoUrl(product.photo_path) : null}
          />
        </div>
      </div>
    </div>
  );
}
