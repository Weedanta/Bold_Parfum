import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowUpRight } from "lucide-react";

import { site } from "@/lib/site";
import { whatsappGeneralLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";

/*
 * Kelompok tautan tanpa judul kolom. Pengelompokannya dibaca dari jarak, dan
 * label untuk pembaca layar tetap ada lewat aria-label pada tiap nav.
 */
const groups = [
  {
    label: "Belanja",
    links: [
      { label: "Semua koleksi", href: "/koleksi" },
      { label: "For Him", href: "/koleksi?kategori=pria" },
      { label: "For Her", href: "/koleksi?kategori=wanita" },
      { label: "Scent Profiler", href: "/kuis" },
    ],
  },
  {
    label: "Brand",
    links: [
      { label: "Tentang The Bold", href: "/tentang" },
      { label: "Pertanyaan umum", href: "/tentang#faq" },
      { label: "Kebijakan pengembalian", href: "/tentang#pengembalian" },
    ],
  },
];

const social = [
  { label: "Instagram", href: site.social.instagram },
  { label: "TikTok", href: site.social.tiktok },
];

/**
 * Footer sama untuk semua pengunjung, dan satu-satunya nilai yang berubah adalah
 * tahun hak cipta. Dengan Cache Components aktif, `new Date()` tidak boleh dibaca
 * saat prerender karena hasilnya bisa berbeda antar render. Memberi footer masa
 * berlaku harian menyelesaikannya tanpa membuat halaman jadi dinamis: tahunnya
 * ikut berganti sendiri tanpa perlu build ulang.
 *
 * Footer tetap Server Component. Gerakannya datang dari dua anak client yang
 * sudah ada, Reveal dan HeadingReveal, yang menerima isi dari server apa adanya.
 */
export async function SiteFooter() {
  "use cache";
  cacheLife("days");

  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line bg-surface/40">
      {/* Cahaya champagne samar dari bawah, supaya penutup halaman terasa
          seperti lampu ruangan yang diredupkan, bukan pita hitam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[70%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(201_178_138/0.09),transparent)]"
      />

      <div className="shell relative pt-20 md:pt-28">
        <Reveal
          stagger={0.08}
          className="grid gap-16 md:grid-cols-12 md:gap-x-10 lg:gap-x-16"
        >
          <div className="md:col-span-6 lg:col-span-5">
            <p className="max-w-[14ch] font-display text-display font-light">
              Ragu memilih? <span className="text-gold-bright italic">Tanyakan</span> saja.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Pertanyaan soal aroma, ukuran, atau pesanan dijawab langsung oleh tim kami lewat
              WhatsApp.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer">
                Chat lewat WhatsApp
                <ArrowUpRight />
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8 lg:pt-3">
            {groups.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <ul className="space-y-3.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-sweep pb-0.5 text-[0.95rem] text-muted hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav aria-label="Media sosial" className="col-span-2">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {social.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-[0.95rem] text-ink"
                    >
                      <span className="link-sweep pb-0.5">{link.label}</span>
                      <ArrowUpRight className="size-3.5 text-muted transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Reveal>

        <div className="mt-24 flex flex-col gap-1.5 text-caption text-faint sm:flex-row sm:items-center sm:justify-between md:mt-32">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. Semua hak dilindungi.
          </p>
          <p>Dibuat di Indonesia</p>
        </div>

        {/* Nama rumah sebagai penutup. Sengaja selebar layar dan tipis: yang
            berat adalah ukurannya, bukan ketebalan hurufnya. */}
        <HeadingReveal
          as="p"
          start="top bottom"
          className="mt-6 pb-4 font-display text-[clamp(4.5rem,21vw,19rem)] leading-[0.82] font-light tracking-[-0.05em] whitespace-nowrap text-ink md:mt-8"
        >
          {site.name}
        </HeadingReveal>
      </div>
    </footer>
  );
}
