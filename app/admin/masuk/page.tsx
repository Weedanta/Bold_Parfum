import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/supabase/auth";
import { LoginForm } from "@/components/admin/login-form";

/** Halaman ini membaca cookie sesi, jadi tidak ada yang bisa diprerender. */
export const instant = false;

export default async function LoginPage() {
  // Yang sudah masuk tidak perlu melihat form ini lagi.
  if (await getAdminSession()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm">
      <p className="font-mono text-label tracking-label text-gold uppercase">Panel katalog</p>
      <h1 className="mt-5 font-display text-title font-light">Masuk</h1>
      <p className="mt-3 text-sm text-muted">
        Hanya akun yang terdaftar sebagai admin yang bisa mengubah katalog.
      </p>

      <LoginForm />
    </div>
  );
}
