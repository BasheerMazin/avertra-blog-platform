import { describe, it, expect, vi, beforeEach } from "vitest";

import { createTRPCContext } from "@/server/trpc/trpc";
import { postsRouter } from "@/server/trpc/routers/posts";
import { appRouter } from "@/server/trpc/routers/_app";
import { TRPCError } from "@trpc/server";

type Post = import("@/server/db/schema").Post;
type ListArgs = {
  authorId?: string;
  publishedOnly?: boolean;
  limit?: number;
  page?: number;
};
type ListResult = {
  items: Post[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

type ServicesMock = {
  listPosts: ReturnType<typeof vi.fn<(args?: ListArgs) => Promise<ListResult>>>;
  getPost: ReturnType<typeof vi.fn<(id: string) => Promise<Post | null>>>;
  createPost: ReturnType<
    typeof vi.fn<
      (input: {
        title: string;
        content: string;
        authorId: string;
      }) => Promise<Post>
    >
  >;
  updatePost: ReturnType<
    typeof vi.fn<
      (
        id: string,
        patch: { title?: string; content?: string; published?: boolean },
        userId: string
      ) => Promise<Post>
    >
  >;
  deletePost: ReturnType<
    typeof vi.fn<(id: string, userId: string) => Promise<void>>
  >;
};

vi.mock("@/server/services/posts", () => {
  return {
    listPosts: vi.fn<(args?: ListArgs) => Promise<ListResult>>(),
    getPost: vi.fn<(id: string) => Promise<Post | null>>(),
    createPost:
      vi.fn<
        (input: {
          title: string;
          content: string;
          authorId: string;
        }) => Promise<Post>
      >(),
    updatePost:
      vi.fn<
        (
          id: string,
          patch: { title?: string; content?: string; published?: boolean },
          userId: string
        ) => Promise<Post>
      >(),
    deletePost: vi.fn<(id: string, userId: string) => Promise<void>>(),
  } satisfies ServicesMock;
});

const services = (await import(
  "@/server/services/posts"
)) as unknown as ServicesMock;

describe("tRPC setup", () => {
  it("createTRPCContext returns default", async () => {
    const ctx = await createTRPCContext();
    expect(ctx).toEqual({ userId: null });
  });

  it("appRouter exposes posts router", () => {
    // Sanity check that app router is wired
    expect(appRouter._def).toBeDefined();
  });
});

describe("posts router", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("list proxies to service and returns result", async () => {
    services.listPosts.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
    });
    const caller = postsRouter.createCaller({ userId: null });
    const res = await caller.list({ limit: 10, page: 1 });
    expect(res.total).toBe(0);
  });

  it("byId throws TRPC NOT_FOUND when service returns null", async () => {
    services.getPost.mockResolvedValueOnce(null);
    const caller = postsRouter.createCaller({ userId: null });
    await expect(
      caller.byId({ id: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("create/update/remove map errors via mapErrorToTRPC", async () => {
    services.createPost.mockRejectedValueOnce(new Error("Invalid title"));
    const caller = postsRouter.createCaller({ userId: null });
    await expect(
      caller.create({
        title: "",
        content: "c",
        authorId: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
      })
    ).rejects.toBeInstanceOf(TRPCError);

    services.updatePost.mockRejectedValueOnce(new Error("Invalid content"));
    await expect(
      caller.update({
        id: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
        patch: { content: "" },
        userId: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
      })
    ).rejects.toBeInstanceOf(TRPCError);

    services.deletePost.mockRejectedValueOnce(new Error("Not authorized"));
    await expect(
      caller.remove({
        id: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
        userId: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
      })
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("remove returns success on service success", async () => {
    services.deletePost.mockResolvedValueOnce(undefined);
    const caller = postsRouter.createCaller({ userId: null });
    const res = await caller.remove({
      id: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
      userId: "b3d8c4a3-3f2f-4d1c-9a45-d0ccd7f24f20",
    });
    expect(res).toEqual({ success: true });
  });
});
