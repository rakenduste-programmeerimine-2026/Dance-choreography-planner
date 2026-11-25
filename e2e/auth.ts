// Signs the seeded local test user in through the local Supabase API and sets the session cookies.
import { createServerClient } from "@supabase/ssr";
import type { BrowserContext } from "@playwright/test";

export const TEST_EMAIL = "test@example.com";
export const TEST_PASSWORD = "test-password-123";

export async function signInAsTestUser(context: BrowserContext, baseURL: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const pending: { name: string; value: string }[] = [];

  // @supabase/ssr hands us the chunked cookies it would set in a browser.
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        pending.push(...cookies.map(({ name, value }) => ({ name, value })));
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw error;

  await context.addCookies(pending.map((c) => ({ ...c, url: baseURL })));
}
