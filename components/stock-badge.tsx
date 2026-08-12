import { STOCK_LABELS, type Stock } from "@/lib/products";
import { Badge } from "@/components/ui/badge";

/**
 * Penanda ketersediaan varian.
 *
 * Tidak menggambar apa pun saat varian tersedia. Status normal tidak perlu
 * diumumkan, dan menandainya justru membuat dua status lain kehilangan bobot:
 * kalau semua varian berlencana, tidak ada lencana yang berarti.
 *
 * Dipakai kartu katalog, kartu unggulan, dan halaman produk supaya ketiganya
 * memakai kata dan warna yang sama untuk keadaan yang sama.
 */
export function StockBadge({ stock, className }: { stock: Stock; className?: string }) {
  if (stock === "tersedia") return null;

  return (
    <Badge variant={stock === "preorder" ? "solid" : "default"} className={className}>
      {STOCK_LABELS[stock]}
    </Badge>
  );
}
