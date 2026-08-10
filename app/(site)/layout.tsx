import { getCatalogEntries } from "@/lib/catalog";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CatalogProvider } from "@/components/catalog-provider";
import { CartProvider } from "@/components/cart-provider";
import { TimeField } from "@/components/motion/time-field";

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
 * Kerangka situs publik.
 *
 * Grup (site) tidak muncul di URL: /koleksi tetap /koleksi. Gunanya hanya memberi
 * batas, supaya header, footer, keranjang, dan bidang ukur latar berhenti di rute
 * etalase dan tidak ikut terbawa ke /admin.
 *
 * Katalog dibaca sekali di sini, bukan di tiap halaman: keranjang di header ada
 * di semua rute publik, jadi daftar ringkasnya memang harus tersedia di mana
 * saja. Pembacaannya sendiri di-cache di getCatalog(), jadi ini tidak menambah
 * query per navigasi.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalogEntries();

  return (
    <>
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
    </>
  );
}
