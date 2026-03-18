import { test, expect } from "@playwright/test";

test("waitlist form submits successfully", async ({ page }) => {
  await page.goto("/");

  // Two forms on page (hero + CTA). Use the first (hero).
  const form = page.locator("form.waitlist-form").first();

  // DJ is pre-selected by default — switch to Promoter to confirm role buttons work
  await form.getByRole("button", { name: "Promoter" }).click();

  // Fill optional name
  await form.getByLabel("Your name").fill("E2E Tester");

  // Fill required email — unique to avoid duplicate-silent-success masking a real error
  const testEmail = `e2e-${Date.now()}@example.com`;
  await form.getByLabel("Email address").fill(testEmail);

  // Submit
  await form.getByRole("button", { name: "Join waitlist" }).click();

  // Expect success state
  await expect(page.locator(".waitlist-form__success-text")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator(".waitlist-form__success-text")).toHaveText(
    "You're on the list."
  );
});
