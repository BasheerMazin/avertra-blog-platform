import { describe, it, expect } from "vitest";

import * as schema from "@/server/db/schema";

describe("db schema", () => {
  it("exports users and posts tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.posts).toBeDefined();
  });
});
