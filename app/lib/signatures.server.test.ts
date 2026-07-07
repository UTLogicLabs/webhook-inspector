import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyGithubSignature, verifyStripeSignature } from "./signatures.server";

describe("verifyGithubSignature", () => {
  const secret = "ghsecret";
  const body = Buffer.from('{"action":"opened"}');
  const validHeader =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid signature", () => {
    expect(verifyGithubSignature(secret, body, validHeader)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const tampered = Buffer.from('{"action":"closed"}');
    expect(verifyGithubSignature(secret, tampered, validHeader)).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const wrongHeader =
      "sha256=" + createHmac("sha256", "wrong").update(body).digest("hex");
    expect(verifyGithubSignature(secret, body, wrongHeader)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyGithubSignature(secret, body, null)).toBe(false);
    expect(verifyGithubSignature(secret, body, "not-prefixed=abc")).toBe(false);
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test";
  const body = Buffer.from('{"id":"evt_1"}');

  function sign(t: number, payloadBody = body) {
    const signedPayload = Buffer.concat([Buffer.from(`${t}.`), payloadBody]);
    return createHmac("sha256", secret).update(signedPayload).digest("hex");
  }

  it("accepts a valid, fresh signature", () => {
    const t = Math.floor(Date.now() / 1000);
    const header = `t=${t},v1=${sign(t)}`;
    expect(verifyStripeSignature(secret, body, header)).toEqual({ valid: true });
  });

  it("rejects a tampered body", () => {
    const t = Math.floor(Date.now() / 1000);
    const header = `t=${t},v1=${sign(t)}`;
    const result = verifyStripeSignature(secret, Buffer.from('{"id":"evt_2"}'), header);
    expect(result.valid).toBe(false);
  });

  it("rejects a stale timestamp beyond tolerance", () => {
    const t = Math.floor(Date.now() / 1000) - 1000;
    const header = `t=${t},v1=${sign(t)}`;
    expect(verifyStripeSignature(secret, body, header, 300)).toEqual({
      valid: false,
      reason: "timestamp outside tolerance",
    });
  });

  it("rejects a missing header", () => {
    expect(verifyStripeSignature(secret, body, null)).toEqual({
      valid: false,
      reason: "missing header",
    });
  });

  it("rejects a malformed header", () => {
    expect(verifyStripeSignature(secret, body, "garbage")).toEqual({
      valid: false,
      reason: "malformed header",
    });
  });
});
