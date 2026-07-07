import { useState } from "react";
import { HeadersTable } from "./HeadersTable";

type Tab = "pretty" | "raw" | "headers";

export interface RequestDetailRecord {
  method: string;
  path: string;
  query: string;
  receivedAt: string;
  responseStatus: number | null;
  sizeBytes: number;
  contentType: string | null;
  remoteAddr: string | null;
  headers: [string, string][];
}

export function RequestDetail({
  record,
  bodyText,
  prettyBody,
  isBinary,
  truncated,
}: {
  record: RequestDetailRecord;
  bodyText: string | null;
  prettyBody: string | null;
  isBinary: boolean;
  truncated: boolean;
}) {
  const [tab, setTab] = useState<Tab>(prettyBody ? "pretty" : "raw");

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-mono">
          {record.method} {record.path}
          {record.query && `?${record.query}`}
        </h2>
        <p className="text-sm text-gray-500">
          {new Date(record.receivedAt).toLocaleString()} · status{" "}
          {record.responseStatus ?? "—"} · {record.sizeBytes} bytes ·{" "}
          {record.remoteAddr ?? "unknown"}
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {(["pretty", "raw", "headers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm capitalize ${
              tab === t
                ? "border-b-2 border-black font-medium"
                : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "pretty" &&
        (prettyBody ? (
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto">
            {prettyBody}
          </pre>
        ) : (
          <p className="text-sm text-gray-500">No JSON body to pretty-print.</p>
        ))}

      {tab === "raw" &&
        (isBinary ? (
          <p className="text-sm text-gray-500">
            Binary content{truncated ? " (truncated)" : ""}, {record.sizeBytes}{" "}
            bytes.
          </p>
        ) : (
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto whitespace-pre-wrap">
            {bodyText || "(empty body)"}
          </pre>
        ))}

      {tab === "headers" && <HeadersTable headers={record.headers} />}
    </div>
  );
}
