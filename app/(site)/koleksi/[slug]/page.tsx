import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { cn, formatIDR } from "@/lib/utils";
import { site } from "@/lib/site";
import { CATEGORY_LABELS, VIBE_LABELS, lowestPrice } from "@/lib/products";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ScentTimeline } from "@/components/scent-timeline";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/motion/reveal";
import { HeadingReveal } from "@/components/motion/heading-reveal";
import { CharReveal } from "@/components/motion/char-reveal";

/** "harian, kantor, dan acara formal": momen pemakaian dibaca sebagai kalimat. */
const occasionList = new Intl.ListFormat("id", { style: "long", type: "conjunction" });

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

  const title = `${product.name}, ${product.subtitle}`;
  const description = `${product.story} Keluarga aroma ${product.family}, tahan ${product.longevity[0]}-${product.longevity[1]} jam. Mulai ${formatIDR(lowestPrice(product))}.`;

  return {
    title,
    description,
    alternates: { canonical: `/koleksi/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | ${site.name}`,
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

  const occasions = occasionList.format(
    product.occasions.map((occasion) => occasion.toLocaleLowerCase("id")),
  );

  return (
    <div className="shell pt-6 md:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productLd, breadcrumbLd]) }}
      />

      <nav aria-label="Remah roti" className="text-caption text-faint">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link href="/" className="link-sweep transition-colors hover:text-ink">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/koleksi" className="link-sweep transition-colors hover:text-ink">
              Koleksi
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-muted">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-12 md:mt-10 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-20">
        {/* Botol menempel di layar desktop selama kolom kanan dibaca: produknya
            tetap terlihat saat orang menimbang ukuran dan harga. Botolnya sendiri
            hanyut pelan di dalam bidangnya, jadi gambar yang diam tetap hidup. */}
        <div className="lg:col-span-7">
          <div className="group lg:sticky lg:top-24">
            <ProductGallery product={product} />
            <p className="mt-4 text-caption text-muted">
              Suasana aroma:{" "}
              <span className="font-display text-sm text-ink/85 italic">
                {product.atmosphere.label}
              </span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:pt-4">
          <CharReveal
            as="h1"
            trigger="load"
            delay={0.2}
            className="font-display text-statement font-light"
          >
            {product.name}
          </CharReveal>
          <p className="mt-4 font-display text-xl font-light text-muted italic md:text-2xl">
            {product.subtitle}
          </p>

          <Reveal delay={0.35}>
            <p className="mt-10 max-w-md text-[1.0625rem] leading-relaxed text-ink/90">
              {product.story}
            </p>

            <ul className="mt-8 flex flex-wrap gap-1.5">
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
          </Reveal>

          {/* Spesifikasi ditulis sebagai satu angka besar dan satu kalimat, bukan
              tabel empat kotak: longevity adalah alasan orang membeli, jadi ia
              yang diberi ukuran, sisanya cukup diceritakan. */}
          <div className="hairline mt-12 pt-8">
            <p className="flex items-end gap-5">
              <span className="font-display text-[clamp(3.75rem,2.6rem+3.4vw,6rem)] leading-[0.82] font-light tracking-[-0.045em]">
                {product.longevity[0]}-{product.longevity[1]}
              </span>
              <span className="pb-1 text-sm leading-snug text-muted">
                jam bertahan
                <br />
                di kulit
              </span>
            </p>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted">
              Sillage <span className="text-ink">{product.sillage.toLocaleLowerCase("id")}</span>,
              paling pas untuk <span className="text-ink">{occasions}</span>.
            </p>
            <p className="mt-4 text-caption text-faint">
              Kode varian <span className="font-mono text-muted">{product.code}</span>
            </p>
          </div>

          <div className="hairline mt-10 pt-10">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      <section aria-labelledby="kurva" className="mt-28 md:mt-44">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <HeadingReveal
            id="kurva"
            className="font-display text-statement font-light text-balance lg:col-span-8"
          >
            Perjalanan {product.name} <em className="italic">dalam sehari</em>
          </HeadingReveal>
          <p className="max-w-sm text-sm leading-relaxed text-muted lg:col-span-4 lg:justify-self-end lg:pb-3">
            Sentuh nama note mana pun untuk melihat kapan ia muncul dan kapan menghilang.
          </p>
        </div>
        <Reveal className="mt-14 md:mt-20">
          <ScentTimeline product={product} />
        </Reveal>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="terkait" className="hairline mt-24 pt-12 md:mt-32 md:pt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
            <h2 id="terkait" className="font-display text-display font-light">
              Varian {CATEGORY_LABELS[product.category]} lainnya
            </h2>
            <Button asChild variant="link">
              <Link href={`/koleksi?kategori=${product.category}`}>Lihat semua</Link>
            </Button>
          </div>
          {/* Kartu genap turun sedikit, gema dari ritme grid koleksi. */}
          <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 pb-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:pb-16">
            {related.map((item, index) => (
              <Reveal as="li" key={item.slug} delay={index * 0.08}>
                <ProductCard
                  product={item}
                  sizes="(min-width: 1024px) 22vw, 50vw"
                  className={cn(index % 2 === 1 && "translate-y-10 lg:translate-y-14")}
                />
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
