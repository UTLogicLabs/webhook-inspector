export const MAX_BODY_BYTES = Number(
  process.env.MAX_BODY_BYTES ?? 5 * 1024 * 1024,
);

export type BodyEncoding = "utf8" | "base64" | "truncated" | "empty";

export interface EncodedBody {
  text: string | null;
  encoding: BodyEncoding;
  sizeBytes: number;
}

/**
 * Encodes raw request bytes for storage. Truncation happens before the
 * utf8/base64 decision so oversized bodies are always flagged 'truncated'
 * (sizeBytes still reflects the true, pre-truncation length).
 */
export function encodeBody(bytes: Uint8Array): EncodedBody {
  const sizeBytes = bytes.byteLength;
  if (sizeBytes === 0) {
    return { text: null, encoding: "empty", sizeBytes };
  }

  const truncated = sizeBytes > MAX_BODY_BYTES;
  const slice = truncated ? bytes.subarray(0, MAX_BODY_BYTES) : bytes;

  if (truncated) {
    return {
      text: Buffer.from(slice).toString("base64"),
      encoding: "truncated",
      sizeBytes,
    };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(slice);
    return { text, encoding: "utf8", sizeBytes };
  } catch {
    return {
      text: Buffer.from(slice).toString("base64"),
      encoding: "base64",
      sizeBytes,
    };
  }
}

/** Reconstructs the raw bytes exactly as stored — required for HMAC verification. */
export function decodeBody(
  text: string | null,
  encoding: BodyEncoding,
): Buffer {
  if (text === null || encoding === "empty") return Buffer.alloc(0);
  if (encoding === "base64" || encoding === "truncated") {
    return Buffer.from(text, "base64");
  }
  return Buffer.from(text, "utf8");
}
