import { describe, it, expect, beforeEach, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { createDb } from "~/db/client.server";
import { createBucket } from "~/db/buckets.server";
import {
  insertRequest,
  listRequests,
  getRequest,
  insertReplayResult,
  type NewRequestInput,
} from "~/db/requests.server";

function baseInput(
  bucketId: string,
  overrides: Partial<NewRequestInput> = {},
): NewRequestInput {
  return {
    bucketId,
    method: "POST",
    path: "/i/x",
    query: "",
    headers: [["content-type", "application/json"]],
    body: '{"a":1}',
    bodyEncoding: "utf8",
    contentType: "application/json",
    remoteAddr: "127.0.0.1",
    sizeBytes: 8,
    responseStatus: 200,
    ...overrides,
  };
}

describe("requests", () => {
  let db: DatabaseSync;
  let bucketId: string;

  beforeEach(() => {
    db = createDb(":memory:");
    bucketId = createBucket(db).id;
  });

  it("inserts and retrieves a request", () => {
    const record = insertRequest(db, baseInput(bucketId));
    expect(getRequest(db, record.id)).toEqual(record);
    expect(record.headers).toEqual([["content-type", "application/json"]]);
  });

  it("filters by method and status", () => {
    insertRequest(db, baseInput(bucketId, { method: "GET", responseStatus: 404 }));
    insertRequest(db, baseInput(bucketId, { method: "POST", responseStatus: 200 }));

    expect(listRequests(db, bucketId, { method: "GET" })).toHaveLength(1);
    expect(listRequests(db, bucketId, { status: 404 })).toHaveLength(1);
    expect(
      listRequests(db, bucketId, { method: "POST", status: 404 }),
    ).toHaveLength(0);
  });

  it("filters by date range", () => {
    insertRequest(db, baseInput(bucketId));
    const future = "2099-01-01T00:00:00.000Z";
    expect(listRequests(db, bucketId, { from: future })).toHaveLength(0);
    expect(listRequests(db, bucketId, { to: future })).toHaveLength(1);
  });

  it("links a replay to its original request", () => {
    const original = insertRequest(db, baseInput(bucketId));
    const replay = insertReplayResult(db, original.id, {
      targetUrl: "http://example.com",
      method: "POST",
      headers: [["content-type", "application/json"]],
      body: '{"a":1}',
      status: 200,
      responseHeaders: [["content-type", "text/plain"]],
      responseBody: "ok",
      latencyMs: 12,
    });

    expect(replay.replayedFromId).toBe(original.id);
    expect(replay.replayStatus).toBe(200);
    expect(replay.replayBody).toBe("ok");
    expect(replay.bucketId).toBe(original.bucketId);
  });

  it("throws when replaying a nonexistent request", () => {
    expect(() =>
      insertReplayResult(db, "missing", {
        targetUrl: "http://example.com",
        method: "GET",
        headers: [],
        body: null,
        status: 200,
        responseHeaders: [],
        responseBody: null,
        latencyMs: 1,
      }),
    ).toThrow();
  });

  it("trims to the configured retention limit per bucket", async () => {
    process.env.RETENTION_LIMIT = "3";
    vi.resetModules();
    const { createDb: createDb2 } = await import("~/db/client.server");
    const { createBucket: createBucket2 } = await import("~/db/buckets.server");
    const { insertRequest: insertRequest2, listRequests: listRequests2 } =
      await import("~/db/requests.server");

    const freshDb = createDb2(":memory:");
    const freshBucketId = createBucket2(freshDb).id;
    for (let i = 0; i < 5; i++) {
      insertRequest2(freshDb, baseInput(freshBucketId));
    }

    expect(listRequests2(freshDb, freshBucketId, { limit: 100 })).toHaveLength(3);
    delete process.env.RETENTION_LIMIT;
  });
});
