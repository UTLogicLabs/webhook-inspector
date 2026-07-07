import { useEffect, useState } from "react";
import { Link, Outlet, useParams, useSearchParams } from "react-router";
import type { Route } from "./+types/bucket-layout";
import { db } from "~/db/db.server";
import { getBucket } from "~/db/buckets.server";
import { listRequests, type RequestRecord } from "~/db/requests.server";
import { publicBaseUrl } from "~/lib/url.server";
import { RequestList } from "~/components/RequestList";
import { useBucketStream } from "~/components/useBucketStream";

export async function loader({ params, request }: Route.LoaderArgs) {
  const bucket = getBucket(db, params.bucketId);
  if (!bucket) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const method = url.searchParams.get("method") || undefined;
  const statusParam = url.searchParams.get("status");
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const requests = listRequests(db, bucket.id, {
    method,
    status: statusParam ? Number(statusParam) : undefined,
    from,
    to,
  });

  return { bucket, requests, baseUrl: publicBaseUrl(request) };
}

function matchesFilters(
  record: RequestRecord,
  searchParams: URLSearchParams,
): boolean {
  const method = searchParams.get("method");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (method && record.method !== method) return false;
  if (status && String(record.responseStatus) !== status) return false;
  if (from && record.receivedAt < from) return false;
  if (to && record.receivedAt > to) return false;
  return true;
}

function RequestFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <div className="p-3 border-b space-y-2">
      <select
        value={searchParams.get("method") ?? ""}
        onChange={(e) => update("method", e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
      >
        <option value="">All methods</option>
        {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(
          (m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ),
        )}
      </select>
      <input
        type="number"
        placeholder="Status"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
      />
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          className="border rounded px-2 py-1 text-xs flex-1"
        />
        <input
          type="datetime-local"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          className="border rounded px-2 py-1 text-xs flex-1"
        />
      </div>
    </div>
  );
}

export default function BucketLayout({ loaderData }: Route.ComponentProps) {
  const { bucket, requests, baseUrl } = loaderData;
  const [searchParams] = useSearchParams();
  const params = useParams();
  const [liveRequests, setLiveRequests] = useState(requests);

  useEffect(() => {
    setLiveRequests(requests);
  }, [requests]);

  useBucketStream(bucket.id, (type, record) => {
    if (type !== "request" && type !== "replay") return;
    if (!matchesFilters(record, searchParams)) return;
    setLiveRequests((prev) => {
      if (prev.some((r) => r.id === record.id)) return prev;
      return [record, ...prev].slice(0, 200);
    });
  });

  return (
    <div className="flex h-screen">
      <div className="w-96 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            &larr; buckets
          </Link>
          <h2 className="font-semibold">{bucket.label || bucket.id}</h2>
          <div className="text-xs font-mono text-gray-500 break-all">
            {`${baseUrl}/i/${bucket.id}`}
          </div>
        </div>
        <RequestFilters />
        <RequestList
          bucketId={bucket.id}
          requests={liveRequests}
          selectedId={params.requestId}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
