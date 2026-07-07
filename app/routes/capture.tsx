import type { Route } from "./+types/capture";
import { db } from "~/db/db.server";
import { getBucket } from "~/db/buckets.server";
import { insertRequest } from "~/db/requests.server";
import { encodeBody } from "~/lib/raw-body.server";
import { publish } from "~/lib/sse.server";

async function capture({ request, params }: Route.LoaderArgs) {
  const bucketId = params.bucketId;
  const bucket = getBucket(db, bucketId);
  if (!bucket) {
    return new Response("Bucket not found", { status: 404 });
  }

  const url = new URL(request.url);
  const bytes = new Uint8Array(await request.arrayBuffer());
  const { text, encoding, sizeBytes } = encodeBody(bytes);

  const record = insertRequest(db, {
    bucketId,
    method: request.method,
    path: url.pathname,
    query: url.search.replace(/^\?/, ""),
    headers: [...request.headers.entries()],
    body: text,
    bodyEncoding: encoding,
    contentType: request.headers.get("content-type"),
    remoteAddr: request.headers.get("x-forwarded-for"),
    sizeBytes,
    responseStatus: bucket.responseStatus,
  });

  publish(bucketId, { type: "request", record });

  return new Response(null, { status: bucket.responseStatus });
}

export const loader = capture;
export const action = capture;
