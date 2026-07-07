import { useState } from "react";
import type { Route } from "./+types/request-detail";
import { db } from "~/db/db.server";
import { getRequest } from "~/db/requests.server";
import { decodeBody } from "~/lib/raw-body.server";
import { RequestDetail } from "~/components/RequestDetail";
import { SignatureVerifier } from "~/components/SignatureVerifier";
import { ReplayPanel } from "~/components/ReplayPanel";

export async function loader({ params }: Route.LoaderArgs) {
  const record = getRequest(db, params.requestId);
  if (!record || record.bucketId !== params.bucketId) {
    throw new Response("Not Found", { status: 404 });
  }

  const bodyBuffer = decodeBody(record.body, record.bodyEncoding);
  const isBinary =
    record.bodyEncoding === "base64" || record.bodyEncoding === "truncated";
  const bodyText = isBinary ? null : bodyBuffer.toString("utf8");

  let prettyBody: string | null = null;
  if (bodyText && record.contentType?.includes("json")) {
    try {
      prettyBody = JSON.stringify(JSON.parse(bodyText), null, 2);
    } catch {
      prettyBody = null;
    }
  }

  return {
    record,
    bodyText,
    prettyBody,
    isBinary,
    truncated: record.bodyEncoding === "truncated",
  };
}

export default function RequestDetailRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { record, bodyText, prettyBody, isBinary, truncated } = loaderData;
  const [showReplay, setShowReplay] = useState(false);

  return (
    <div>
      <RequestDetail
        record={record}
        bodyText={bodyText}
        prettyBody={prettyBody}
        isBinary={isBinary}
        truncated={truncated}
      />
      <div className="px-6 pb-6 space-y-4">
        <SignatureVerifier bucketId={params.bucketId} requestId={record.id} />
        <div>
          <button
            onClick={() => setShowReplay((v) => !v)}
            className="text-sm underline"
          >
            {showReplay ? "Hide replay" : "Replay this request"}
          </button>
          {showReplay && (
            <div className="mt-3">
              <ReplayPanel
                bucketId={params.bucketId}
                requestId={record.id}
                method={record.method}
                headers={record.headers}
                bodyText={bodyText}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
