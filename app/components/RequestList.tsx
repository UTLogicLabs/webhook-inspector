import { Link } from "react-router";

export interface RequestListItem {
  id: string;
  method: string;
  responseStatus: number | null;
  receivedAt: string;
  replayedFromId: string | null;
}

export function RequestList({
  bucketId,
  requests,
  selectedId,
}: {
  bucketId: string;
  requests: RequestListItem[];
  selectedId?: string;
}) {
  if (requests.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No requests captured yet.</p>;
  }

  return (
    <ul className="overflow-auto flex-1 divide-y">
      {requests.map((r) => (
        <li key={r.id}>
          <Link
            to={`/buckets/${bucketId}/requests/${r.id}`}
            data-testid="request-item"
            className={`block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 ${
              selectedId === r.id ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
          >
            <div className="flex justify-between">
              <span className="font-mono font-medium">
                {r.method}
                {r.replayedFromId && (
                  <span className="ml-1 text-xs text-blue-600">replay</span>
                )}
              </span>
              <span className="text-xs text-gray-500">
                {r.responseStatus ?? "—"}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(r.receivedAt).toLocaleString()}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
