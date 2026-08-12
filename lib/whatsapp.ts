import { site } from "@/lib/site";
import { cartTotal, orderableLines, type CartItem } from "@/lib/cart";
import { formatIDR } from "@/lib/utils";
import type { CatalogEntry, Product, Size } from "@/lib/products";

function waLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Pesan untuk satu varian, dipakai tombol beli instan di PDP dan halaman hasil. */
export function whatsappProductLink(
  product: Pick<Product, "name" | "family" | "sizes" | "stock">,
  ml: Size,
  options?: { fromQuiz?: boolean },
) {
  const size = product.sizes.find((s) => s.ml === ml);
  const lines = [
    `Halo ${site.name}, saya mau pesan:`,
    "",
    `${product.name} (${product.family})`,
    `Ukuran ${ml} ml${size ? `, ${formatIDR(size.price)}` : ""}`,
  ];

  // Preorder disebut di dalam pesannya, bukan cuma di tombol. Yang sampai ke
  // admin adalah teks ini, jadi di sinilah kesepakatannya harus terbaca supaya
  // tidak ada yang mengira barangnya dikirim hari itu juga.
  if (product.stock === "preorder") {
    lines.push("", "Varian ini berstatus PREORDER, saya mengerti pengirimannya menyusul.");
  }

  if (options?.fromQuiz) {
    lines.push("", `Varian ini hasil dari Scent Profiler di ${site.url}`);
  }

  lines.push("", "Mohon info ketersediaan dan ongkos kirimnya. Terima kasih.");
  return waLink(lines.join("\n"));
}

/** Pesan untuk seluruh isi keranjang. */
export function whatsappCartLink(items: CartItem[], catalog: readonly CatalogEntry[]) {
  // Hanya baris yang bisa dipesan. Varian kosong tetap terlihat di laci
  // keranjang, tapi tidak ikut ke WhatsApp: pesanan yang dikirim harus bisa
  // dipenuhi, kalau tidak percakapannya dimulai dengan penolakan.
  const lines = orderableLines(items, catalog);
  const message = [
    `Halo ${site.name}, saya mau pesan:`,
    "",
    ...lines.map(
      (line, index) =>
        `${index + 1}. ${line.product.name}, ${line.item.ml} ml x${line.item.qty}, ${formatIDR(line.subtotal)}`,
    ),
    "",
    `Total: ${formatIDR(cartTotal(items, catalog))}`,
    "",
    "Mohon info ketersediaan dan ongkos kirimnya. Terima kasih.",
  ].join("\n");

  return waLink(message);
}

export function whatsappGeneralLink() {
  return waLink(`Halo ${site.name}, saya mau tanya soal parfumnya.`);
}
