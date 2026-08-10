import Link from "next/link";

import { site } from "@/lib/site";
import { whatsappGeneralLink } from "@/lib/whatsapp";

const columns = [
  {
    title: "Belanja",
    links: [
      { label: "Semua koleksi", href: "/koleksi" },
      { label: "For Him", href: "/koleksi?kategori=pria" },
      { label: "For Her", href: "/koleksi?kategori=wanita" },
      { label: "Scent Profiler", href: "/kuis" },
    ],
  },
  {
    title: "Brand",
    links: [
      { label: "Tentang The Bold", href: "/tentang" },
      { label: "Pertanyaan umum", href: "/tentang#faq" },
      { label: "Kebijakan pengembalian", href: "/tentang#pengembalian" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="hairline mt-32">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl tracking-tight">{site.name}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Kami meracik identitas, bukan sekadar aroma. Setiap botol dirancang untuk menemani
            langkah berani Anda.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="font-mono text-label tracking-label text-gold uppercase">
              {column.title}
            </p>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="font-mono text-label tracking-label text-gold uppercase">Terhubung</p>
          <ul className="mt-5 space-y-3">
            <li>
              <a
                href={whatsappGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={site.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell flex flex-col gap-2 border-t border-line py-6 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {site.name}. Semua hak dilindungi.
        </p>
        <p>Dibuat di Indonesia</p>
      </div>
    </footer>
  );
}
