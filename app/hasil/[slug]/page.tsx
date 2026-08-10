import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { site } from "@/lib/site";
import { CATEGORY_LABELS, VIBE_LABELS } from "@/lib/products";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottleImage } from "@/components/bottle-image";
import { ProductPurchase } from "@/components/product-purchase";
import { ScentTimeline } from "@/components/scent-timeline";
import { ShareResult } from "@/components/share-result";
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

  const title = `Aroma signature kamu: ${product.name}`;
  const description = `${product.story} Lihat kurva sillage ${product.name} dan klaim botolmu.`;

  return {
    title,
    description,
    alternates: { canonical: `/hasil/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${site.name}`,
      description,
      url: `/hasil/${product.slug}`,
    },
  };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <div className="shell pt-14 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="group order-2 lg:order-1">
          <BottleImage
            product={product}
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
            className="aspect-4/5 max-h-[62svh] border border-line lg:max-h-none"
          />
        </div>

        <div className="order-1 lg:order-2">
          <p className="font-mono text-label tracking-label text-gold uppercase">
            Hasil Scent Profiler
          </p>

          <h1 className="mt-6 font-display text-display font-light">
            <span className="block text-lg text-muted sm:text-xl">
              Aroma signature kamu adalah
            </span>
            <span className="mt-2 block">{product.name}</span>
          </h1>

          <p className="mt-4 text-lg text-muted">{product.subtitle}</p>

          <ul className="mt-7 flex flex-wrap gap-1.5">
            <li>
              <Badge variant="gold" size="md">
                {CATEGORY_LABELS[product.category]}
              </Badge>
            </li>
            <li>
              <Badge size="md">{product.family}</Badge>
            </li>
            {product.vibes.map((vibe) => (
              <li key={vibe}>
                <Badge size="md">{VIBE_LABELS[vibe]}</Badge>
              </li>
            ))}
          </ul>

          <blockquote className="mt-9 border-l-2 border-gold pl-6 font-display text-xl leading-relaxed font-light text-balance">
            {product.story}
          </blockquote>

          <div className="mt-10">
            <ProductPurchase product={product} fromQuiz />
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <ShareResult
              productName={product.name}
              url={`${site.url}/hasil/${product.slug}`}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link href="/kuis" className="text-muted transition-colors hover:text-ink">
              Ulangi tes
            </Link>
            <Link
              href={`/koleksi?kategori=${product.category}`}
              className="text-muted transition-colors hover:text-ink"
            >
              Lihat varian lain
            </Link>
            <Link
              href={`/koleksi/${product.slug}`}
              className="text-muted transition-colors hover:text-ink"
            >
              Halaman lengkap {product.name}
            </Link>
          </div>
        </div>
      </div>

      <section aria-labelledby="kurva-hasil" className="mt-28 md:mt-36">
        <Reveal>
          <p className="font-mono text-label tracking-label text-gold uppercase">
            Kurva sillage
          </p>
          <h2 id="kurva-hasil" className="mt-5 max-w-xl font-display text-display font-light">
            Begini {product.name} bekerja sepanjang hari
          </h2>
        </Reveal>
        <Reveal className="mt-12">
          <ScentTimeline product={product} />
        </Reveal>
      </section>

      <section className="mt-28 md:mt-36">
        <Reveal className="border border-line bg-surface px-8 py-14 text-center md:px-16">
          <p className="font-display text-title font-light text-balance">
            Masih ragu? Bandingkan dengan varian lain di koleksi.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link href="/koleksi">Lihat semua {catalog.length} varian</Link>
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
