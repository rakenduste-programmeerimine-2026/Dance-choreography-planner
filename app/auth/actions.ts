"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  // Local scope signs out this browser only, not the user's other devices.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
