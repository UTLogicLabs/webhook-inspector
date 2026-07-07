import { createDb } from "./client.server";

const dbPath = process.env.DB_PATH ?? "./data/webhook-inspector.sqlite";

export const db = createDb(dbPath);
