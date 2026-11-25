// Smoke test: the seeded test user can open the home page.
import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth";

test("seeded user opens /", async ({ context, page, baseURL }) => {
  await signInAsTestUser(context, baseURL!);
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  const cookies = await context.cookies();
  expect(cookies.some((c) => c.name.startsWith("sb-"))).toBe(true);
});
