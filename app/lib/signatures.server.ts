import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GitHub: `X-Hub-Signature-256: sha256=<hex(HMAC-SHA256(secret, rawBody))>`.
 */
export function verifyGithubSignature(
  secret: string,
  rawBody: Buffer,
  headerValue: string | null,
): boolean {
  if (!headerValue || !headerValue.startsWith("sha256=")) return false;

  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(`sha256=${expectedHex}`, "utf8");
  const actual = Buffer.from(headerValue, "utf8");

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export interface StripeVerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Stripe: `Stripe-Signature: t=<unix_ts>,v1=<hex(HMAC-SHA256(secret, "<t>.<rawBody>"))>`.
 * Only v1 is checked; a timestamp tolerance guards against replay of an
 * otherwise-valid signature.
 */
export function verifyStripeSignature(
  secret: string,
  rawBody: Buffer,
  headerValue: string | null,
  toleranceSeconds = 300,
): StripeVerifyResult {
  if (!headerValue) return { valid: false, reason: "missing header" };

  const parts = Object.fromEntries(
    headerValue.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return { valid: false, reason: "malformed header" };

  const signedPayload = Buffer.concat([
    Buffer.from(`${t}.`, "utf8"),
    rawBody,
  ]);
  const expectedHex = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
    actual = Buffer.from(v1, "hex");
  } catch {
    return { valid: false, reason: "malformed signature" };
  }

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { valid: false, reason: "signature mismatch" };
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(ageSeconds) || ageSeconds > toleranceSeconds) {
    return { valid: false, reason: "timestamp outside tolerance" };
  }

  return { valid: true };
}
