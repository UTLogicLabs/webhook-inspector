import type { Page } from "@playwright/test";

export async function createBucket(page: Page, label: string): Promise<string> {
  await page.goto("/");
  await page.getByPlaceholder("my-webhook").fill(label);
  await page.getByRole("button", { name: "Create bucket" }).click();
  await page.waitForURL(/\/buckets\/[^/]+$/);
  const match = page.url().match(/\/buckets\/([^/]+)$/);
  if (!match) throw new Error(`bucket id not found in URL: ${page.url()}`);
  return match[1];
}
