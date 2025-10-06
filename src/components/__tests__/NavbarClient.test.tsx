import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NavbarClient } from "../NavbarClient";

vi.mock("@/components/auth/LogoutButton", () => ({
  LogoutButton: () => <button>Sign out</button>,
}));

describe("NavbarClient", () => {
  const originalScrollY = window.scrollY;

  afterEach(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });
  });

  it("shows sign-in link when no user is present", () => {
    render(<NavbarClient userLabel={null} />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/signin"
    );
  });

  it("shows the user label and logout button when authenticated", () => {
    render(<NavbarClient userLabel="Avertra Admin" />);

    expect(screen.getByText("Avertra Admin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("updates sticky positioning based on scroll position", async () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 20,
    });

    render(<NavbarClient userLabel={null} />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("top-0");

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(header.className).toContain("top-8");
    });
  });
});
