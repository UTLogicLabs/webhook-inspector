import { test, expect } from "@playwright/test";
import { createBucket } from "./helpers";

test("method filter narrows the visible request list", async ({
  page,
  request,
}) => {
  const bucketId = await createBucket(page, "filters-test");

  await request.get(`/i/${bucketId}`);
  await request.post(`/i/${bucketId}`, { data: { a: 1 } });

  await page.reload();
  const items = page.getByTestId("request-item");
  await expect(items).toHaveCount(2);

  await page.getByRole("combobox").selectOption("POST");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("POST");
});
