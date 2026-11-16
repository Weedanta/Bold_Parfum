"use client";

import { useActionState } from "react";

import { masuk, type ActionState } from "@/app/admin/actions";
import { Field, TextInput } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

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

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>

      {state.error ? (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
