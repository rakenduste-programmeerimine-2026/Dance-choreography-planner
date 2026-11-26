// Pure so Vitest can test it; the database CHECK constraints are the second line of defence.
export type ChoreographyInput = {
  title: string;
  stageWidthM: number;
  stageDepthM: number;
};

export type ParseResult =
  | { ok: true; value: ChoreographyInput }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isStageSize(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 50;
}

export function parseChoreographyInput(
  title: unknown,
  width: unknown,
  depth: unknown,
): ParseResult {
  if (typeof title !== "string") return { ok: false, error: "Pealkiri on kohustuslik" };
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { ok: false, error: "Pealkiri peab olema 1–100 tähemärki" };
  }

  // Number("") is 0, which would pass as a missing value without this check.
  const w = typeof width === "string" && width.trim() !== "" ? Number(width) : NaN;
  const d = typeof depth === "string" && depth.trim() !== "" ? Number(depth) : NaN;
  if (!isStageSize(w) || !isStageSize(d)) {
    return { ok: false, error: "Laius ja sügavus peavad olema 1–50 meetrit" };
  }

  return { ok: true, value: { title: trimmed, stageWidthM: w, stageDepthM: d } };
}
