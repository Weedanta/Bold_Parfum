import { requireAdmin } from "@/lib/supabase/auth";
import { listVariants } from "@/app/admin/variants";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Grup (panel): rute admin yang sudah melewati login.
 *
 * Halaman masuk sengaja berada di luar grup ini. Sidebar berisi daftar varian dan
 * tombol keluar, dua hal yang belum punya arti sebelum ada yang masuk, jadi
 * batasnya ditarik di sini alih-alih di tiap halaman.
 *
 * requireAdmin() di sini tidak menggantikan pemeriksaan di tiap halaman. Layout
 * hanya dirender ulang saat pohonnya berubah, jadi ia bukan tempat menaruh
 * satu-satunya penjaga.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const variants = await listVariants();

  return (
    <AdminShell email={session.email} variants={variants}>
      {children}
    </AdminShell>
  );
}
