import Link from "next/link";

import { keluar } from "@/app/admin/actions";
import { createSupabaseSessionClient, requireAdmin } from "@/lib/supabase/auth";
import { CATEGORY_LABELS, type Category } from "@/lib/products";

/** Sama seperti /admin/[slug]: rute di balik login, cangkang statis tidak berguna. */
export const instant = false;

type Row = {
  slug: string;
  code: string;
  name: string;
  category: Category;
  is_published: boolean;
  photo_path: string | null;
  featured_for: Category | null;
  sort_order: number;
};

export default async function AdminHome() {
  const session = await requireAdmin();
  const supabase = await createSupabaseSessionClient();

  // Dibaca lewat klien sesi, bukan getCatalog(), karena admin perlu melihat
  // varian yang disembunyikan juga, dan hasilnya tidak boleh ikut ter-cache
  // bersama katalog publik.
  const { data, error } = await supabase
    .from("products")
    .select("slug, code, name, category, is_published, photo_path, featured_for, sort_order")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) throw new Error(`Gagal membaca katalog: ${error.message}`);
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-label tracking-label text-gold uppercase">Panel katalog</p>
          <h1 className="mt-5 font-display text-display font-light">{rows.length} varian</h1>
        </div>

        <form action={keluar} className="text-right">
          <p className="font-mono text-xs text-muted">{session.email}</p>
          <button
            type="submit"
            className="mt-1 text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Keluar
          </button>
        </form>
      </div>

      <p className="mt-4 max-w-xl text-sm text-muted">
        Varian tidak bisa ditambah atau dihapus dari sini, dan batas itu dijaga database. Yang bisa
        diubah: seluruh isi varian, foto botol, harga, urutan tampil, dan status tayang.
      </p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {rows.map((row) => (
          <li key={row.slug}>
            <Link
              href={`/admin/${row.slug}`}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4 transition-colors hover:text-gold"
            >
              <span className="font-mono text-xs text-muted">{row.code}</span>
              <span className="font-display text-xl">{row.name}</span>

              <span className="font-mono text-label tracking-label text-muted uppercase">
                {CATEGORY_LABELS[row.category]}
              </span>

              <span className="ml-auto flex flex-wrap items-center gap-2 font-mono text-[11px]">
                {row.featured_for ? (
                  <span className="border border-gold px-2 py-0.5 text-gold">Unggulan</span>
                ) : null}
                {row.photo_path ? null : (
                  <span className="border border-line px-2 py-0.5 text-muted">Tanpa foto</span>
                )}
                {row.is_published ? null : (
                  <span className="border border-red-400/50 px-2 py-0.5 text-red-400">
                    Disembunyikan
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
