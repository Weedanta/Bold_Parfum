"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { useCart } from "@/components/cart-provider";
import { CartSheet } from "@/components/cart-sheet";

const nav = [
  { label: "Koleksi", href: "/koleksi" },
  { label: "Scent Profiler", href: "/kuis" },
  { label: "Tentang", href: "/tentang" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // PRD 5.2 dan 20plan bagian 2: halaman kuis harus bersih tanpa navigasi.
  const isQuiz = pathname === "/kuis";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40">
      {/*
       * Permukaan header dipisah jadi lapisan sendiri.
       *
       * Sebelumnya latar, blur, dan garis batas dipasang lewat pergantian kelas
       * di elemen header. Warnanya memang ikut transition, tapi backdrop-filter
       * tidak: blurnya menyala seketika, jadi header terasa meloncat pada scroll
       * pertama. Dengan satu lapisan yang hanya berubah opacity, seluruh
       * permukaan (latar, blur, dan hairline sekaligus) datang dan pergi dalam
       * satu gerakan yang sama.
       *
       * inset-0 membuatnya ikut menutupi panel menu mobile saat terbuka, jadi
       * panel itu tidak perlu membawa latarnya sendiri.
       */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 border-b bg-obsidian/85 backdrop-blur-xl transition-opacity duration-500 ease-[var(--ease-out-soft)]",
          scrolled || menuOpen
            ? "border-line opacity-100"
            : "border-transparent opacity-0",
        )}
      />

      <div className="shell relative flex h-16 items-center justify-between gap-6 md:h-20">
        <Link
          href="/"
          className="font-display text-xl tracking-tight transition-colors hover:text-gold"
        >
          {site.name}
        </Link>

        {isQuiz ? (
          <Link
            href="/"
            className="font-mono text-label tracking-label text-muted uppercase transition-colors hover:text-ink"
          >
            Keluar
          </Link>
        ) : (
          <>
            <nav aria-label="Navigasi utama" className="hidden md:block">
              <ul className="flex items-center gap-9">
                {nav.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "text-sm transition-colors",
                          active ? "text-gold" : "text-muted hover:text-ink",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cart.open}
                className="flex items-center gap-2 p-2 text-muted transition-colors hover:text-ink"
                aria-label={`Buka keranjang, ${cart.count} item`}
              >
                <ShoppingBag className="size-5" />
                <span className="min-w-3 font-mono text-xs text-gold">
                  {cart.count || ""}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="relative size-9 p-2 text-muted transition-colors hover:text-ink md:hidden"
                aria-expanded={menuOpen}
                aria-controls="menu-mobile"
                aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              >
                <Menu
                  className={cn(
                    "absolute top-2 left-2 size-5 transition-all duration-300 ease-[var(--ease-out-soft)]",
                    menuOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "absolute top-2 left-2 size-5 transition-all duration-300 ease-[var(--ease-out-soft)]",
                    menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
                  )}
                />
              </button>
            </div>
          </>
        )}
      </div>

      <nav
        id="menu-mobile"
        aria-label="Navigasi utama mobile"
        aria-hidden={!menuOpen}
        className={cn(
          "relative grid border-line transition-[grid-template-rows,border-color,opacity] duration-350 ease-[var(--ease-out-soft)] md:hidden",
          menuOpen
            ? "grid-rows-[1fr] border-t opacity-100 pointer-events-auto"
            : "grid-rows-[0fr] border-t-transparent opacity-0 pointer-events-none",
        )}
      >
        <div className="overflow-hidden">
          <ul className="shell flex flex-col divide-y divide-line/40 py-2">
            {nav.map((item, index) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li
                  key={item.href}
                  className="transition-all duration-400 ease-[var(--ease-out-soft)]"
                  style={{
                    transitionDelay: menuOpen ? `${index * 60 + 80}ms` : "0ms",
                    transform: menuOpen ? "translateY(0)" : "translateY(12px)",
                    opacity: menuOpen ? 1 : 0,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between py-4 font-display text-2xl transition-colors hover:text-gold",
                      active ? "text-gold" : "text-ink",
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-label tracking-label text-muted/60 uppercase">
                      0{index + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <CartSheet />
    </header>
  );
}
