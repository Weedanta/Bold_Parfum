"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";

import { hapusVarian, type ActionState } from "@/app/admin/actions";

/**
 * Penghapusan varian.
 *
 * Berdiri sebagai form sendiri, bukan tombol di dalam ProductForm, karena form
 * HTML tidak boleh bersarang dan karena keduanya memang mengirim ke tempat yang
 * berbeda.
 *
 * Tombolnya baru hidup setelah nama varian diketik ulang persis. Itu bukan
 * pengamanan, server memeriksa ulang nama yang sama terhadap database, tapi
 * pembeda antara menghapus dan tidak sengaja menghapus. Varian punya cerita,
 * note, dan foto yang ditulis tangan; tidak ada tombol batal setelah ini.
 */
export function DangerZone({ slug, name }: { slug: string; name: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(hapusVarian, {});
  const [confirm, setConfirm] = useState("");

  const cocok = confirm.trim() === name;

  return (
    <section className="mt-16 rounded-2xl border border-red-400/25 bg-red-400/[0.03] p-5 sm:p-6">
      <h2 className="text-base text-red-300">Hapus varian ini</h2>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        Menghapus <span className="text-ink">{name}</span> juga menghapus seluruh note, harga,
        vibe, kesempatan pakai, label, dan foto botolnya. Tidak bisa dibatalkan. Kalau hanya
        ingin varian ini hilang dari situs, matikan Tampilkan di situs pada bagian di atas.
      </p>

      <form action={action} className="mt-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="slug" value={slug} />

        <label className="block">
          <span className="text-sm text-muted">
            Ketik <span className="text-ink">{name}</span> untuk mengonfirmasi
          </span>
          <input
            name="confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 block w-64 max-w-full rounded-lg border border-line bg-obsidian px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-red-400/70"
          />
        </label>

        <button
          type="submit"
          disabled={!cocok || pending}
          className="flex h-11 items-center gap-2 rounded-full border border-red-400/50 px-5 text-sm text-red-300 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 className="size-4" />
          {pending ? "Menghapus…" : "Hapus varian"}
        </button>

        {state.error ? (
          <p role="alert" className="text-sm text-red-300">
            {state.error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
