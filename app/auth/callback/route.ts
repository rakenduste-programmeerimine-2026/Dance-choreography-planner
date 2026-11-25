import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// A relative Location keeps the browser on the host the session cookies were set for;
// request.nextUrl in a route handler can report localhost when the browser used 127.0.0.1.
function redirectTo(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectTo("/");
    }
  }

  return redirectTo("/login?error=1");
}
