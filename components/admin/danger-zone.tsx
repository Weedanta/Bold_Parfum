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
    <section className="mt-16 border border-red-400/30 p-5">
      <h2 className="font-mono text-label tracking-label text-red-400 uppercase">
        Zona berbahaya
      </h2>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        Menghapus <span className="text-ink">{name}</span> juga menghapus seluruh note, harga,
        vibe, kesempatan pakai, label, dan foto botolnya. Tidak bisa dibatalkan. Kalau hanya
        ingin varian ini hilang dari situs, matikan Tampilkan di situs pada bagian di atas.
      </p>

      <form action={action} className="mt-5 flex flex-wrap items-end gap-3">
        <input type="hidden" name="slug" value={slug} />

        <label className="block">
          <span className="font-mono text-label tracking-label text-muted uppercase">
            Ketik {name} untuk mengonfirmasi
          </span>
          <input
            name="confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-64 max-w-full border border-line bg-obsidian px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-red-400"
          />
        </label>

        <button
          type="submit"
          disabled={!cocok || pending}
          className="flex items-center gap-2 border border-red-400/50 px-5 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 className="size-4" />
          {pending ? "Menghapus..." : "Hapus varian"}
        </button>

        {state.error ? (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
