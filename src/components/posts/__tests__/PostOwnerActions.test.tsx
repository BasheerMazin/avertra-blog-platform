import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";

import { PostOwnerActions } from "../PostOwnerActions";
import type { PostDto } from "../PostCard";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

const samplePost: PostDto = {
  id: "post-1",
  title: "Editable title",
  content: "Editable content",
  authorId: "owner",
  published: false,
  createdAt: "2024-05-01T00:00:00.000Z",
  updatedAt: "2024-05-01T00:00:00.000Z",
};

const originalFetch = global.fetch;
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockRefresh.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("PostOwnerActions", () => {
  it("toggles the inline editor when requested", async () => {
    const user = userEvent.setup();

    render(<PostOwnerActions post={samplePost} />);

    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit post" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Editable title");

    await user.click(screen.getByRole("button", { name: "Close editor" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("publishes the post and refreshes the router on success", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("surfaces an error message when publish fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: false,
      json: vi
        .fn()
        .mockResolvedValue({ error: { message: "Unable to update post" } }),
    } as unknown as Response);

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(
      await screen.findByText("Unable to update post")
    ).toBeInTheDocument();
  });

  it("deletes the post and navigates back to manage view", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    render(<PostOwnerActions post={{ ...samplePost, published: true }} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1", {
        method: "DELETE",
      });
      expect(mockReplace).toHaveBeenCalledWith("/posts/manage");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("updates the post via the inline form and closes the editor on success", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Edit post" }));

    const titleInput = screen.getByLabelText("Title");
    const contentInput = screen.getByLabelText("Content");

    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    await user.clear(contentInput);
    await user.type(contentInput, "Updated content");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated title",
          content: "Updated content",
          published: false,
        }),
      });
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("button", { name: "Save changes" })
    ).not.toBeInTheDocument();
  });

  it("shows validation feedback when the update request returns an error", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: false,
      json: vi
        .fn()
        .mockResolvedValue({ error: { message: "Unable to update post" } }),
    } as unknown as Response);

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Edit post" }));
    await user.type(screen.getByLabelText("Title"), " updated");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Unable to update post")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();
  });

  it("shows delete error messaging when the server rejects the request", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: false,
      json: vi
        .fn()
        .mockResolvedValue({ error: { message: "Unable to delete post" } }),
    } as unknown as Response);

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Unable to delete post")
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("surfaces network errors encountered during update submissions", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Network offline"));

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Edit post" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Network offline")).toBeInTheDocument();
  });

  it("shows publish error feedback when the request throws", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Publish failed"));

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Publish failed")).toBeInTheDocument();
  });

  it("captures delete request failures thrown by fetch", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Delete failed"));

    render(<PostOwnerActions post={samplePost} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Delete failed")).toBeInTheDocument();
  });
});
