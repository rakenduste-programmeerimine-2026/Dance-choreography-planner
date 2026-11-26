"use client";

import { deleteChoreography } from "./actions";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteChoreography}
      onSubmit={(e) => {
        if (!confirm(`Kustutan koreograafia "${title}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="rounded-full border border-red-300 px-4 py-1.5 text-red-700 hover:bg-red-50">
        Kustuta
      </button>
    </form>
  );
}
