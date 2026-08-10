"use client";

import { useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** useLayoutEffect memperingatkan saat SSR; di server tidak ada yang perlu diukur. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

let pluginsRegistered = false;

function ensurePlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  pluginsRegistered = true;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type GsapSetup<T extends HTMLElement> = (args: {
  root: T;
  reduced: boolean;
}) => void;

/**
 * Menjalankan `setup` di dalam gsap.context yang tercakup pada elemen root, lalu
 * revert saat unmount. Revert inilah yang membuat animasi aman terhadap
 * double-invoke React StrictMode: efek kedua mulai dari keadaan asli.
 *
 * Aturan penting: JANGAN sembunyikan elemen lewat CSS. Keadaan awal animasi
 * diset di sini dengan gsap.set(), sehingga tanpa JavaScript konten tetap
 * terlihat utuh, dan saat prefers-reduced-motion aktif elemen dibiarkan apa
 * adanya alih-alih dianimasikan cepat.
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  setup: GsapSetup<T>,
  deps: DependencyList = [],
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    ensurePlugins();
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => setup({ root, reduced }), root);

    return () => ctx.revert();
  }, deps);

  return ref;
}

export { gsap, ScrollTrigger, SplitText };
