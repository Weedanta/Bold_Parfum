"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, LayoutGrid, Menu, Plus } from "lucide-react";

import { keluar } from "@/app/admin/actions";
import type { AdminVariant } from "@/app/admin/variants";
import { CATEGORIES, CATEGORY_LABELS, STOCK_LABELS } from "@/lib/products";
import { cn } from "@/lib/utils";

/**
 * Kerangka panel admin.
 *
 * Panel ini sengaja tidak memakai SiteHeader dan SiteFooter. Situs publik
 * menuntun pengunjung menuju satu keputusan membeli, jadi navigasinya sedikit dan
 * lebar. Panel ini kebalikannya: satu pekerjaan yang diulang, berpindah antar
 * varian puluhan kali dalam satu duduk. Sidebar menjawab itu, keranjang dan
 * tautan footer tidak.
 *
 * Client Component karena tiga hal yang memang milik peramban: rute aktif,
 * keadaan buka-tutup laci di layar sempit, dan menutupnya laci itu setelah
 * berpindah halaman. Isi halamannya sendiri tetap dirender di server dan masuk
 * lewat children.
 */
export function AdminShell({
  email,
  variants,
  children,
}: {
  email: string;
  variants: AdminVariant[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Laci ditutup setelah pindah halaman, kalau tidak ia menutupi halaman yang
  // baru saja dibuka. Disetel saat render, bukan di dalam effect: yang diperbaiki
  // adalah state yang jadi basi karena prop berubah, dan React menangani itu
  // dalam satu putaran render tanpa sempat melukis laci yang masih terbuka.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }

  // Esc menutup laci. Di layar sempit laci menutupi hampir seluruh layar, jadi
  // harus ada jalan keluar yang tidak menuntut membidik tombol kecil.
  useEffect(() => {
    if (!drawerOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const sidebar = <Sidebar email={email} variants={variants} pathname={pathname} />;

  return (
    <div className="flex flex-1">
      {/* Sidebar tetap di layar lebar. Sticky, bukan fixed, supaya ia tetap satu
          kolom flex dan konten di sebelahnya tidak perlu diberi margin palsu. */}
      <div className="sticky top-0 hidden h-svh w-72 shrink-0 border-r border-line bg-surface lg:block">
        {sidebar}
      </div>

      {/* Laci untuk layar sempit. */}
      <div className={cn("lg:hidden", drawerOpen ? "" : "pointer-events-none")}>
        <button
          type="button"
          tabIndex={drawerOpen ? 0 : -1}
          aria-hidden={!drawerOpen}
          onClick={() => setDrawerOpen(false)}
          aria-label="Tutup menu panel"
          className={cn(
            "fixed inset-0 z-40 bg-obsidian/80 backdrop-blur-sm transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          id="admin-drawer"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-line bg-surface transition-transform duration-300 ease-[var(--ease-out-soft)]",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Isinya baru dirender saat laci dibuka, supaya seluruh tautan varian
              tidak ikut masuk urutan tab selagi laci tertutup. */}
          {drawerOpen ? sidebar : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas hanya ada di layar sempit: satu-satunya jalan membuka laci. */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-obsidian/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            aria-label="Buka menu panel"
            className="-ml-1 p-2 text-muted transition-colors hover:text-ink"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-lg">Panel katalog</span>
        </div>

        <main className="min-w-0 flex-1 px-5 py-10 md:px-10 md:py-14">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  email,
  variants,
  pathname,
}: {
  email: string;
  variants: AdminVariant[];
  pathname: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-5">
        <Link href="/admin" className="font-display text-lg transition-colors hover:text-gold">
          The Bold
        </Link>
        <span className="font-mono text-label tracking-label text-gold uppercase">Admin</span>
      </div>

      <nav aria-label="Navigasi panel" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <SidebarLink
          href="/admin"
          active={pathname === "/admin"}
          icon={<LayoutGrid className="size-4 shrink-0" />}
        >
          Semua varian
        </SidebarLink>

        <SidebarLink
          href="/admin/baru"
          active={pathname === "/admin/baru"}
          icon={<Plus className="size-4 shrink-0" />}
        >
          Tambah varian
        </SidebarLink>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ExternalLink className="size-4 shrink-0" />
          Lihat situs
        </a>

        {/* Varian dikelompokkan per kategori karena itu pembagian yang sama dengan
            yang dilihat pengunjung, jadi urutannya di sini tidak perlu dihafal
            terpisah. */}
        {CATEGORIES.map((category) => {
          const rows = variants.filter((variant) => variant.category === category);
          if (rows.length === 0) return null;

          return (
            <div key={category} className="mt-7">
              <p className="px-3 font-mono text-label tracking-label text-muted uppercase">
                {CATEGORY_LABELS[category]}
              </p>

              <ul className="mt-2">
                {rows.map((variant) => (
                  <li key={variant.slug}>
                    <SidebarLink
                      href={`/admin/${variant.slug}`}
                      active={pathname === `/admin/${variant.slug}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{variant.name}</span>

                      <span className="flex shrink-0 items-center gap-1.5">
                        {variant.featured_for ? (
                          <Dot className="bg-gold" label="Varian unggulan" />
                        ) : null}
                        {variant.photo_path ? null : (
                          <Dot className="bg-muted/60" label="Belum ada foto" />
                        )}
                        {variant.stock_status === "tersedia" ? null : (
                          <Dot
                            className={
                              variant.stock_status === "preorder"
                                ? "bg-sky-400"
                                : "bg-orange-400"
                            }
                            label={STOCK_LABELS[variant.stock_status]}
                          />
                        )}
                        {variant.is_published ? null : (
                          <Dot className="bg-red-400" label="Disembunyikan" />
                        )}
                      </span>
                    </SidebarLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <form action={keluar} className="shrink-0 border-t border-line px-5 py-4">
        <p className="truncate font-mono text-[11px] text-muted" title={email}>
          {email}
        </p>
        <button
          type="submit"
          className="mt-1 text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 border-l-2 px-3 py-2 text-sm transition-colors",
        active
          ? "border-gold bg-charcoal/40 text-gold"
          : "border-transparent text-muted hover:border-line hover:text-ink",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

/** Penanda status varian. Titik, bukan label, supaya nama varian tetap terbaca. */
function Dot({ className, label }: { className: string; label: string }) {
  return (
    <span className={cn("size-1.5 rounded-full", className)} title={label} aria-label={label} />
  );
}
