import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin",
  // Panel internal, tidak ada gunanya muncul di hasil pencarian.
  robots: { index: false, follow: false },
};

/**
 * Cangkang terluar panel admin.
 *
 * Sengaja tanpa gaya: kerangka sebenarnya ada satu tingkat di bawah. Rute di
 * balik login memakai AdminShell lengkap dengan sidebar lewat (panel)/layout.tsx,
 * sedangkan /admin/masuk berdiri sendiri tanpa sidebar. Yang berlaku untuk
 * keduanya hanya dua hal di bawah ini.
 *
 * Suspense-nya ada karena dengan Cache Components aktif, pembacaan cookie hanya
 * boleh terjadi saat ada permintaan. Pemeriksaan admin sendiri ada di
 * requireAdmin(), jadi ia ikut berada di dalam batas ini.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <p className="shell py-12 font-mono text-label tracking-label text-muted uppercase">
            Memuat…
          </p>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
