import Link from "next/link";

import { requireAdmin } from "@/lib/supabase/auth";
import { NewVariantForm } from "@/components/admin/new-variant-form";

/** Sama seperti rute panel lain: di balik login, cangkang statis tidak berguna. */
export const instant = false;

export default async function NewVariantPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin"
        className="font-mono text-label tracking-label text-muted uppercase transition-colors hover:text-ink"
      >
        &larr; Semua varian
      </Link>

      <h1 className="mt-6 font-display text-display font-light">Varian baru</h1>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        Isi yang paling dasar dulu. Cerita, note aroma, warna, dan foto botol diisi di halaman
        berikutnya, yang langsung terbuka begitu varian ini tersimpan.
      </p>

      <NewVariantForm />
    </div>
  );
}
