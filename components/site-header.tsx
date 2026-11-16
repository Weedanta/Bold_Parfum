"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { whatsappGeneralLink } from "@/lib/whatsapp";
import { useCart } from "@/components/cart-provider";
import { CartSheet } from "@/components/cart-sheet";

const nav = [
  { label: "Koleksi", href: "/koleksi" },
  { label: "Scent Profiler", href: "/kuis" },
  { label: "Tentang", href: "/tentang" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

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

  // Menu mobile menutupi seluruh layar. Halaman di belakangnya dikunci supaya
  // usapan jari tidak menggulir sesuatu yang tidak terlihat, dan Esc menutupnya
  // untuk yang memakai papan ketik.
  useEffect(() => {
    if (!menuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40">
      <div className="shell relative flex h-16 items-center md:h-20">
        {/*
         * Bilah navigasi berbentuk pil yang melayang di dalam tinggi header.
         *
         * Permukaannya tetap lapisan tersendiri yang hanya berubah opacity.
         * backdrop-filter tidak ikut transition, jadi kalau blur dipasang lewat
         * pergantian kelas, ia menyala seketika dan header terasa meloncat pada
         * scroll pertama. Dengan satu lapisan, latar, blur, dan garis tepi datang
         * dalam satu gerakan yang sama.
         *
         * Di puncak halaman pil ini tidak punya permukaan sama sekali, supaya
         * hero yang menembus ke belakang header terbaca utuh.
         */}
        <div
          className={cn(
            "relative isolate grid h-12 w-full grid-cols-[1fr_auto] items-center gap-4 rounded-full transition-[padding] duration-700 ease-[var(--ease-out-soft)] md:h-14 md:grid-cols-[1fr_auto_1fr]",
            scrolled && !menuOpen ? "px-4 md:px-6" : "px-0",
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 -z-10 rounded-full border border-line/80 bg-obsidian/70 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)]",
              scrolled && !menuOpen ? "scale-100 opacity-100" : "scale-[0.98] opacity-0",
            )}
          />

          <Link
            href="/"
            className="justify-self-start font-display text-xl font-light tracking-tight transition-colors duration-300 hover:text-gold-bright md:text-[1.4rem]"
          >
            {site.name}
          </Link>

          {isQuiz ? (
            <Link
              href="/"
              className="link-sweep justify-self-end pb-0.5 text-sm text-muted hover:text-ink md:col-start-3"
            >
              Keluar
            </Link>
          ) : (
            <>
              <nav aria-label="Navigasi utama" className="hidden md:block">
                <ul className="flex items-center gap-10">
                  {nav.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href} className="relative">
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "link-sweep pb-0.5 text-sm tracking-[0.01em]",
                            active ? "text-ink" : "text-muted hover:text-ink",
                          )}
                        >
                          {item.label}
                        </Link>
                        {/* Penanda halaman aktif cukup satu titik kecil. Garis
                            bawah sudah dipakai sebagai gerakan hover, jadi
                            memakainya juga untuk keadaan diam akan membuat
                            keduanya tidak bisa dibedakan. */}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-2.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="flex items-center justify-self-end gap-1">
                <button
                  type="button"
                  onClick={cart.open}
                  className="group flex h-11 items-center gap-2.5 rounded-full px-3 text-muted transition-colors hover:text-ink"
                  aria-label={`Buka keranjang, ${cart.count} item`}
                >
                  <span className="hidden text-sm md:inline">Keranjang</span>
                  <span className="relative">
                    <ShoppingBag className="size-5 transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5" />
                    {/* Angka hanya muncul saat ada isi. Lingkaran kosong berisi
                        nol hanya menambah satu benda lagi untuk dibaca. */}
                    {cart.count > 0 ? (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-bright px-1 font-mono text-[10px] leading-none text-obsidian">
                        {cart.count}
                      </span>
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="relative -mr-2 flex size-11 items-center justify-center text-muted transition-colors hover:text-ink md:hidden"
                  aria-expanded={menuOpen}
                  aria-controls="menu-mobile"
                  aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                >
                  {/* Dua garis yang berputar menjadi silang. Ikon bawaan pustaka
                      tidak bisa berubah bentuk, hanya bertukar. */}
                  <span aria-hidden="true" className="relative block h-3 w-6">
                    <span
                      className={cn(
                        "absolute left-0 block h-px w-6 bg-current transition-transform duration-500 ease-[var(--ease-in-out-silk)]",
                        menuOpen ? "top-1.5 rotate-45" : "top-0",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute left-0 block h-px bg-current transition-[transform,width] duration-500 ease-[var(--ease-in-out-silk)]",
                        menuOpen ? "top-1.5 w-6 -rotate-45" : "top-3 w-4",
                      )}
                    />
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isQuiz ? null : (
        <MobileMenu open={menuOpen} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
      )}

      <CartSheet />
    </header>
  );
}

/**
 * Menu layar penuh untuk layar sempit.
 *
 * Tirainya turun lewat clip-path, lalu tiap tautan naik dari balik tepinya
 * sendiri dengan jeda bertingkat. Semuanya transition CSS, bukan GSAP: yang
 * berganti hanya dua keadaan, buka dan tutup, dan transition bisa dibalik di
 * tengah jalan tanpa perlu membatalkan timeline.
 *
 * Saat tertutup panelnya diberi `inert`, jadi tautannya tidak bisa dijangkau
 * Tab maupun pembaca layar walau tetap ada di DOM.
 */
function MobileMenu({
  open,
  pathname,
  onNavigate,
}: {
  open: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const secondary = [
    { label: "WhatsApp", href: whatsappGeneralLink() },
    { label: "Instagram", href: site.social.instagram },
    { label: "TikTok", href: site.social.tiktok },
  ];

  return (
    <nav
      id="menu-mobile"
      aria-label="Navigasi utama mobile"
      inert={!open}
      className={cn(
        "fixed inset-0 -z-10 flex flex-col bg-obsidian transition-[clip-path] duration-700 ease-[var(--ease-in-out-silk)] md:hidden",
        open
          ? "pointer-events-auto [clip-path:inset(0_0_0_0)]"
          : "pointer-events-none [clip-path:inset(0_0_100%_0)]",
      )}
    >
      {/* Cahaya hangat samar di pojok, supaya layar penuh hitam terasa seperti
          ruangan, bukan halaman kosong. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 -right-1/3 size-[120vw] rounded-full bg-[radial-gradient(closest-side,rgb(201_178_138/0.12),transparent_70%)]"
      />

      <div className="shell relative flex flex-1 flex-col justify-between pt-28 pb-10">
        <ul className="flex flex-col gap-1">
          {nav.map((item, index) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="overflow-hidden pb-1">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-baseline gap-4 font-display text-[clamp(2.75rem,13vw,4.25rem)] leading-[1.05] font-light tracking-[-0.03em] transition-[transform,color] duration-700 ease-[var(--ease-out-soft)]",
                    active ? "text-gold-bright" : "text-ink active:text-gold-bright",
                    open ? "translate-y-0" : "translate-y-full",
                  )}
                  style={{ transitionDelay: open ? `${index * 80 + 260}ms` : "0ms" }}
                >
                  <span className={cn(active && "italic")}>{item.label}</span>
                  {active ? (
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "hairline flex flex-col gap-5 pt-6 transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)]",
            open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
          style={{ transitionDelay: open ? "560ms" : "0ms" }}
        >
          <p className="max-w-xs text-caption text-muted">
            Pertanyaan soal aroma atau pesanan dijawab langsung oleh tim kami.
          </p>
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {secondary.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-1.5 text-sm text-ink"
                >
                  {link.label}
                  <ArrowUpRight className="size-3.5 text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
