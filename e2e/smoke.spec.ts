// Smoke test: the seeded user's session cookies are accepted by Supabase and `/` loads.
import { test, expect } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { signInAsTestUser, TEST_EMAIL } from "./auth";

test("seeded user opens /", async ({ context, page, baseURL }) => {
  const cookies = await signInAsTestUser(context, baseURL!);

  // Proves the cookies we set are a valid session, not just that they exist.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookies, setAll: () => {} } },
  );
  const { data, error } = await supabase.auth.getUser();
  expect(error).toBeNull();
  expect(data.user?.email).toBe(TEST_EMAIL);

  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
});
