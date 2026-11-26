"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseChoreographyInput } from "@/lib/choreography-input";

// values echoes the submitted fields on error, because React resets the form after every action.
export type FormState = {
  error?: string;
  values?: { title: string; width: string; depth: string };
};

// Server Actions are reachable by direct POST, so each one checks the session itself.
async function signedInClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

function submitted(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return { title: text("title"), width: text("width"), depth: text("depth") };
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
  if (!parsed.ok) return { error: parsed.error, values: submitted(formData) };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Palun logi sisse", values: submitted(formData) };

  const { error } = await supabase.rpc("create_choreography", {
    p_title: parsed.value.title,
    p_stage_width_m: parsed.value.stageWidthM,
    p_stage_depth_m: parsed.value.stageDepthM,
  });
  if (error) return { error: "Salvestamine ebaõnnestus", values: submitted(formData) };
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
  if (!parsed.ok) return { error: parsed.error, values: submitted(formData) };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Palun logi sisse", values: submitted(formData) };

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
  if (error || data.length === 0) {
    return { error: "Salvestamine ebaõnnestus", values: submitted(formData) };
  }
  refresh();
  return {};
}

export async function deleteChoreography(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = formData.get("id");
  if (!isUuid(id)) return { error: "Koreograafiat ei leitud" };
  const supabase = await signedInClient();
  if (!supabase) return { error: "Palun logi sisse" };
  const { error } = await supabase.from("choreographies").delete().eq("id", id);
  if (error) return { error: "Kustutamine ebaõnnestus" };
  refresh();
  return {};
}
