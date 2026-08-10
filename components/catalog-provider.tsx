"use client";

import { createContext, useContext } from "react";

import { findInCatalog, type CatalogEntry } from "@/lib/products";

/**
 * Menyalurkan katalog dari server ke komponen client.
 *
 * Kuis dan keranjang butuh seluruh katalog secara sinkron: kuis harus menilai
 * semua varian dalam satu kategori untuk memilih pemenang, dan keranjang harus
 * mencari nama serta harga tiap slug yang tersimpan di localStorage. Keduanya
 * berjalan di browser, sementara Supabase asinkron.
 *
 * Layout server membaca katalog sekali lalu menaruhnya di sini, jadi tidak ada
 * komponen client yang perlu menunggu jaringan, dan tidak ada state loading di
 * jalur yang seharusnya seketika.
 *
 * Yang dikirim hanya CatalogEntry, bukan Product utuh, supaya `notes` dan
 * `story` tiap varian tidak ikut diserialisasi ke setiap halaman.
 */

const CatalogContext = createContext<readonly CatalogEntry[] | null>(null);

export function CatalogProvider({
  catalog,
  children,
}: {
  catalog: readonly CatalogEntry[];
  children: React.ReactNode;
}) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog harus dipakai di dalam CatalogProvider");
  return catalog;
}

export function useCatalogEntry(slug: string | undefined) {
  const catalog = useCatalog();
  return slug ? findInCatalog(catalog, slug) : undefined;
}
