import type { DatabaseSync } from "node:sqlite";
import { nanoid } from "~/lib/ids.server";

export interface Bucket {
  id: string;
  label: string;
  responseStatus: number;
  createdAt: string;
}

interface BucketRow {
  id: string;
  label: string;
  response_status: number;
  created_at: string;
}

function rowToBucket(row: BucketRow): Bucket {
  return {
    id: row.id,
    label: row.label,
    responseStatus: row.response_status,
    createdAt: row.created_at,
  };
}

export function createBucket(
  db: DatabaseSync,
  label = "",
  responseStatus = 200,
): Bucket {
  const id = nanoid(10);
  db.prepare(
    "INSERT INTO buckets (id, label, response_status) VALUES (?, ?, ?)",
  ).run(id, label, responseStatus);
  return getBucket(db, id)!;
}

export function getBucket(db: DatabaseSync, id: string): Bucket | undefined {
  const row = db.prepare("SELECT * FROM buckets WHERE id = ?").get(id) as
    | BucketRow
    | undefined;
  return row ? rowToBucket(row) : undefined;
}

export function listBuckets(db: DatabaseSync): Bucket[] {
  const rows = db
    .prepare("SELECT * FROM buckets ORDER BY created_at DESC")
    .all() as unknown as BucketRow[];
  return rows.map(rowToBucket);
}

export function deleteBucket(db: DatabaseSync, id: string): void {
  db.prepare("DELETE FROM buckets WHERE id = ?").run(id);
}
