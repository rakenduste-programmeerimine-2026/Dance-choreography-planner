"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseChoreographyInput } from "@/lib/choreography-input";

export type FormState = { error?: string };

// Server Actions are reachable by direct POST, so each one checks the session itself.
async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

function parse(formData: FormData) {
  return parseChoreographyInput(
    formData.get("title"),
    formData.get("width"),
    formData.get("depth"),
  );
}

export async function createChoreography(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Palun logi sisse" };

  const { error } = await supabase.rpc("create_choreography", {
    p_title: parsed.value.title,
    p_stage_width_m: parsed.value.stageWidthM,
    p_stage_depth_m: parsed.value.stageDepthM,
  });
  if (error) return { error: "Salvestamine ebaõnnestus" };
  refresh();
  return {};
}

export async function updateChoreography(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get("id");
  if (!isUuid(id)) return { error: "Koreograafiat ei leitud" };
  const parsed = parse(formData);
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Palun logi sisse" };

  // RLS limits the update to the caller's own rows; zero rows back means not theirs or gone.
  const { data, error } = await supabase
    .from("choreographies")
    .update({
      title: parsed.value.title,
      stage_width_m: parsed.value.stageWidthM,
      stage_depth_m: parsed.value.stageDepthM,
    })
    .eq("id", id)
    .select("id");
  if (error || data.length === 0) return { error: "Salvestamine ebaõnnestus" };
  refresh();
  return {};
}

export async function deleteChoreography(formData: FormData) {
  const id = formData.get("id");
  if (!isUuid(id)) return;
  const supabase = await signedInClient();
  if (!supabase) return;
  await supabase.from("choreographies").delete().eq("id", id);
  refresh();
}
