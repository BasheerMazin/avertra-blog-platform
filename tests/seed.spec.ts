import { describe, it, expect, vi, beforeEach } from "vitest";

type DbUser = import("@/server/db/schema").User;
type DbPost = import("@/server/db/schema").Post;
type InsertsArray = Record<string, unknown>[];

type DbMock = {
  insert: (table: unknown) => {
    values: (vals: Record<string, unknown>) => {
      onConflictDoNothing: (arg: unknown) => unknown;
    };
  };
  query: {
    users: { findFirst: (q?: unknown) => Promise<DbUser | undefined> };
    posts: { findFirst: (q?: unknown) => Promise<DbPost | undefined> };
  };
};
type SchemaMock = { users: object; posts: object };
type PoolMock = { end: () => Promise<void> };

vi.mock("@/server/db/client", () => {
  const inserts: InsertsArray = [];
  const usersFindFirst = vi.fn<(q?: unknown) => Promise<DbUser | undefined>>();
  const postsFindFirst = vi.fn<(q?: unknown) => Promise<DbPost | undefined>>();
  const insert: DbMock["insert"] = () => ({
    values: (vals: Record<string, unknown>) => {
      inserts.push(vals);
      return { onConflictDoNothing: () => ({}) };
    },
  });
  const query: DbMock["query"] = {
    users: { findFirst: usersFindFirst },
    posts: { findFirst: postsFindFirst },
  };
  const db: DbMock = { insert, query };
  const schema: SchemaMock = { users: {}, posts: {} };
  const pool: PoolMock = { end: vi.fn(async () => undefined) };
  return { db, schema, pool, __m: { inserts, usersFindFirst, postsFindFirst } };
});

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn(async () => "hashed") },
}));

describe("seed script", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("runs without touching real DB using mocks", async () => {
    const client = (await import("@/server/db/client")) as unknown as {
      __m: {
        inserts: InsertsArray;
        usersFindFirst: ReturnType<
          typeof vi.fn<(q?: unknown) => Promise<DbUser | undefined>>
        >;
        postsFindFirst: ReturnType<
          typeof vi.fn<(q?: unknown) => Promise<DbPost | undefined>>
        >;
      };
    };
    // Return a fake user so the script proceeds
    client.__m.usersFindFirst.mockResolvedValue({
      id: "u1",
      email: "admin@avertra.com",
    } as DbUser);
    client.__m.postsFindFirst.mockResolvedValue(undefined);

    await import("@/server/db/seed");
    expect(client.__m.inserts.length).toBeGreaterThan(0);
  });
});
