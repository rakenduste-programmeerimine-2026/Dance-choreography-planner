"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function signIn() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={signIn}
      className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
    >
      Logi sisse Google&apos;iga
    </button>
  );
}
