"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { createBrowserStore } from "@/lib/browser-store";
import { CART_STORAGE_KEY, addItem, cartCount, parseCart, setQty, type CartItem } from "@/lib/cart";
import { useCatalog } from "@/components/catalog-provider";
import type { Size } from "@/lib/products";

const EMPTY: CartItem[] = [];

const cartStore = createBrowserStore<CartItem[]>({
  key: CART_STORAGE_KEY,
  area: "local",
  parse: parseCart,
  empty: EMPTY,
});

type CartContextValue = {
  items: CartItem[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, ml: Size, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const catalog = useCatalog();
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((slug: string, ml: Size, qty = 1) => {
    cartStore.set(addItem(cartStore.getSnapshot(), { slug, ml, qty }));
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    cartStore.set(setQty(cartStore.getSnapshot(), key, qty));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items, catalog),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      updateQty,
      clear: () => cartStore.clear(),
    }),
    [items, catalog, isOpen, add, updateQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart harus dipakai di dalam CartProvider");
  return context;
}
