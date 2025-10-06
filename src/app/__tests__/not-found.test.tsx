import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import NotFound from "../not-found";

describe("NotFound page", () => {
  it("shows the friendly 404 message", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("We can't find that page")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to homepage" })
    ).toHaveAttribute("href", "/");
  });
});
