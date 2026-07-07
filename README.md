# webhook-inspector

A self-hosted RequestBin / webhook.site clone. Spin up disposable endpoint URLs, capture every incoming request in full, inspect it, and replay it against a new target with edits — without deploying anything.

## Features

- **Disposable endpoints** — create a bucket and get a unique `/i/:bucketId` URL to point webhooks (Stripe, GitHub, etc.) at, with zero deployment.
- **Full request capture** — every hit is stored with its raw headers, body, method, query string, timing, and size, regardless of content type.
- **Live updates** — captured requests stream into the UI in real time over Server-Sent Events (no polling, no websockets).
- **Filter & search** — narrow a bucket's request list by method, response status, or date range.
- **Replay with edits** — pick a captured request, edit its method/headers/body/target URL, and resend it server-side; the response (and a link back to the original) is recorded.
- **Signature verification** — hand-rolled Stripe and GitHub HMAC signature checks, built directly on Node's `crypto` module (no external crypto dependencies).

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The app is available at `http://localhost:5173`. A SQLite database is created automatically under `./data/` on first run.

## How it works

- `POST`/`GET`/etc. to `/i/:bucketId` is captured verbatim (raw bytes, not re-parsed) and stored in SQLite — see [app/routes/capture.tsx](app/routes/capture.tsx).
- The bucket detail page subscribes to `/api/stream/:bucketId`, an SSE endpoint that pushes new requests (and replay results) as they happen — see [app/routes/stream.tsx](app/routes/stream.tsx).
- Replaying a request performs a server-side `fetch` to the edited target and logs the outcome as a new row linked to the original — see [app/routes/replay.tsx](app/routes/replay.tsx).
- Signature verification reconstructs the exact raw bytes captured at ingestion and checks them against Stripe/GitHub's HMAC schemes — see [app/lib/signatures.server.ts](app/lib/signatures.server.ts).

## Configuration

All configuration is via environment variables; every one has a sensible default.

| Variable          | Default                             | Purpose                                                        |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `DB_PATH`          | `./data/webhook-inspector.sqlite`   | Path to the SQLite database file (`:memory:` is supported).    |
| `PORT`             | `3000`                               | Port the production server listens on.                         |
| `PUBLIC_BASE_URL`  | derived from the request's `Host`   | Base URL shown for bucket webhook links (set this behind a tunnel/reverse proxy). |
| `MAX_BODY_BYTES`   | `5242880` (5 MB)                     | Captured request bodies larger than this are truncated (flagged, true size still recorded). |
| `RETENTION_LIMIT`  | `200`                                 | Oldest requests beyond this count (per bucket) are pruned automatically. |

## Testing

```bash
npm run lint       # ESLint
npm run typecheck  # react-router typegen + tsc
npm test           # Vitest unit + component tests
npm run test:e2e   # Playwright end-to-end tests (builds and serves the app)
```

CI runs all four on every push and pull request — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Building for Production

```bash
npm run build
npm run start
```

### Docker Deployment

To build and run using Docker:

```bash
docker build -t webhook-inspector .

# Run the container
docker run -p 3000:3000 webhook-inspector
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`, along with a writable location for the SQLite file (`DB_PATH`):

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Stack

Built with [React Router](https://reactrouter.com/) (framework mode) on Node, `node:sqlite` for storage, Server-Sent Events for live updates, and Tailwind CSS for styling.

## License

MIT — see [LICENSE.md](LICENSE.md).
