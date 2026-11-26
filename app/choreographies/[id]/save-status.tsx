export type SaveState = "saved" | "saving" | "failed";

export function SaveStatus({ state, error, onRetry }: { state: SaveState; error?: string | null; onRetry: () => void }) {
  if (state === "saving") return <p role="status" className="text-sm text-slate-600">Salvestan…</p>;
  if (state === "saved") return <p role="status" className="text-sm text-slate-600">Salvestatud</p>;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
      <span>Salvestamine ebaõnnestus{error && error !== "Salvestamine ebaõnnestus" ? `: ${error}` : ""}</span>
      <button type="button" onClick={onRetry} className="rounded-full border border-red-300 px-3 py-1 hover:bg-red-50">
        Proovi uuesti
      </button>
    </div>
  );
}
