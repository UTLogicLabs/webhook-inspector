import type { Route } from "./+types/verify-signature";
import { db } from "~/db/db.server";
import { getRequest } from "~/db/requests.server";
import { decodeBody } from "~/lib/raw-body.server";
import {
  verifyGithubSignature,
  verifyStripeSignature,
} from "~/lib/signatures.server";

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const requestId = String(formData.get("requestId"));
  const provider = String(formData.get("provider"));
  const secret = String(formData.get("secret") ?? "");

  const record = getRequest(db, requestId);
  if (!record || record.bucketId !== params.bucketId) {
    return Response.json(
      { valid: false, reason: "request not found" },
      { status: 404 },
    );
  }

  const rawBody = decodeBody(record.body, record.bodyEncoding);

  if (provider === "github") {
    const headerValue =
      record.headers.find(([k]) => k.toLowerCase() === "x-hub-signature-256")
        ?.[1] ?? null;
    const valid = verifyGithubSignature(secret, rawBody, headerValue);
    return Response.json({
      valid,
      reason: valid ? undefined : "signature mismatch",
    });
  }

  if (provider === "stripe") {
    const headerValue =
      record.headers.find(([k]) => k.toLowerCase() === "stripe-signature")?.[1] ??
      null;
    return Response.json(verifyStripeSignature(secret, rawBody, headerValue));
  }

  return Response.json(
    { valid: false, reason: "unknown provider" },
    { status: 400 },
  );
}
