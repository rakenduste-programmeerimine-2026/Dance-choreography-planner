"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [failed, setFailed] = useState(false);

  async function signIn() {
    setFailed(false);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setFailed(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={signIn}
        className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
      >
        Logi sisse Google&apos;iga
      </button>
      {failed && (
        <p role="alert" className="text-red-600">
          Sisselogimine ebaõnnestus. Proovi uuesti.
        </p>
      )}
    </>
  );
}
