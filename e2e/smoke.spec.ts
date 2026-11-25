// Smoke test: the proxy lets the seeded user's session through to `/` and sends visitors without one to sign-in.
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

  // The proxy must accept the session and not send the user to sign-in.
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(new URL("/", baseURL).href);
  await expect(page.getByRole("button", { name: "Logi välja" })).toBeVisible();
});

test("signed-out visitor is redirected to sign-in", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto("/");
  await expect(page).toHaveURL(new URL("/login", baseURL).href);
  await expect(page.getByRole("button", { name: "Logi sisse Google'iga" })).toBeVisible();

  await context.close();
});
