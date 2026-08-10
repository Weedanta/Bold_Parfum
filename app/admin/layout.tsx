import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin",
  // Panel internal, tidak ada gunanya muncul di hasil pencarian.
  robots: { index: false, follow: false },
};

/**
 * Cangkang panel admin.
 *
 * Isinya dibungkus Suspense karena setiap halaman admin membaca cookie sesi, dan
 * dengan Cache Components aktif pembacaan itu hanya boleh terjadi saat ada
 * permintaan. Pemeriksaan admin sendiri ada di requireAdmin() pada tiap halaman,
 * jadi ia ikut berada di dalam batas ini.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell py-12 md:py-16">
      <Suspense
        fallback={
          <p className="font-mono text-label tracking-label text-muted uppercase">Memuat…</p>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
