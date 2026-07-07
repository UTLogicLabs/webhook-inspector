import { Form } from "react-router";

export function CreateBucketForm() {
  return (
    <Form
      method="post"
      className="flex flex-wrap items-end gap-3 border rounded p-4"
    >
      <input type="hidden" name="intent" value="create" />
      <label className="flex flex-col text-sm">
        Label
        <input
          name="label"
          placeholder="my-webhook"
          className="border rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col text-sm">
        Response status
        <input
          name="responseStatus"
          type="number"
          defaultValue={200}
          className="border rounded px-2 py-1 w-24"
        />
      </label>
      <button
        type="submit"
        className="bg-black text-white rounded px-4 py-1.5 text-sm"
      >
        Create bucket
      </button>
    </Form>
  );
}
