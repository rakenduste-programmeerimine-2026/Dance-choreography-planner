"use client";

import { useActionState } from "react";
import { deleteChoreography } from "./actions";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState(deleteChoreography, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Kustutan koreograafia "${title}"?`)) e.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="rounded-full border border-red-300 px-4 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50">
        Kustuta
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
