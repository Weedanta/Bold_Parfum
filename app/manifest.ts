import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Ikon manifest dilayani lewat rute di app/pwa-icon/[size], karena konvensi
 * icon.tsx hanya menghasilkan satu tag link dan tidak bisa menandai purpose.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}, ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "id",
    dir: "ltr",
    background_color: "#0c0b0a",
    theme_color: "#0c0b0a",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Scent Profiler", short_name: "Kuis", url: "/kuis" },
      { name: "Koleksi Parfum", short_name: "Koleksi", url: "/koleksi" },
    ],
  };
}
