import { useState } from "react";
import { useFetcher } from "react-router";

interface VerifyResult {
  valid: boolean;
  reason?: string;
}

export function SignatureVerifier({
  bucketId,
  requestId,
}: {
  bucketId: string;
  requestId: string;
}) {
  const fetcher = useFetcher<VerifyResult>();
  const [provider, setProvider] = useState("stripe");
  const [secret, setSecret] = useState("");

  return (
    <div className="border rounded p-4 space-y-2">
      <h3 className="font-medium text-sm">Verify signature</h3>
      <fetcher.Form
        method="post"
        action={`/buckets/${bucketId}/verify-signature`}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="requestId" value={requestId} />
        <label className="flex flex-col text-xs">
          Provider
          <select
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="stripe">Stripe</option>
            <option value="github">GitHub</option>
          </select>
        </label>
        <label className="flex flex-col text-xs">
          Secret
          <input
            type="password"
            name="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="bg-black text-white rounded px-3 py-1.5 text-sm"
        >
          Verify
        </button>
      </fetcher.Form>
      {fetcher.data && (
        <p
          className={`text-sm ${fetcher.data.valid ? "text-green-600" : "text-red-600"}`}
        >
          {fetcher.data.valid
            ? "Valid signature"
            : `Invalid — ${fetcher.data.reason ?? "unknown"}`}
        </p>
      )}
    </div>
  );
}
