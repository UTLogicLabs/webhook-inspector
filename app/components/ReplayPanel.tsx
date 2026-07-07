import { useState, type FormEvent } from "react";
import { useFetcher } from "react-router";

interface ReplayRecord {
  replayStatus: number | null;
  replayBody: string | null;
  replayLatencyMs: number | null;
  replayError: string | null;
}

export function ReplayPanel({
  bucketId,
  requestId,
  method,
  headers,
  bodyText,
}: {
  bucketId: string;
  requestId: string;
  method: string;
  headers: [string, string][];
  bodyText: string | null;
}) {
  const fetcher = useFetcher<{ record: ReplayRecord }>();
  const [targetUrl, setTargetUrl] = useState("");
  const [editedMethod, setEditedMethod] = useState(method);
  const [editedHeaders, setEditedHeaders] = useState(headers);
  const [editedBody, setEditedBody] = useState(bodyText ?? "");

  function updateHeader(index: number, key: string, value: string) {
    setEditedHeaders((prev) =>
      prev.map((h, i) => (i === index ? [key, value] : h)),
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    fetcher.submit(
      JSON.stringify({
        originalRequestId: requestId,
        targetUrl,
        method: editedMethod,
        headers: editedHeaders,
        body: editedBody,
      }),
      {
        method: "post",
        action: `/buckets/${bucketId}/replay`,
        encType: "application/json",
      },
    );
  }

  const result = fetcher.data?.record;

  return (
    <div className="border rounded p-4 space-y-3">
      <h3 className="font-medium text-sm">Replay</h3>
      <form onSubmit={submit} className="space-y-2">
        <label className="flex flex-col text-xs">
          Target URL
          <input
            required
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-xs">
          Method
          <input
            value={editedMethod}
            onChange={(e) => setEditedMethod(e.target.value)}
            className="border rounded px-2 py-1 w-32"
          />
        </label>
        <div className="space-y-1">
          <span className="text-xs font-medium">Headers</span>
          {editedHeaders.map(([key, value], i) => (
            <div key={i} className="flex gap-1">
              <input
                value={key}
                onChange={(e) => updateHeader(i, e.target.value, value)}
                className="border rounded px-2 py-1 w-1/3 font-mono text-xs"
              />
              <input
                value={value}
                onChange={(e) => updateHeader(i, key, e.target.value)}
                className="border rounded px-2 py-1 flex-1 font-mono text-xs"
              />
            </div>
          ))}
        </div>
        <label className="flex flex-col text-xs">
          Body
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={6}
            className="border rounded px-2 py-1 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          disabled={fetcher.state !== "idle"}
          className="bg-black text-white rounded px-3 py-1.5 text-sm"
        >
          {fetcher.state !== "idle" ? "Sending…" : "Send"}
        </button>
      </form>

      {result && (
        <div className="text-sm border-t pt-3">
          <p className="font-medium">
            {result.replayError
              ? `Error: ${result.replayError}`
              : `Response: ${result.replayStatus}`}{" "}
            · {result.replayLatencyMs}ms
          </p>
          {result.replayBody && (
            <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto text-xs">
              {result.replayBody}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
