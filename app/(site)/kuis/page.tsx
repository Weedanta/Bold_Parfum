import type { Metadata } from "next";

import { site } from "@/lib/site";
import { ScentProfiler } from "@/components/quiz/scent-profiler";

export const metadata: Metadata = {
  title: "Scent Profiler",
  description:
    "Empat pertanyaan tentang cara Anda hadir, bukan tentang bergamot dan oud. Kami terjemahkan jawabannya ke satu varian The Bold yang paling cocok.",
  alternates: { canonical: "/kuis" },
  openGraph: {
    title: `Scent Profiler · ${site.name}`,
    description:
      "Empat pertanyaan, satu aroma signature. Temukan varian The Bold yang paling menggambarkan karakter Anda.",
    url: "/kuis",
  },
};

export default function QuizPage() {
  return <ScentProfiler />;
}
