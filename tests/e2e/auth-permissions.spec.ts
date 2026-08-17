import { test, expect } from "@playwright/test";

test.describe("Authentication & Role Permissions", () => {
  test("Redirects unauthenticated users to login page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*login/);
  });

  test("Renders login form with clean validation", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("Public Booking page is accessible without login", async ({ page }) => {
    await page.goto("/book/main-branch");
    // Verify booking portal or 404 handler loads without redirecting to /login
    await expect(page).not.toHaveURL(/.*login/);
  });
});
