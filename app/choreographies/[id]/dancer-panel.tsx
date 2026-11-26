"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { labelError, MAX_DANCERS, type Dancer } from "@/lib/dancers";
import { addDancer, deleteDancer, updateDancer, type SaveResult } from "./actions";
import { SaveStatus, type SaveState } from "./save-status";

type Props = { choreographyId: string; sceneId: string; dancers: Dancer[] };

export function DancerPanel({ choreographyId, sceneId, dancers }: Props) {
  // Shows an edit at once; falls back to the server's list when the save ends, so a failed save shows what is stored.
  const [shown, setShown] = useOptimistic(dancers);
  const [, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const lastFailed = useRef<(() => void) | null>(null);

  function save(next: Dancer[] | null, send: () => Promise<SaveResult>) {
    // Set outside the transition, which would otherwise hold it back until the save ends.
    setState("saving");
    setError(null);
    startTransition(async () => {
      if (next) setShown(next);
      const result = await send();
      if (result.ok) {
        lastFailed.current = null;
        setState("saved");
      } else {
        lastFailed.current = () => save(next, send);
        setState("failed");
        setError(result.error);
      }
    });
  }

  const update = (dancer: Dancer) =>
    save(shown.map((d) => (d.id === dancer.id ? dancer : d)), () => updateDancer(choreographyId, dancer));

  const remove = (dancer: Dancer) => {
    if (!confirm(`Kustutan tantsija ${dancer.label} kõigist stseenidest?`)) return;
    save(shown.filter((d) => d.id !== dancer.id), () => deleteDancer(choreographyId, dancer.id));
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="dancers-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dancers-heading" className="text-xl font-medium">Tantsijad ({shown.length}/{MAX_DANCERS})</h2>
        <SaveStatus state={state} error={error} onRetry={() => lastFailed.current?.()} />
      </div>
      <button
        type="button"
        disabled={shown.length >= MAX_DANCERS}
        onClick={() => save(null, () => addDancer(choreographyId, sceneId))}
        className="self-start rounded-full border border-slate-300 px-4 py-1.5 font-medium hover:bg-slate-100 disabled:opacity-50"
      >
        Lisa tantsija
      </button>
      <ul className="flex flex-col gap-2">
        {shown.map((d) => (
          <DancerRow key={d.id} dancer={d} dancers={shown} onChange={update} onDelete={remove} />
        ))}
      </ul>
    </section>
  );
}

type RowProps = {
  dancer: Dancer;
  dancers: Dancer[];
  onChange: (dancer: Dancer) => void;
  onDelete: (dancer: Dancer) => void;
};

function DancerRow({ dancer, dancers, onChange, onDelete }: RowProps) {
  const [draft, setDraft] = useState(dancer.label);
  const [labelMessage, setLabelMessage] = useState<string | null>(null);

  function confirmLabel() {
    const label = draft.trim();
    if (label === dancer.label) return setLabelMessage(null);
    const message = labelError(label, dancer.id, dancers);
    setLabelMessage(message);
    if (!message) onChange({ ...dancer, label });
  }

  return (
    <li className="flex flex-wrap items-center gap-3">
      <span
        aria-hidden
        className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold text-white ${dancer.gender === "mees" ? "bg-mees" : "bg-naine"}`}
      >
        {dancer.label}
      </span>
      <label className="flex items-center gap-2 text-sm">
        Silt
        <input
          value={draft}
          maxLength={3}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={confirmLabel}
          onKeyDown={(e) => e.key === "Enter" && confirmLabel()}
          aria-invalid={labelMessage !== null}
          className="w-16 rounded border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        Sugu
        <select
          value={dancer.gender}
          onChange={(e) => onChange({ ...dancer, gender: e.target.value === "mees" ? "mees" : "naine" })}
          className="rounded border border-slate-300 px-2 py-1"
        >
          <option value="naine">naine</option>
          <option value="mees">mees</option>
        </select>
      </label>
      <button
        type="button"
        onClick={() => onDelete(dancer)}
        className="rounded-full border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
      >
        Kustuta
      </button>
      {labelMessage && <p role="alert" className="w-full text-sm text-red-700">{labelMessage}</p>}
    </li>
  );
}
