"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

/*
 * Gerak masuk dan keluar panel.
 *
 * Radix menunda pelepasan panel dari DOM hanya bila ada CSS animation yang
 * sedang berjalan; transition biasa tidak ditunggu, jadi panel lama langsung
 * hilang tanpa sempat bergeser keluar. Karena itu gerakannya ditulis sebagai
 * keyframes. Blok ini diletakkan di sini, bukan di globals.css, supaya sheet
 * membawa gerakannya sendiri ke mana pun ia dipakai. React 19 mengangkat tag
 * style ber-href ke head dan memasangnya sekali saja, berapa pun sheet yang
 * dirender.
 *
 * `.sheet-item` dipakai isi panel untuk naik bertingkat setelah panelnya tiba.
 * Saat reduced motion aktif, aturan global memangkas durasi panel mendekati nol,
 * jadi animationend tetap terpicu dan panel tetap bisa ditutup. Gerak isinya
 * dilewati sama sekali, karena jedanya tidak ikut dipangkas dan isi panel akan
 * tertahan tak terlihat selama jeda itu.
 */
const sheetMotion = `
@keyframes sheet-panel-in { from { transform: translate3d(100%, 0, 0); } to { transform: none; } }
@keyframes sheet-panel-out { from { transform: none; } to { transform: translate3d(100%, 0, 0); } }
@keyframes sheet-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sheet-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes sheet-item-in { from { opacity: 0; transform: translate3d(0, 14px, 0); } to { opacity: 1; transform: none; } }
.sheet-overlay[data-state="open"] { animation: sheet-fade-in 0.6s var(--ease-out-soft) both; }
.sheet-overlay[data-state="closed"] { animation: sheet-fade-out 0.45s var(--ease-in-out-silk) both; }
.sheet-panel[data-state="open"] { animation: sheet-panel-in 0.8s var(--ease-out-soft) both; }
.sheet-panel[data-state="closed"] { animation: sheet-panel-out 0.5s var(--ease-in-out-silk) both; }
@media (prefers-reduced-motion: no-preference) {
  .sheet-panel[data-state="open"] .sheet-item { animation: sheet-item-in 0.7s var(--ease-out-soft) both; animation-delay: calc(0.18s + var(--sheet-i, 0) * 0.06s); }
}
`;

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <style href="sheet-motion" precedence="default">
        {sheetMotion}
      </style>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-obsidian/75 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        className={cn(
          "sheet-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-surface shadow-[-40px_0_80px_-40px_rgb(0_0_0/0.7)] outline-none sm:max-w-[27rem]",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Tutup"
          className="absolute top-6 right-5 flex size-10 items-center justify-center rounded-full border border-line text-muted transition-[color,border-color,transform] duration-500 ease-[var(--ease-out-soft)] hover:rotate-90 hover:border-ink/40 hover:text-ink sm:right-7"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
