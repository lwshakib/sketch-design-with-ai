import { test, expect } from "@playwright/test";

test("should render the homepage", async ({ page }) => {
  await page.goto("/");
  // Adjust this selector based on your actual homepage content
  // For example, if you have a "Get Started" or "Sketch AI" text
  await expect(page).toHaveTitle(/Sketch/);
});
