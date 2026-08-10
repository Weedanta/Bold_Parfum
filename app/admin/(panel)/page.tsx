import Link from "next/link";

import { requireAdmin } from "@/lib/supabase/auth";
import { listVariants } from "@/app/admin/variants";
import { CATEGORY_LABELS } from "@/lib/products";

/** Rute di balik login yang membaca cookie sesi; cangkang statis tidak berguna. */
export const instant = false;

export default async function AdminHome() {
  await requireAdmin();
  const rows = await listVariants();

  return (
    <div>
      <p className="font-mono text-label tracking-label text-gold uppercase">Panel katalog</p>
      <h1 className="mt-5 font-display text-display font-light">{rows.length} varian</h1>

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
