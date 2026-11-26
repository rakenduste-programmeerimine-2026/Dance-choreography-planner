// Pure so Vitest can test it. The database only checks that dancers is an array of at most 30,
// so these guards are what keeps the contents valid.
import { isUuid } from "./choreography-input";

export type Gender = "mees" | "naine";
export type Dancer = { id: string; label: string; gender: Gender };

export const MAX_DANCERS = 30;
const GRID_COLUMNS = 6;
const GRID_ROWS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isGender(value: unknown): value is Gender {
  return value === "mees" || value === "naine";
}

// Labels are stored trimmed, so a stored label with spaces around it is malformed.
export function isLabel(value: unknown): value is string {
  return typeof value === "string" && value === value.trim() && value.length >= 1 && value.length <= 3;
}

export function isDancer(value: unknown): value is Dancer {
  return (
    isRecord(value) &&
    Object.keys(value).length === 3 &&
    isUuid(value.id) &&
    isLabel(value.label) &&
    isGender(value.gender)
  );
}

export function isDancerList(value: unknown): value is Dancer[] {
  if (!Array.isArray(value) || value.length > MAX_DANCERS || !value.every(isDancer)) return false;
  const ids = new Set(value.map((d) => d.id));
  const labels = new Set(value.map((d) => d.label.toLowerCase()));
  return ids.size === value.length && labels.size === value.length;
}

// Estonian error for a label edit, or null when the label can be saved.
export function labelError(label: string, dancerId: string, dancers: Dancer[]): string | null {
  if (!isLabel(label)) return "Silt peab olema 1–3 tähemärki";
  const taken = dancers.some((d) => d.id !== dancerId && d.label.toLowerCase() === label.toLowerCase());
  return taken ? `Silt "${label}" on juba kasutusel` : null;
}

export function nextLabel(dancers: Dancer[]): string {
  const used = new Set(dancers.map((d) => d.label.toLowerCase()));
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
}

// A grid slot counts as occupied when any dancer stands inside its cell, so a dancer dragged
// slightly off a slot still blocks it. With at most 29 dancers one of the 30 cells is always free.
export function firstFreeSlot(points: { x: number; y: number }[]): { x: number; y: number } {
  const cell = (x: number, y: number) =>
    Math.min(GRID_ROWS - 1, Math.floor(y * GRID_ROWS)) * GRID_COLUMNS +
    Math.min(GRID_COLUMNS - 1, Math.floor(x * GRID_COLUMNS));
  const occupied = new Set(points.map((p) => cell(p.x, p.y)));
  let i = 0;
  while (i < GRID_COLUMNS * GRID_ROWS - 1 && occupied.has(i)) i++;
  return {
    x: ((i % GRID_COLUMNS) + 0.5) / GRID_COLUMNS,
    y: (Math.floor(i / GRID_COLUMNS) + 0.5) / GRID_ROWS,
  };
}
