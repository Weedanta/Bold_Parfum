import type { Metadata } from "next";

import { site } from "@/lib/site";
import { ScentProfiler } from "@/components/quiz/scent-profiler";

export const metadata: Metadata = {
  title: "Scent Profiler",
  description:
    "Empat pertanyaan santai untuk menemukan varian The Bold yang paling pas dengan kepribadian dan keseharianmu.",
  alternates: { canonical: "/kuis" },
  openGraph: {
    title: `Scent Profiler | ${site.name}`,
    description:
      "Empat pertanyaan, satu aroma signature. Temukan varian The Bold yang paling menggambarkan karakter Anda.",
    url: "/kuis",
  },
};

export default function QuizPage() {
  return <ScentProfiler />;
}
