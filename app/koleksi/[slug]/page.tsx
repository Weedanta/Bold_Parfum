import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { site } from "@/lib/site";
import { formatIDR } from "@/lib/utils";
import { CATEGORY_LABELS, VIBE_LABELS, lowestPrice } from "@/lib/products";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottleImage } from "@/components/bottle-image";
import { ProductPurchase } from "@/components/product-purchase";
import { ScentTimeline } from "@/components/scent-timeline";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";

export async function generateStaticParams() {
  return (await getCatalog()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.name} · ${product.subtitle}`;
  const description = `${product.story} Keluarga aroma ${product.family}, tahan ${product.longevity[0]}-${product.longevity[1]} jam. Mulai ${formatIDR(lowestPrice(product))}.`;

  return {
    title,
    description,
    alternates: { canonical: `/koleksi/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${site.name}`,
      description,
      url: `/koleksi/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) notFound();

  const related = catalog
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 4);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.story,
    sku: product.code,
    brand: { "@type": "Brand", name: site.name },
    category: product.family,
    offers: product.sizes.map((size) => ({
      "@type": "Offer",
      name: `${product.name} ${size.ml} ml`,
      price: size.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: `${site.url}/koleksi/${product.slug}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: site.url },
      { "@type": "ListItem", position: 2, name: "Koleksi", item: `${site.url}/koleksi` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${site.url}/koleksi/${product.slug}`,
      },
    ],
  };

  const specs = [
    { label: "Longevity", value: `${product.longevity[0]}-${product.longevity[1]} jam` },
    { label: "Sillage", value: product.sillage },
    { label: "Occasion", value: product.occasions.join(", ") },
    { label: "Kode", value: product.code },
  ];

  return (
    <div className="shell pt-10 md:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productLd, breadcrumbLd]) }}
      />

      <nav aria-label="Remah roti" className="font-mono text-[11px] text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/koleksi" className="transition-colors hover:text-ink">
              Koleksi
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gold">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="group">
          <BottleImage
            product={product}
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
            className="aspect-4/5 max-h-[62svh] border border-line lg:max-h-none"
          />
          <p className="mt-4 text-xs text-muted">Suasana aroma: {product.atmosphere.label}.</p>
        </div>

        <div>
          <p className="font-mono text-label tracking-label text-muted uppercase">
            {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-4 font-display text-display font-light">{product.name}</h1>
          <p className="mt-3 text-lg text-muted">{product.subtitle}</p>

          <ul className="mt-7 flex flex-wrap gap-1.5">
            <li>
              <Badge variant="gold" size="md">
                {product.family}
              </Badge>
            </li>
            {product.vibes.map((vibe) => (
              <li key={vibe}>
                <Badge size="md">{VIBE_LABELS[vibe]}</Badge>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-base leading-relaxed">{product.story}</p>

          {/* Spesifikasi dalam register lembar data, kontras dengan serif di atasnya */}
          <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line">
            {specs.map((spec) => (
              <div key={spec.label} className="bg-surface px-5 py-4">
                <dt className="font-mono text-label tracking-label text-muted uppercase">
                  {spec.label}
                </dt>
                <dd className="mt-2 font-mono text-sm text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      <section aria-labelledby="kurva" className="mt-28 md:mt-36">
        <Reveal>
          <p className="font-mono text-label tracking-label text-gold uppercase">
            Kurva sillage
          </p>
          <h2 id="kurva" className="mt-5 max-w-xl font-display text-display font-light">
            Perjalanan {product.name} dalam sehari
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Sentuh nama note mana pun untuk melihat kapan ia muncul dan kapan menghilang.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <ScentTimeline product={product} />
        </Reveal>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="terkait" className="mt-28 md:mt-36">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="terkait" className="font-display text-title font-light">
              Varian lain di {CATEGORY_LABELS[product.category]}
            </h2>
            <Button asChild variant="link">
              <Link href={`/koleksi?kategori=${product.category}`}>Lihat semua</Link>
            </Button>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
