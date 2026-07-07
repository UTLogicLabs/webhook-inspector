PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS buckets (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL DEFAULT '',
  response_status INTEGER NOT NULL DEFAULT 200,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS requests (
  id                TEXT PRIMARY KEY,
  bucket_id         TEXT NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
  method            TEXT NOT NULL,
  path              TEXT NOT NULL,
  query             TEXT NOT NULL DEFAULT '',
  headers           TEXT NOT NULL,
  body              TEXT,
  body_encoding     TEXT NOT NULL DEFAULT 'utf8',
  content_type      TEXT,
  remote_addr       TEXT,
  received_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  size_bytes        INTEGER NOT NULL DEFAULT 0,
  response_status   INTEGER,

  replayed_from_id  TEXT REFERENCES requests(id) ON DELETE SET NULL,
  replay_target_url TEXT,
  replay_status     INTEGER,
  replay_headers    TEXT,
  replay_body       TEXT,
  replay_latency_ms INTEGER,
  replay_error      TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_bucket_received ON requests(bucket_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_bucket_method ON requests(bucket_id, method);
