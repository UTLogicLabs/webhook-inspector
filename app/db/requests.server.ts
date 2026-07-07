import type { DatabaseSync } from "node:sqlite";
import { nanoid } from "~/lib/ids.server";
import type { BodyEncoding } from "~/lib/raw-body.server";

export const RETENTION_LIMIT = Number(process.env.RETENTION_LIMIT ?? 200);

export interface RequestRecord {
  id: string;
  bucketId: string;
  method: string;
  path: string;
  query: string;
  headers: [string, string][];
  body: string | null;
  bodyEncoding: BodyEncoding;
  contentType: string | null;
  remoteAddr: string | null;
  receivedAt: string;
  sizeBytes: number;
  responseStatus: number | null;
  replayedFromId: string | null;
  replayTargetUrl: string | null;
  replayStatus: number | null;
  replayHeaders: [string, string][] | null;
  replayBody: string | null;
  replayLatencyMs: number | null;
  replayError: string | null;
}

interface RequestRow {
  id: string;
  bucket_id: string;
  method: string;
  path: string;
  query: string;
  headers: string;
  body: string | null;
  body_encoding: BodyEncoding;
  content_type: string | null;
  remote_addr: string | null;
  received_at: string;
  size_bytes: number;
  response_status: number | null;
  replayed_from_id: string | null;
  replay_target_url: string | null;
  replay_status: number | null;
  replay_headers: string | null;
  replay_body: string | null;
  replay_latency_ms: number | null;
  replay_error: string | null;
}

function rowToRecord(row: RequestRow): RequestRecord {
  return {
    id: row.id,
    bucketId: row.bucket_id,
    method: row.method,
    path: row.path,
    query: row.query,
    headers: JSON.parse(row.headers),
    body: row.body,
    bodyEncoding: row.body_encoding,
    contentType: row.content_type,
    remoteAddr: row.remote_addr,
    receivedAt: row.received_at,
    sizeBytes: row.size_bytes,
    responseStatus: row.response_status,
    replayedFromId: row.replayed_from_id,
    replayTargetUrl: row.replay_target_url,
    replayStatus: row.replay_status,
    replayHeaders: row.replay_headers ? JSON.parse(row.replay_headers) : null,
    replayBody: row.replay_body,
    replayLatencyMs: row.replay_latency_ms,
    replayError: row.replay_error,
  };
}

export interface NewRequestInput {
  bucketId: string;
  method: string;
  path: string;
  query: string;
  headers: [string, string][];
  body: string | null;
  bodyEncoding: BodyEncoding;
  contentType: string | null;
  remoteAddr: string | null;
  sizeBytes: number;
  responseStatus: number;
}

function trimRetention(db: DatabaseSync, bucketId: string): void {
  db.prepare(
    `DELETE FROM requests
     WHERE bucket_id = ?
       AND id NOT IN (
         SELECT id FROM requests
         WHERE bucket_id = ?
         ORDER BY received_at DESC, rowid DESC
         LIMIT ?
       )`,
  ).run(bucketId, bucketId, RETENTION_LIMIT);
}

export function insertRequest(
  db: DatabaseSync,
  input: NewRequestInput,
): RequestRecord {
  const id = nanoid(12);
  db.prepare(
    `INSERT INTO requests
      (id, bucket_id, method, path, query, headers, body, body_encoding, content_type, remote_addr, size_bytes, response_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.bucketId,
    input.method,
    input.path,
    input.query,
    JSON.stringify(input.headers),
    input.body,
    input.bodyEncoding,
    input.contentType,
    input.remoteAddr,
    input.sizeBytes,
    input.responseStatus,
  );
  trimRetention(db, input.bucketId);
  return getRequest(db, id)!;
}

export function getRequest(
  db: DatabaseSync,
  id: string,
): RequestRecord | undefined {
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as
    | RequestRow
    | undefined;
  return row ? rowToRecord(row) : undefined;
}

export interface ListFilters {
  method?: string;
  status?: number;
  from?: string;
  to?: string;
  limit?: number;
}

export function listRequests(
  db: DatabaseSync,
  bucketId: string,
  filters: ListFilters = {},
): RequestRecord[] {
  const clauses = ["bucket_id = ?"];
  const params: (string | number)[] = [bucketId];

  if (filters.method) {
    clauses.push("method = ?");
    params.push(filters.method);
  }
  if (filters.status !== undefined) {
    clauses.push("response_status = ?");
    params.push(filters.status);
  }
  if (filters.from) {
    clauses.push("received_at >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("received_at <= ?");
    params.push(filters.to);
  }

  const limit = filters.limit ?? 200;
  const rows = db
    .prepare(
      `SELECT * FROM requests WHERE ${clauses.join(" AND ")} ORDER BY received_at DESC LIMIT ?`,
    )
    .all(...params, limit) as unknown as RequestRow[];
  return rows.map(rowToRecord);
}

export interface ReplayResultInput {
  targetUrl: string;
  method: string;
  headers: [string, string][];
  body: string | null;
  status: number;
  responseHeaders: [string, string][];
  responseBody: string | null;
  latencyMs: number;
  error?: string;
}

export function insertReplayResult(
  db: DatabaseSync,
  originalId: string,
  input: ReplayResultInput,
): RequestRecord {
  const original = getRequest(db, originalId);
  if (!original) throw new Error(`Request ${originalId} not found`);

  const id = nanoid(12);
  db.prepare(
    `INSERT INTO requests
      (id, bucket_id, method, path, query, headers, body, body_encoding, content_type, remote_addr, size_bytes, response_status,
       replayed_from_id, replay_target_url, replay_status, replay_headers, replay_body, replay_latency_ms, replay_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    original.bucketId,
    input.method,
    original.path,
    original.query,
    JSON.stringify(input.headers),
    input.body,
    input.body ? "utf8" : "empty",
    original.contentType,
    "replay",
    Buffer.byteLength(input.body ?? ""),
    null,
    originalId,
    input.targetUrl,
    input.status,
    JSON.stringify(input.responseHeaders),
    input.responseBody,
    input.latencyMs,
    input.error ?? null,
  );
  trimRetention(db, original.bucketId);
  return getRequest(db, id)!;
}
