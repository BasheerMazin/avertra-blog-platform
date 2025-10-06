import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { PostForm, type PostFormValues } from "../PostForm";

describe("PostForm", () => {
  const initialValues: PostFormValues = {
    title: "",
    content: "",
    published: false,
  };

  it("disables submit until both title and content are provided", async () => {
    const onSubmit = vi.fn();

    render(
      <PostForm
        initialValues={initialValues}
        submitLabel="Create post"
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: "Create post" });

    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Title"), "Launch plan");
    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByLabelText("Content"),
      "Details about the launch plan"
    );
    expect(submitButton).toBeEnabled();
  });

  it("submits form values, resets on success, and triggers cancel callback", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <PostForm
        initialValues={initialValues}
        submitLabel="Create post"
        submittingLabel="Creating..."
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Title"), "Roadmap");
    await user.type(screen.getByLabelText("Content"), "Q1 roadmap summary");
    await user.click(screen.getByLabelText("Publish immediately"));

    await user.click(screen.getByRole("button", { name: "Create post" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Roadmap",
      content: "Q1 roadmap summary",
      published: true,
    });

    await screen.findByRole("button", { name: "Create post" });

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Content")).toHaveValue("");
    expect(screen.getByLabelText("Publish immediately")).not.toBeChecked();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("surface submission errors and keeps user input intact", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ error: "Unable to create post" });
    const onCancel = vi.fn();

    render(
      <PostForm
        initialValues={initialValues}
        submitLabel="Create post"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Title"), "Failing submission");
    await user.type(screen.getByLabelText("Content"), "Something went wrong");
    await user.click(screen.getByRole("button", { name: "Create post" }));

    expect(
      await screen.findByText("Unable to create post")
    ).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Title")).toHaveValue("Failing submission");
    expect(screen.getByLabelText("Content")).toHaveValue(
      "Something went wrong"
    );
  });
});
