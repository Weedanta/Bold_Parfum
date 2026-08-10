"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { cartLines, cartTotal, itemKey } from "@/lib/cart";
import { whatsappCartLink } from "@/lib/whatsapp";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/components/cart-provider";
import { useCatalog } from "@/components/catalog-provider";
import { BottleThumb } from "@/components/bottle-image";

export function CartSheet() {
  const cart = useCart();
  const catalog = useCatalog();
  const lines = cartLines(cart.items, catalog);
  const total = cartTotal(cart.items, catalog);

  return (
    <Sheet open={cart.isOpen} onOpenChange={(open) => (open ? cart.open() : cart.close())}>
      <SheetContent aria-describedby={undefined}>
        <div className="flex items-center gap-3 border-b border-line px-6 py-5">
          <ShoppingBag className="size-4 text-gold" />
          <SheetTitle className="font-mono text-label tracking-label uppercase">
            Keranjang
          </SheetTitle>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-sm text-muted">
              Keranjang masih kosong. Mulai dari Scent Profiler kalau belum tahu mau yang mana.
            </p>
            <Button asChild variant="outline" size="sm" onClick={cart.close}>
              <Link href="/kuis">Mulai Scent Profiler</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto">
              {lines.map((line) => {
                const key = itemKey(line.item);
                return (
                  <li key={key} className="flex gap-4 px-6 py-5">
                    <BottleThumb product={line.product} className="size-20 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/koleksi/${line.product.slug}`}
                        onClick={cart.close}
                        className="font-display text-lg transition-colors hover:text-gold"
                      >
                        {line.product.name}
                      </Link>
                      <p className="font-mono text-[11px] text-muted">
                        {line.item.ml} ml &middot; {formatIDR(line.price)}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            aria-label={`Kurangi ${line.product.name}`}
                            onClick={() => cart.updateQty(key, line.item.qty - 1)}
                            className="p-2 text-muted transition-colors hover:text-ink"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs">
                            {line.item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tambah ${line.product.name}`}
                            onClick={() => cart.updateQty(key, line.item.qty + 1)}
                            className="p-2 text-muted transition-colors hover:text-ink"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="ml-auto font-mono text-xs text-gold">
                          {formatIDR(line.subtotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-label tracking-label text-muted uppercase">
                  Total
                </span>
                <span className="font-display text-2xl text-gold">{formatIDR(total)}</span>
              </div>

              <Button asChild size="lg" className="mt-5 w-full">
                <a
                  href={whatsappCartLink(cart.items, catalog)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pesan lewat WhatsApp
                </a>
              </Button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
                Pesanan diteruskan ke WhatsApp beserta rincian di atas. Stok dan ongkos kirim
                dikonfirmasi admin.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
