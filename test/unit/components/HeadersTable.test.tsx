import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeadersTable } from "~/components/HeadersTable";

describe("HeadersTable", () => {
  it("renders an empty state", () => {
    render(<HeadersTable headers={[]} />);
    expect(screen.getByText(/no headers/i)).toBeInTheDocument();
  });

  it("renders each header key/value pair", () => {
    render(
      <HeadersTable
        headers={[
          ["content-type", "application/json"],
          ["x-custom", "abc"],
        ]}
      />,
    );
    expect(screen.getByText("content-type")).toBeInTheDocument();
    expect(screen.getByText("application/json")).toBeInTheDocument();
    expect(screen.getByText("x-custom")).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
  });
});
