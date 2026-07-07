import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("buckets/:bucketId", "routes/bucket-layout.tsx", [
    index("routes/bucket-index.tsx"),
    route("requests/:requestId", "routes/request-detail.tsx"),
  ]),
  route("buckets/:bucketId/replay", "routes/replay.tsx"),
  route("buckets/:bucketId/verify-signature", "routes/verify-signature.tsx"),
  route("i/:bucketId", "routes/capture.tsx"),
  route("api/stream/:bucketId", "routes/stream.tsx"),
] satisfies RouteConfig;
