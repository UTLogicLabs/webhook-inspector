import { test, expect } from "@playwright/test";
import { createBucket } from "./helpers";

test("captures an incoming webhook and shows it live in the UI", async ({
  page,
  request,
}) => {
  const bucketId = await createBucket(page, "capture-test");

  const resp = await request.post(`/i/${bucketId}`, {
    headers: { "content-type": "application/json" },
    data: { hello: "world" },
  });
  expect(resp.status()).toBe(200);

  const item = page.getByTestId("request-item").first();
  await expect(item).toBeVisible();
  await expect(item).toContainText("POST");
  await item.click();
  await expect(page.getByText(/"hello": "world"/)).toBeVisible();
});

test("returns 404 for an unknown bucket", async ({ request }) => {
  const resp = await request.post(`/i/does-not-exist`);
  expect(resp.status()).toBe(404);
});
