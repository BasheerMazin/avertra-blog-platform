import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { UserPostsManager } from "../UserPostsManager";
import type { PostDto } from "../PostCard";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let searchParamsValue = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => searchParamsValue,
}));

const samplePosts: PostDto[] = [
  {
    id: "post-1",
    title: "First post",
    content: "First content",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    authorId: "user-1",
    published: true,
  },
  {
    id: "post-2",
    title: "Second post",
    content: "Second content",
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    authorId: "user-1",
    published: false,
  },
];

beforeEach(() => {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockRefresh.mockReset();
  searchParamsValue = new URLSearchParams();
});

const originalFetch = global.fetch;
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe("UserPostsManager", () => {
  it("toggles the create form when the new post button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <UserPostsManager posts={[]} pagination={{ page: 1, totalPages: 1 }} />
    );

    expect(screen.queryByText("Create post")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New post" }));

    expect(
      screen.getByRole("heading", { name: "Create post" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create post" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Close editor" }));

    expect(screen.queryByText("Create post")).not.toBeInTheDocument();
  });

  it("shows an error message and hides the empty state when an error occurs", () => {
    render(
      <UserPostsManager
        posts={[]}
        errorMessage="Unable to load posts"
        pagination={{ page: 1, totalPages: 1 }}
      />
    );

    expect(screen.getByText("Unable to load posts")).toBeInTheDocument();
    expect(screen.queryByText("You have no posts yet")).not.toBeInTheDocument();
  });

  it("renders the list of posts and pagination controls", () => {
    render(
      <UserPostsManager
        posts={samplePosts}
        pagination={{ page: 2, totalPages: 3 }}
      />
    );

    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.getByText("Second post")).toBeInTheDocument();

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next →" })).toBeEnabled();
  });

  it("updates the router with the next and previous page when paginating", async () => {
    const user = userEvent.setup();

    searchParamsValue = new URLSearchParams("filter=drafts");

    render(
      <UserPostsManager
        posts={samplePosts}
        pagination={{ page: 2, totalPages: 3 }}
      />
    );

    await user.click(screen.getByRole("button", { name: "← Previous" }));
    expect(mockPush).toHaveBeenCalledWith("/posts/manage?filter=drafts");

    mockPush.mockClear();

    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(mockPush).toHaveBeenCalledWith("/posts/manage?filter=drafts&page=3");
  });

  it("submits the create form and closes the editor when successful", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    render(
      <UserPostsManager posts={[]} pagination={{ page: 1, totalPages: 1 }} />
    );

    await user.click(screen.getByRole("button", { name: "New post" }));

    const titleInput = screen.getByLabelText("Title");
    const contentInput = screen.getByLabelText("Content");

    await user.type(titleInput, "Launch announcement");
    await user.type(contentInput, "Exciting details about the launch.");
    await user.click(screen.getByLabelText("Publish immediately"));

    await user.click(screen.getByRole("button", { name: "Create post" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Launch announcement",
          content: "Exciting details about the launch.",
          published: true,
        }),
      });
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("heading", { name: "Create post" })
    ).not.toBeInTheDocument();
  });

  it("surfaces an error message when the create request fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue({
      ok: false,
      json: vi
        .fn()
        .mockResolvedValue({ error: { message: "Unable to create post" } }),
    } as unknown as Response);

    render(
      <UserPostsManager posts={[]} pagination={{ page: 1, totalPages: 1 }} />
    );

    await user.click(screen.getByRole("button", { name: "New post" }));
    await user.type(screen.getByLabelText("Title"), "Draft title");
    await user.type(screen.getByLabelText("Content"), "Draft content");

    await user.click(screen.getByRole("button", { name: "Create post" }));

    expect(
      await screen.findByText("Unable to create post")
    ).toBeInTheDocument();
  });

  it("handles unexpected errors during post creation", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(new Error("Network offline"));

    render(
      <UserPostsManager posts={[]} pagination={{ page: 1, totalPages: 1 }} />
    );

    await user.click(screen.getByRole("button", { name: "New post" }));
    await user.type(screen.getByLabelText("Title"), "Broken request");
    await user.type(screen.getByLabelText("Content"), "Will not save");

    await user.click(screen.getByRole("button", { name: "Create post" }));

    expect(await screen.findByText("Network offline")).toBeInTheDocument();
  });
});
