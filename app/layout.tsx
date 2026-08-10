import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { site } from "@/lib/site";
import { getCatalogEntries } from "@/lib/catalog";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProvider } from "@/components/catalog-provider";
import { CartProvider } from "@/components/cart-provider";
import { TimeField } from "@/components/motion/time-field";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "parfum premium",
    "parfum pria",
    "parfum wanita",
    "rekomendasi parfum",
    "kuis parfum",
    "signature scent",
    "The Bold",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/** JSON-LD tingkat situs. Rute lain menambah Product, Breadcrumb, dan FAQ sendiri. */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  description: site.description,
  sameAs: [site.social.instagram, site.social.tiktok],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  inLanguage: "id-ID",
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/koleksi?vibe={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

/**
 * Katalog dibaca sekali di sini, bukan di tiap halaman: keranjang di header ada
 * di semua rute, jadi daftar ringkasnya memang harus tersedia di mana saja.
 * Pembacaannya sendiri di-cache di getCatalog(), jadi ini tidak menambah query
 * per navigasi.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalogEntries();

  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationLd, websiteLd]) }}
        />
        <TimeField />
        <CatalogProvider catalog={catalog}>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
