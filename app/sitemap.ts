import type { MetadataRoute } from "next";

import { site } from "@/lib/site";
import { getCatalog } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/koleksi`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/kuis`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/tentang`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${site.url}/koleksi/${product.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Halaman hasil kuis dirender statis, jadi layak diindeks: tiap halaman
  // menjawab pencarian "parfum untuk karakter ..." dengan satu varian konkret.
  const resultRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${site.url}/hasil/${product.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...resultRoutes];
}
