"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/choreography-input";
import { firstFreeSlot, isDancer, isDancerList, labelError, MAX_DANCERS, nextLabel, type Dancer } from "@/lib/dancers";

export type SaveResult = { ok: true } | { ok: false; error: string };

const FAILED: SaveResult = { ok: false, error: "Salvestamine ebaõnnestus" };

// Server Actions are reachable by direct POST, so each one checks the session and its input itself.
async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

// RLS returns only the caller's choreography, so another user's id reads as not found.
async function loadDancers(supabase: Awaited<ReturnType<typeof createClient>>, choreographyId: string) {
  const { data } = await supabase.from("choreographies").select("dancers").eq("id", choreographyId).maybeSingle();
  return data && isDancerList(data.dancers) ? data.dancers : null;
}

function isPoint(value: unknown): value is { x: number; y: number } {
  return typeof value === "object" && value !== null && "x" in value && "y" in value &&
    typeof value.x === "number" && typeof value.y === "number";
}

function positionPoints(positions: unknown): { x: number; y: number }[] {
  if (typeof positions !== "object" || positions === null) return [];
  const values: unknown[] = Object.values(positions);
  return values.filter(isPoint);
}

export async function addDancer(choreographyId: unknown, sceneId: unknown): Promise<SaveResult> {
  if (!isUuid(choreographyId) || !isUuid(sceneId)) return FAILED;
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "Palun logi sisse" };

  const dancers = await loadDancers(supabase, choreographyId);
  if (!dancers) return FAILED;
  if (dancers.length >= MAX_DANCERS) return { ok: false, error: `Tantsijaid saab olla kuni ${MAX_DANCERS}` };

  // The free slot is taken from the shown scene and then used in every scene.
  const { data: scene } = await supabase
    .from("scenes")
    .select("positions")
    .eq("id", sceneId)
    .eq("choreography_id", choreographyId)
    .maybeSingle();
  if (!scene) return FAILED;

  const dancer: Dancer = { id: crypto.randomUUID(), label: nextLabel(dancers), gender: "naine" };
  const slot = firstFreeSlot(positionPoints(scene.positions));
  const { error } = await supabase.rpc("add_dancer", {
    p_choreography_id: choreographyId,
    p_dancer: dancer,
    p_x: slot.x,
    p_y: slot.y,
  });
  if (error) return FAILED;
  refresh();
  return { ok: true };
}

export async function updateDancer(choreographyId: unknown, input: unknown): Promise<SaveResult> {
  if (!isUuid(choreographyId) || !isDancer(input)) return FAILED;
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "Palun logi sisse" };

  const dancers = await loadDancers(supabase, choreographyId);
  if (!dancers || !dancers.some((d) => d.id === input.id)) return FAILED;
  const error = labelError(input.label, input.id, dancers);
  if (error) return { ok: false, error };

  const next = dancers.map((d) => (d.id === input.id ? input : d));
  const { data, error: dbError } = await supabase
    .from("choreographies")
    .update({ dancers: next })
    .eq("id", choreographyId)
    .select("id");
  if (dbError || data.length === 0) return FAILED;
  refresh();
  return { ok: true };
}

export async function deleteDancer(choreographyId: unknown, dancerId: unknown): Promise<SaveResult> {
  if (!isUuid(choreographyId) || !isUuid(dancerId)) return FAILED;
  const supabase = await signedInClient();
  if (!supabase) return { ok: false, error: "Palun logi sisse" };

  const { error } = await supabase.rpc("delete_dancer", {
    p_choreography_id: choreographyId,
    p_dancer_id: dancerId,
  });
  if (error) return FAILED;
  refresh();
  return { ok: true };
}
