import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/home";
import { db } from "~/db/db.server";
import { createBucket, deleteBucket, listBuckets } from "~/db/buckets.server";
import { publicBaseUrl } from "~/lib/url.server";
import { CreateBucketForm } from "~/components/CreateBucketForm";

export function meta() {
  return [{ title: "webhook-inspector" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return { buckets: listBuckets(db), baseUrl: publicBaseUrl(request) };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const label = String(formData.get("label") ?? "");
    const responseStatus = Number(formData.get("responseStatus") ?? 200);
    const bucket = createBucket(db, label, responseStatus);
    return redirect(`/buckets/${bucket.id}`);
  }

  if (intent === "delete") {
    const id = String(formData.get("bucketId"));
    deleteBucket(db, id);
    return redirect("/");
  }

  return null;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { buckets, baseUrl } = loaderData;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-6">webhook-inspector</h1>

      <CreateBucketForm />

      <ul className="mt-8 space-y-3">
        {buckets.map((bucket) => (
          <li
            key={bucket.id}
            className="border rounded p-4 flex items-center justify-between gap-4"
          >
            <div>
              <Link
                to={`/buckets/${bucket.id}`}
                className="font-medium hover:underline"
              >
                {bucket.label || bucket.id}
              </Link>
              <div className="text-sm text-gray-500 font-mono">
                {`${baseUrl}/i/${bucket.id}`}
              </div>
            </div>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="bucketId" value={bucket.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </Form>
          </li>
        ))}
        {buckets.length === 0 && (
          <li className="text-gray-500">No buckets yet — create one above.</li>
        )}
      </ul>
    </main>
  );
}
