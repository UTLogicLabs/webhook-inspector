import { describe, it, expect, vi } from "vitest";
import { encodeBody, decodeBody } from "./raw-body.server";

describe("encodeBody / decodeBody", () => {
  it("marks empty bodies", () => {
    expect(encodeBody(new Uint8Array())).toEqual({
      text: null,
      encoding: "empty",
      sizeBytes: 0,
    });
  });

  it("stores valid utf8 text as-is", () => {
    const bytes = new TextEncoder().encode('{"a":1}');
    const result = encodeBody(bytes);
    expect(result.encoding).toBe("utf8");
    expect(result.text).toBe('{"a":1}');
    expect(decodeBody(result.text, result.encoding).toString("utf8")).toBe(
      '{"a":1}',
    );
  });

  it("base64-encodes invalid utf8 bytes", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    const result = encodeBody(bytes);
    expect(result.encoding).toBe("base64");
    expect(decodeBody(result.text, result.encoding)).toEqual(Buffer.from(bytes));
  });

  it("decodes empty stored bodies to an empty buffer", () => {
    expect(decodeBody(null, "empty")).toEqual(Buffer.alloc(0));
  });

  it("truncates bodies over the size cap and preserves the true size", async () => {
    process.env.MAX_BODY_BYTES = "10";
    vi.resetModules();
    const { encodeBody: encodeBodyWithCap } = await import("./raw-body.server");

    const bytes = new TextEncoder().encode("x".repeat(20));
    const result = encodeBodyWithCap(bytes);

    expect(result.encoding).toBe("truncated");
    expect(result.sizeBytes).toBe(20);
    delete process.env.MAX_BODY_BYTES;
  });
});
