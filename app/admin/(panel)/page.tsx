import Link from "next/link";

import { requireAdmin } from "@/lib/supabase/auth";
import { listVariants } from "@/app/admin/variants";
import { CATEGORY_LABELS, STOCK_LABELS } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Rute di balik login yang membaca cookie sesi; cangkang statis tidak berguna. */
export const instant = false;

export default async function AdminHome() {
  await requireAdmin();
  const rows = await listVariants();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-display font-light">{rows.length} varian</h1>

        <Button asChild>
          <Link href="/admin/baru">Tambah varian</Link>
        </Button>
      </div>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Semua isi varian bisa diubah dari sini: cerita, note aroma, foto botol, harga, urutan
        tampil, ketersediaan stok, dan status tayang. Varian juga bisa ditambah dan dihapus.
      </p>

      <ul className="mt-10 divide-y divide-line/70 border-y border-line">
        {rows.map((row) => (
          <li key={row.slug}>
            <Link
              href={`/admin/${row.slug}`}
              className="-mx-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-3 py-4 transition-colors hover:bg-surface"
            >
              <span className="w-14 font-mono text-xs text-faint">{row.code}</span>
              <span className="font-display text-xl font-light">{row.name}</span>
              <span className="text-caption text-muted">{CATEGORY_LABELS[row.category]}</span>

              <span className="ml-auto flex flex-wrap items-center gap-2">
                {row.featured_for ? <Badge variant="gold">Unggulan</Badge> : null}
                {row.photo_path ? null : <Badge>Tanpa foto</Badge>}
                {row.stock_status === "tersedia" ? null : (
                  <Badge>{STOCK_LABELS[row.stock_status]}</Badge>
                )}
                {row.is_published ? null : (
                  <Badge className="border-red-400/40 bg-red-400/5 text-red-300">
                    Disembunyikan
                  </Badge>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
