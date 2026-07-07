import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { RequestList, type RequestListItem } from "./RequestList";

const requests: RequestListItem[] = [
  {
    id: "r1",
    method: "POST",
    responseStatus: 200,
    receivedAt: "2026-01-01T00:00:00.000Z",
    replayedFromId: null,
  },
  {
    id: "r2",
    method: "GET",
    responseStatus: 404,
    receivedAt: "2026-01-02T00:00:00.000Z",
    replayedFromId: "r1",
  },
];

describe("RequestList", () => {
  it("renders an empty state", () => {
    render(
      <MemoryRouter>
        <RequestList bucketId="b1" requests={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no requests captured/i)).toBeInTheDocument();
  });

  it("renders requests with method, status, and a replay badge", () => {
    render(
      <MemoryRouter>
        <RequestList bucketId="b1" requests={requests} />
      </MemoryRouter>,
    );
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("replay")).toBeInTheDocument();
  });

  it("highlights the selected request", () => {
    render(
      <MemoryRouter>
        <RequestList bucketId="b1" requests={requests} selectedId="r2" />
      </MemoryRouter>,
    );
    const link = screen.getByText("GET").closest("a");
    expect(link?.className).toContain("bg-gray-100");
  });
});
