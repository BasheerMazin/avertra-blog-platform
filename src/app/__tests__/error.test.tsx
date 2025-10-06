import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "../error";

describe("GlobalError boundary", () => {
  it("logs the error and renders recovery UI", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // intentionally empty
    });
    const sampleError = new Error("Something exploded");

    render(<GlobalError error={sampleError} />);

    expect(consoleSpy).toHaveBeenCalledWith(sampleError);
    expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to homepage" })
    ).toHaveAttribute("href", "/");

    consoleSpy.mockRestore();
  });
});
