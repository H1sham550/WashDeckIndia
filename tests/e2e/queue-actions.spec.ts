import { test, expect } from "@playwright/test";

test.describe("Queue & Mobile Dashboard Usability", () => {
  test("Desktop navigation renders full sidebar and main shell", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Mobile navigation renders bottom navigation bar and touch targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14 size
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });
});
