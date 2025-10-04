import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({ end: vi.fn() })),
}));

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => ({ __db: true })),
}));

describe("db client module", () => {
  beforeAll(() => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db";
  });

  it("initializes drizzle with schema export available", async () => {
    const mod = await import("@/server/db/client");
    expect(mod.db).toBeDefined();
    expect(mod.schema).toBeDefined();
  });
});
