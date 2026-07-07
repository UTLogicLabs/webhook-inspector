import type { Route } from "./+types/replay";
import { db } from "~/db/db.server";
import { insertReplayResult } from "~/db/requests.server";
import { publish } from "~/lib/sse.server";

export async function action({ request, params }: Route.ActionArgs) {
  const body = await request.json();
  const { originalRequestId, targetUrl, method, headers, body: replayBody } =
    body as {
      originalRequestId: string;
      targetUrl: string;
      method: string;
      headers: [string, string][];
      body: string | null;
    };

  const start = performance.now();
  let outcome: {
    status: number;
    responseHeaders: [string, string][];
    responseBody: string | null;
    latencyMs: number;
    error?: string;
  };

  try {
    const resp = await fetch(targetUrl, {
      method,
      headers: Object.fromEntries(headers),
      body: ["GET", "HEAD"].includes(method) ? undefined : (replayBody ?? undefined),
    });
    const responseBody = await resp.text();
    outcome = {
      status: resp.status,
      responseHeaders: [...resp.headers.entries()],
      responseBody,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    outcome = {
      status: 0,
      responseHeaders: [],
      responseBody: null,
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const record = insertReplayResult(db, originalRequestId, {
    targetUrl,
    method,
    headers,
    body: replayBody,
    ...outcome,
  });

  publish(params.bucketId, { type: "replay", record });

  return Response.json({ record });
}
