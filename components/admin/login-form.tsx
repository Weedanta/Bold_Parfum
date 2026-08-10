"use client";

import { useActionState } from "react";

import { masuk, type ActionState } from "@/app/admin/actions";
import { Field, TextInput } from "@/components/admin/form-fields";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(masuk, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <Field label="Email">
        <TextInput name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Kata sandi">
        <TextInput name="password" type="password" autoComplete="current-password" required />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="border border-gold-bright bg-gold-bright px-6 py-2.5 text-sm text-obsidian transition-opacity disabled:opacity-50"
      >
        {pending ? "Memeriksa…" : "Masuk"}
      </button>

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
