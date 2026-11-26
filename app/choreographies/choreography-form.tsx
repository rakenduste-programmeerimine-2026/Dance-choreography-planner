"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  initial?: { id: string; title: string; width: number; depth: number };
  showResizeNote?: boolean;
};

export function ChoreographyForm({ action, submitLabel, initial, showResizeNote }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const input = "rounded border border-slate-300 px-2 py-1";

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label className="flex flex-col text-sm">
        Pealkiri
        <input name="title" required maxLength={100} defaultValue={initial?.title} className={input} />
      </label>
      <label className="flex flex-col text-sm">
        Laius (m)
        <input name="width" type="number" required min={1} max={50} step="any" defaultValue={initial?.width ?? 10} className={`${input} w-24`} />
      </label>
      <label className="flex flex-col text-sm">
        Sügavus (m)
        <input name="depth" type="number" required min={1} max={50} step="any" defaultValue={initial?.depth ?? 8} className={`${input} w-24`} />
      </label>
      <button type="submit" disabled={pending} className="rounded-full border border-slate-300 px-4 py-1.5 font-medium hover:bg-slate-100 disabled:opacity-50">
        {submitLabel}
      </button>
      {showResizeNote && (
        <p className="w-full text-sm text-slate-600">Mõõtude muutmine venitab paigutust</p>
      )}
      {state.error && (
        <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
