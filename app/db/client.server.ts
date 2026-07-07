import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
// Inlined at build time so the schema ships inside the server bundle
// instead of relying on a raw .sql file existing next to it at runtime.
import schemaSql from "./schema.sql?raw";

export function createDb(dbPath: string): DatabaseSync {
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }
  const database = new DatabaseSync(dbPath);
  if (dbPath !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL;");
  }
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(schemaSql);
  return database;
}
