"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus } from "lucide-react";

import { cartLines, cartTotal, itemKey } from "@/lib/cart";
import { STOCK_LABELS } from "@/lib/products";
import { whatsappCartLink } from "@/lib/whatsapp";
import { cn, formatIDR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/components/cart-provider";
import { useCatalog } from "@/components/catalog-provider";
import { BottleThumb } from "@/components/bottle-image";

/** Urutan masuk bertingkat untuk `.sheet-item`, dibaca oleh keyframes di sheet.tsx. */
function stagger(index: number) {
  return { "--sheet-i": index } as CSSProperties;
}

export function CartSheet() {
  const cart = useCart();
  const catalog = useCatalog();
  const lines = cartLines(cart.items, catalog);
  const total = cartTotal(cart.items, catalog);
  // Baris yang stoknya kosong tetap ditampilkan, tapi tidak bisa dipesan. Kalau
  // seluruh isi keranjang begitu, tidak ada yang bisa dikirim ke WhatsApp.
  const adaYangBisaDipesan = lines.some((line) => line.orderable);

  return (
    <Sheet open={cart.isOpen} onOpenChange={(open) => (open ? cart.open() : cart.close())}>
      <SheetContent aria-describedby={undefined}>
        <div className="sheet-item px-6 pt-7 pb-6 sm:px-8" style={stagger(0)}>
          <SheetTitle className="font-display text-title font-light">Keranjang</SheetTitle>
          <p className="mt-1.5 text-caption text-muted">
            {cart.count > 0 ? `${cart.count} item dipilih` : "Belum ada yang dipilih"}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center px-6 pb-16 sm:px-8">
            <p className="sheet-item max-w-[18ch] font-display text-display font-light" style={stagger(1)}>
              Belum tahu mau <span className="italic">yang mana?</span>
            </p>
            <p
              className="sheet-item mt-5 max-w-xs text-sm leading-relaxed text-muted"
              style={stagger(2)}
            >
              Keranjang masih kosong. Scent Profiler membantu memilih lewat beberapa pertanyaan
              singkat.
            </p>
            <div className="sheet-item mt-8" style={stagger(3)}>
              <Button asChild variant="outline" onClick={cart.close}>
                <Link href="/kuis">
                  Mulai Scent Profiler
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="hairline flex-1 overflow-y-auto px-6 sm:px-8">
              {lines.map((line, index) => {
                const key = itemKey(line.item);
                return (
                  <li
                    key={key}
                    className="sheet-item flex gap-5 border-b border-line/70 py-6 last:border-b-0"
                    style={stagger(index + 1)}
                  >
                    <BottleThumb
                      product={line.product}
                      className={cn("size-24 shrink-0", line.orderable ? null : "opacity-60")}
                    />

                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koleksi/${line.product.slug}`}
                        onClick={cart.close}
                        className="self-start font-display text-xl leading-tight font-light transition-colors hover:text-gold-bright"
                      >
                        {line.product.name}
                      </Link>

                      <p className="mt-1.5 flex flex-wrap gap-x-3 text-caption text-muted">
                        <span>{line.item.ml} ml</span>
                        <span className="text-faint">{formatIDR(line.price)}</span>
                      </p>

                      {line.orderable ? null : (
                        <p className="mt-2.5 flex flex-wrap items-center gap-2">
                          <Badge>{STOCK_LABELS[line.product.stock]}</Badge>
                          <span className="text-caption text-faint">Tidak ikut dipesan</span>
                        </p>
                      )}

                      <div className="mt-auto flex items-center gap-3 pt-4">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            type="button"
                            aria-label={`Kurangi ${line.product.name}`}
                            onClick={() => cart.updateQty(key, line.item.qty - 1)}
                            className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs tabular-nums">
                            {line.item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tambah ${line.product.name}`}
                            onClick={() => cart.updateQty(key, line.item.qty + 1)}
                            className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        {/* Subtotal baris yang tidak ikut dipesan diredam dan dicoret.
                            Kalau ia tetap terang seperti yang lain, jumlah angka yang
                            terlihat tidak akan cocok dengan Total di bawah. */}
                        <span
                          className={cn(
                            "ml-auto text-sm tabular-nums",
                            line.orderable ? "text-ink" : "text-faint line-through",
                          )}
                        >
                          {formatIDR(line.subtotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div
              className="sheet-item border-t border-line bg-raised/60 px-6 pt-6 pb-7 sm:px-8"
              style={stagger(lines.length + 1)}
            >
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display text-title font-light tabular-nums">
                  {formatIDR(total)}
                </span>
              </div>

              {adaYangBisaDipesan ? (
                <Button asChild size="lg" className="mt-6 w-full">
                  <a
                    href={whatsappCartLink(cart.items, catalog)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pesan lewat WhatsApp
                    <ArrowUpRight />
                  </a>
                </Button>
              ) : (
                <Button type="button" size="lg" disabled className="mt-6 w-full">
                  Semua varian sedang kosong
                </Button>
              )}
              <p className="mt-4 text-caption text-faint">
                Rincian di atas ikut terkirim ke WhatsApp. Stok dan ongkos kirim dikonfirmasi
                admin.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
