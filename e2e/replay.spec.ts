import { test, expect } from "@playwright/test";
import http from "node:http";
import { createBucket } from "./helpers";

test("replays a captured request to a new target and records the response", async ({
  page,
  request,
}) => {
  const echoServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      res.writeHead(201, { "content-type": "text/plain" });
      res.end(`echoed:${body}`);
    });
  });
  await new Promise<void>((resolve) => echoServer.listen(9321, resolve));

  try {
    const bucketId = await createBucket(page, "replay-test");
    await request.post(`/i/${bucketId}`, {
      headers: { "content-type": "application/json" },
      data: { a: 1 },
    });

    await page.getByTestId("request-item").first().click();
    await page.getByRole("button", { name: "Replay this request" }).click();
    await page
      .getByPlaceholder("https://example.com/webhook")
      .fill("http://localhost:9321");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/Response: 201/)).toBeVisible();
    await expect(page.getByText(/echoed:/)).toBeVisible();
  } finally {
    echoServer.close();
  }
});
