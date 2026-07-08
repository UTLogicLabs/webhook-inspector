import { describe, it, expect, beforeEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { createDb } from "~/db/client.server";
import { createBucket, getBucket, listBuckets, deleteBucket } from "~/db/buckets.server";

describe("buckets", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = createDb(":memory:");
  });

  it("creates and retrieves a bucket", () => {
    const bucket = createBucket(db, "test", 201);
    expect(bucket.label).toBe("test");
    expect(bucket.responseStatus).toBe(201);
    expect(getBucket(db, bucket.id)).toEqual(bucket);
  });

  it("defaults label and response status", () => {
    const bucket = createBucket(db);
    expect(bucket.label).toBe("");
    expect(bucket.responseStatus).toBe(200);
  });

  it("lists buckets", () => {
    const a = createBucket(db, "a");
    const b = createBucket(db, "b");
    const ids = listBuckets(db).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining([a.id, b.id]));
  });

  it("deletes a bucket", () => {
    const bucket = createBucket(db, "gone");
    deleteBucket(db, bucket.id);
    expect(getBucket(db, bucket.id)).toBeUndefined();
  });

  it("returns undefined for an unknown bucket id", () => {
    expect(getBucket(db, "nope")).toBeUndefined();
  });
});
