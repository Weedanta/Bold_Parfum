import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/supabase/auth";
import { LoginForm } from "@/components/admin/login-form";

/** Halaman ini membaca cookie sesi, jadi tidak ada yang bisa diprerender. */
export const instant = false;

/**
 * Satu-satunya rute admin tanpa sidebar, dan itu disengaja: sidebar berisi daftar
 * varian dan tombol keluar, yang belum punya arti sebelum ada yang masuk. Jadi
 * halaman ini membawa tata letaknya sendiri, sebuah kartu di tengah layar.
 */
export default async function LoginPage() {
  // Yang sudah masuk tidak perlu melihat form ini lagi.
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 sm:p-9">
        <h1 className="font-display text-title font-light">Masuk ke panel katalog</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hanya akun yang terdaftar sebagai admin yang bisa mengubah katalog.
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
