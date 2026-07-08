import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { SignatureVerifier } from "~/components/SignatureVerifier";

describe("SignatureVerifier", () => {
  it("shows a valid result after submitting", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => <SignatureVerifier bucketId="b1" requestId="r1" />,
      },
      {
        path: "/buckets/:bucketId/verify-signature",
        action: () => ({ valid: true }),
      },
    ]);

    render(<Stub initialEntries={["/"]} />);
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(screen.getByText(/valid signature/i)).toBeInTheDocument(),
    );
  });

  it("shows an invalid result with the reason", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => <SignatureVerifier bucketId="b1" requestId="r1" />,
      },
      {
        path: "/buckets/:bucketId/verify-signature",
        action: () => ({ valid: false, reason: "signature mismatch" }),
      },
    ]);

    render(<Stub initialEntries={["/"]} />);
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(screen.getByText(/signature mismatch/i)).toBeInTheDocument(),
    );
  });
});
