import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { PostCard, type PostDto } from "../PostCard";

describe("PostCard", () => {
  const basePost: PostDto = {
    id: "post-1",
    title: "Test Post",
    content:
      "This is an example content snippet that will be truncated if it becomes too long.",
    authorId: "user-1",
    published: true,
    createdAt: "2024-03-12T12:00:00.000Z",
    updatedAt: "2024-03-12T12:00:00.000Z",
  };

  it("renders the formatted creation date when provided", () => {
    render(<PostCard post={basePost} />);

    expect(screen.getByText("Mar 12, 2024")).toBeInTheDocument();
  });

  it("renders read more overlay when a href is provided", () => {
    render(<PostCard post={basePost} href="/posts/post-1" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/posts/post-1");
    expect(link).toHaveTextContent(/Read more/);
  });

  it("truncates long content and shows draft badge for unpublished posts", () => {
    const longContent = `${"A".repeat(200)} end`;

    render(
      <PostCard
        post={{
          ...basePost,
          content: longContent,
          published: false,
        }}
      />
    );

    expect(screen.getByText(/draft/i)).toBeInTheDocument();
    const expectedPreview = `${"A".repeat(157)}...`;
    expect(screen.getByText(expectedPreview)).toBeInTheDocument();
  });
});
