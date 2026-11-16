import type { Metadata } from "next";
import { Fraunces, Geist, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import { site } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
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
    default: `${site.name}, ${site.tagline}`,
    template: `%s | ${site.name}`,
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
    title: `${site.name}, ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}, ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Cangkang paling luar, sengaja tipis.
 *
 * Yang tersisa di sini hanya yang benar-benar berlaku untuk semua rute: tag html
 * dan body, font, dan metadata dasar. Kerangka situs (header, footer, keranjang)
 * pindah ke app/(site)/layout.tsx, sedangkan panel admin punya kerangkanya
 * sendiri di app/admin/. Keduanya rute yang berbeda sifatnya: satu etalase
 * publik, satu ruang kerja di balik login, dan tidak ada gunanya memaksa
 * keduanya berbagi navigasi.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${geist.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <div aria-hidden="true" className="site-grain" />
      </body>
    </html>
  );
}
