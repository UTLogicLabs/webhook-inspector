import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { createBucket } from "./helpers";

test("verifies a valid Stripe signature and rejects a wrong secret", async ({
  page,
  request,
}) => {
  const bucketId = await createBucket(page, "sig-test");
  const secret = "whsec_test";
  const payload = JSON.stringify({ id: "evt_1" });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");

  await request.post(`/i/${bucketId}`, {
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${t},v1=${sig}`,
    },
    data: payload,
  });

  await page.getByTestId("request-item").first().click();
  await page.getByLabel("Secret").fill(secret);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Valid signature")).toBeVisible();

  await page.getByLabel("Secret").fill("wrong-secret");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/Invalid/)).toBeVisible();
});
