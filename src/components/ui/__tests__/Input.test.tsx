import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";

import { Input } from "../Input";

describe("Input", () => {
  it("renders its label and associates with an explicit id", () => {
    render(
      <Input
        id="custom-id"
        label="Email address"
        name="email"
        defaultValue="user@example.com"
      />
    );

    const input = screen.getByLabelText("Email address");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(input).toHaveValue("user@example.com");
  });

  it("generates a unique id when none is provided", () => {
    render(<Input label="Project name" name="project" />);

    const input = screen.getByLabelText("Project name");
    const label = screen.getByText("Project name");

    expect(input).toHaveAttribute("id");
    expect(label).toHaveAttribute("for", input.getAttribute("id"));
  });

  it("toggles password visibility when enabled", async () => {
    const user = userEvent.setup();

    render(
      <Input
        label="Account password"
        name="password"
        type="password"
        withPasswordToggle
      />
    );

    const input = screen.getByLabelText("Account password") as HTMLInputElement;
    expect(input.type).toBe("password");

    const toggleButton = screen.getByRole("button", { name: "Show password" });
    await user.click(toggleButton);

    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toBeInTheDocument();
    expect(input.type).toBe("text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.type).toBe("password");
  });

  it("does not render a toggle when not a password field", () => {
    render(<Input label="Title" name="title" withPasswordToggle />);

    expect(screen.queryByRole("button", { name: /password/i })).toBeNull();
  });
});
