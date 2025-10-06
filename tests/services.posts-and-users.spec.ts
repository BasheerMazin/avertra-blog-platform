import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  dbState,
  selectMock,
  insertMock,
  updateMock,
  deleteMock,
  deleteWhereMock,
  findPostMock,
  findUserMock,
  createCountChain,
  createItemsChain,
} = vi.hoisted(() => {
  const localState = {
    countRows: [{ value: 0 }],
    items: [] as Array<Record<string, unknown>>,
    insertResult: [] as Array<Record<string, unknown>>,
    updateResult: [] as Array<Record<string, unknown>>,
    deleteResult: undefined as unknown,
    lastInsertValues: null as Record<string, unknown> | null,
    lastUpdateValues: null as Record<string, unknown> | null,
  };

  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  const delWhere = vi.fn();
  const findPost = vi.fn<() => Promise<Record<string, unknown> | null>>();
  const findUser = vi.fn<() => Promise<Record<string, unknown> | null>>();

  const createCountChain = () => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => localState.countRows),
    })),
  });

  const createItemsChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.offset = vi.fn(async () => localState.items);
    return chain;
  };

  return {
    dbState: localState,
    selectMock: select,
    insertMock: insert,
    updateMock: update,
    deleteMock: del,
    deleteWhereMock: delWhere,
    findPostMock: findPost,
    findUserMock: findUser,
    createCountChain,
    createItemsChain,
  } as const;
});

selectMock.mockImplementation((arg?: unknown) =>
  arg ? createCountChain() : createItemsChain()
);

vi.mock("@/server/db/client", async () => {
  const schema = await vi.importActual<typeof import("@/server/db/schema")>(
    "@/server/db/schema"
  );
  return {
    schema,
    db: {
      select: selectMock,
      insert: insertMock,
      update: updateMock,
      delete: deleteMock,
      query: {
        posts: { findFirst: findPostMock },
        users: { findFirst: findUserMock },
      },
    },
  };
});

import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from "@/server/services/posts";
import {
  createUser,
  getUserByEmail,
  getUserById,
} from "@/server/services/users";

beforeEach(() => {
  dbState.countRows = [{ value: 0 }];
  dbState.items = [];
  dbState.insertResult = [];
  dbState.updateResult = [];
  dbState.deleteResult = undefined;
  dbState.lastInsertValues = null;
  dbState.lastUpdateValues = null;

  vi.clearAllMocks();
  selectMock.mockImplementation((arg?: unknown) =>
    arg ? createCountChain() : createItemsChain()
  );
  insertMock.mockImplementation(() => {
    const returning = vi.fn(async () => dbState.insertResult);
    const values = vi.fn((input: Record<string, unknown>) => {
      dbState.lastInsertValues = input;
      return { returning };
    });
    return { values };
  });
  updateMock.mockImplementation(() => {
    const returning = vi.fn(async () => dbState.updateResult);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn((input: Record<string, unknown>) => {
      dbState.lastUpdateValues = input;
      return { where };
    });
    return { set };
  });
  deleteWhereMock.mockImplementation(async () => dbState.deleteResult);
  deleteMock.mockImplementation(() => ({ where: deleteWhereMock }));
  findPostMock.mockImplementation(async () => null);
  findUserMock.mockImplementation(async () => null);
});

afterAll(() => {
  vi.resetModules();
});

describe("posts service", () => {
  it("throws when listPosts receives invalid pagination", async () => {
    await expect(listPosts({ limit: Number.NaN })).rejects.toThrow(
      "Invalid limit"
    );
    await expect(
      listPosts({ page: "nope" as unknown as number })
    ).rejects.toThrow("Invalid page");
  });

  it("throws for invalid author id input", async () => {
    await expect(listPosts({ authorId: "" })).rejects.toThrow(
      "Invalid authorId"
    );
  });

  it("lists posts with computed pagination metadata", async () => {
    dbState.countRows = [{ value: 12 }];
    const sampleItems = [
      { id: "post-1", createdAt: new Date("2024-01-01") },
      { id: "post-2", createdAt: new Date("2024-01-02") },
    ];
    dbState.items = sampleItems;

    const result = await listPosts({ limit: 5, page: 2, publishedOnly: true });

    expect(result.items).toEqual(sampleItems);
    expect(result.limit).toBe(5);
    expect(result.page).toBe(2);
    expect(result.total).toBe(12);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(selectMock).toHaveBeenCalledTimes(2);
  });

  it("validates post id when retrieving", async () => {
    await expect(getPost(" ")).rejects.toThrow("Invalid post id");
  });

  it("returns a post from the database", async () => {
    const post = { id: "post-1" };
    findPostMock.mockResolvedValueOnce(post);

    await expect(getPost("post-1")).resolves.toEqual(post);
  });

  it("validates new post payload", async () => {
    await expect(
      createPost({ title: "", content: "body", authorId: "user-1" })
    ).rejects.toThrow("Title is required");
    await expect(
      createPost({ title: "Title", content: "", authorId: "user-1" })
    ).rejects.toThrow("Content is required");
    await expect(
      createPost({ title: "Title", content: "Body", authorId: "" })
    ).rejects.toThrow("Author id is required");
  });

  it("requires an existing author before creating", async () => {
    findUserMock.mockResolvedValueOnce(null);

    await expect(
      createPost({
        title: "Title",
        content: "Body",
        authorId: "user-1",
      })
    ).rejects.toThrow("Author not found");
  });

  it("enforces boolean published flag", async () => {
    findUserMock.mockResolvedValueOnce({ id: "user-1" });

    await expect(
      createPost({
        title: "Title",
        content: "Body",
        authorId: "user-1",
        published: "yes" as unknown as boolean,
      })
    ).rejects.toThrow("Invalid published flag");
  });

  it("creates a post and returns the inserted record", async () => {
    findUserMock.mockResolvedValueOnce({ id: "user-1" });
    const created = {
      id: "post-1",
      title: "Title",
      content: "Body",
      authorId: "user-1",
      published: false,
    };
    dbState.insertResult = [created];

    await expect(
      createPost({ title: "Title", content: "Body", authorId: "user-1" })
    ).resolves.toEqual(created);
    expect(dbState.lastInsertValues).toMatchObject({
      title: "Title",
      content: "Body",
      authorId: "user-1",
      published: false,
    });
  });

  it("validates update inputs and ownership", async () => {
    await expect(updatePost("", { title: "New" }, "user-1")).rejects.toThrow(
      "Invalid post id"
    );
    await expect(updatePost("post-1", {}, "")).rejects.toThrow(
      "Invalid user id"
    );

    findPostMock.mockResolvedValueOnce(null);
    await expect(
      updatePost("post-1", { title: "New" }, "user-1")
    ).rejects.toThrow("Post not found");

    findPostMock.mockResolvedValueOnce({ id: "post-1", authorId: "other" });
    await expect(
      updatePost("post-1", { title: "New" }, "user-1")
    ).rejects.toThrow("Not authorized to modify this post");

    findPostMock.mockResolvedValueOnce({ id: "post-1", authorId: "user-1" });
    await expect(updatePost("post-1", {}, "user-1")).rejects.toThrow(
      "No fields to update"
    );

    findPostMock.mockResolvedValueOnce({ id: "post-1", authorId: "user-1" });
    await expect(
      updatePost("post-1", { title: " ", content: "" }, "user-1")
    ).rejects.toThrow("Invalid title");
  });

  it("updates a post and returns the new record", async () => {
    const stored = {
      id: "post-1",
      authorId: "user-1",
      title: "Old",
      content: "Old",
      published: false,
    };
    findPostMock.mockResolvedValueOnce(stored);
    const updated = { ...stored, title: "Updated", published: true };
    dbState.updateResult = [updated];

    await expect(
      updatePost("post-1", { title: "Updated", published: true }, "user-1")
    ).resolves.toEqual(updated);

    expect(dbState.lastUpdateValues).toMatchObject({
      title: "Updated",
      published: true,
    });
    expect(dbState.lastUpdateValues?.updatedAt).toBeInstanceOf(Date);
  });

  it("validates delete permissions", async () => {
    await expect(deletePost("", "user-1")).rejects.toThrow("Invalid post id");
    await expect(deletePost("post-1", "")).rejects.toThrow("Invalid user id");

    findPostMock.mockResolvedValueOnce(null);
    await expect(deletePost("post-1", "user-1")).rejects.toThrow(
      "Post not found"
    );

    findPostMock.mockResolvedValueOnce({ id: "post-1", authorId: "other" });
    await expect(deletePost("post-1", "user-1")).rejects.toThrow(
      "Not authorized to delete this post"
    );
  });

  it("deletes a post when authorized", async () => {
    findPostMock.mockResolvedValueOnce({ id: "post-1", authorId: "user-1" });

    await expect(deletePost("post-1", "user-1")).resolves.toBeUndefined();
    expect(deleteMock).toHaveBeenCalled();
    expect(deleteWhereMock).toHaveBeenCalled();
  });
});

describe("users service", () => {
  it("validates email lookups", async () => {
    await expect(getUserByEmail(" ")).rejects.toThrow("Invalid email");
  });

  it("returns a user by email and trims whitespace", async () => {
    const user = { id: "user-1", email: "user@example.com" };
    findUserMock.mockResolvedValueOnce(user);

    await expect(getUserByEmail(" user@example.com ")).resolves.toEqual(user);
  });

  it("validates user id lookups", async () => {
    await expect(getUserById(" ")).rejects.toThrow("Invalid user id");
  });

  it("returns a user by id", async () => {
    const user = { id: "user-1" };
    findUserMock.mockResolvedValueOnce(user);

    await expect(getUserById("user-1")).resolves.toEqual(user);
  });

  it("validates new user payload", async () => {
    await expect(
      createUser({ email: "", passwordHash: "hash" })
    ).rejects.toThrow("Email is required");
    await expect(
      createUser({ email: "user@example.com", passwordHash: "" })
    ).rejects.toThrow("Password hash is required");
    await expect(
      createUser({
        email: "user@example.com",
        passwordHash: "hash",
        name: 123 as unknown as string,
      })
    ).rejects.toThrow("Invalid name");
  });

  it("rejects duplicate emails", async () => {
    findUserMock.mockResolvedValueOnce({ id: "user-1" });

    await expect(
      createUser({ email: "user@example.com", passwordHash: "hash" })
    ).rejects.toThrow("Email already registered");
  });

  it("creates a new user", async () => {
    findUserMock.mockResolvedValueOnce(null);
    const createdUser = {
      id: "user-2",
      email: "user@example.com",
      name: "Avertra",
      passwordHash: "hash",
    };
    dbState.insertResult = [createdUser];

    await expect(
      createUser({
        email: " user@example.com ",
        passwordHash: "hash ",
        name: "Avertra",
      })
    ).resolves.toEqual(createdUser);

    expect(dbState.lastInsertValues).toMatchObject({
      email: "user@example.com",
      passwordHash: "hash",
      name: "Avertra",
    });
  });
});
