import { findInCatalog, type CatalogEntry, type Size } from "@/lib/products";

/**
 * Keranjang tidak menyimpan data produk, hanya slug dan ukuran. Nama dan harga
 * selalu dibaca ulang dari katalog yang sedang berlaku, jadi perubahan harga di
 * Supabase langsung tercermin di keranjang yang sudah tersimpan.
 */
type Catalog = readonly CatalogEntry[];

export const CART_STORAGE_KEY = "thebold.cart.v1";

export type CartItem = { slug: string; ml: Size; qty: number };

export function itemKey(item: Pick<CartItem, "slug" | "ml">) {
  return `${item.slug}-${item.ml}`;
}

/**
 * Membaca isi keranjang tersimpan, membuang entri yang bentuknya tidak dikenal.
 *
 * Sengaja tidak mengecek slug ke katalog: fungsi ini dipanggil saat modul store
 * dimuat, sebelum ada komponen React yang bisa menyediakan katalog. Entri yang
 * slug-nya sudah tidak ada disaring belakangan oleh cartLines(), jadi varian yang
 * ditarik dari katalog tetap tidak pernah tampil di keranjang.
 */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { slug, ml, qty } = entry as Record<string, unknown>;
      if (typeof slug !== "string" || slug.length === 0) return [];
      if (ml !== 30 && ml !== 50) return [];
      const quantity = typeof qty === "number" && Number.isFinite(qty) ? Math.floor(qty) : 0;
      if (quantity < 1) return [];
      return [{ slug, ml, qty: Math.min(quantity, 99) }];
    });
  } catch {
    return [];
  }
}

export function addItem(items: CartItem[], next: CartItem): CartItem[] {
  const key = itemKey(next);
  const existing = items.find((item) => itemKey(item) === key);
  if (!existing) return [...items, { ...next, qty: Math.min(next.qty, 99) }];
  return items.map((item) =>
    itemKey(item) === key ? { ...item, qty: Math.min(item.qty + next.qty, 99) } : item,
  );
}

export function setQty(items: CartItem[], key: string, qty: number): CartItem[] {
  if (qty < 1) return items.filter((item) => itemKey(item) !== key);
  return items.map((item) =>
    itemKey(item) === key ? { ...item, qty: Math.min(qty, 99) } : item,
  );
}

/** Entri yang slug atau ukurannya tidak ada lagi di katalog ikut tersaring di sini. */
export function cartLines(items: CartItem[], catalog: Catalog) {
  return items.flatMap((item) => {
    const product = findInCatalog(catalog, item.slug);
    const size = product?.sizes.find((s) => s.ml === item.ml);
    if (!product || !size) return [];
    return [{ item, product, price: size.price, subtotal: size.price * item.qty }];
  });
}

export function cartTotal(items: CartItem[], catalog: Catalog) {
  return cartLines(items, catalog).reduce((total, line) => total + line.subtotal, 0);
}

/**
 * Dihitung dari cartLines, bukan dari items mentah, supaya lencana di header tidak
 * menghitung varian yang sudah tidak ada di katalog.
 */
export function cartCount(items: CartItem[], catalog: Catalog) {
  return cartLines(items, catalog).reduce((count, line) => count + line.item.qty, 0);
}
