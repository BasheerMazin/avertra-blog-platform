import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";

vi.mock("@/server/services/users", () => {
  type User = import("@/server/db/schema").User;
  return {
    getUserByEmail: vi.fn<(email: string) => Promise<User | null>>(),
  };
});

vi.mock("bcrypt", () => {
  return {
    default: {
      compare: vi.fn<(password: string, hash: string) => Promise<boolean>>(),
    },
  };
});

vi.mock("next-auth", () => {
  return {
    getServerSession: vi.fn(),
  };
});

import {
  authOptions,
  credentialsAuthorize,
  getServerAuthSession,
} from "@/auth";
import { getUserByEmail } from "@/server/services/users";
import bcrypt from "bcrypt";
import type { Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

type DbUser = import("@/server/db/schema").User;
function makeDbUser(overrides: Partial<DbUser> = {}): DbUser {
  const now = new Date();
  return {
    id: "u1",
    email: "user@example.com",
    name: "User",
    passwordHash: "hashed",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as DbUser;
}

describe("auth authorize (credentials)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects invalid schema (bad email/short password)", async () => {
    await expect(
      credentialsAuthorize({ email: "not-an-email", password: "123" })
    ).rejects.toThrow(/Invalid credentials/i);
  });

  it("rejects when user not found", async () => {
    const mockedGetUserByEmail = getUserByEmail as MockedFunction<
      typeof getUserByEmail
    >;
    mockedGetUserByEmail.mockResolvedValue(null);
    await expect(
      credentialsAuthorize({ email: "user@example.com", password: "123456" })
    ).rejects.toThrow(/Invalid credentials/i);
  });

  it("rejects when password mismatch", async () => {
    const mockedGetUserByEmail = getUserByEmail as MockedFunction<
      typeof getUserByEmail
    >;
    mockedGetUserByEmail.mockResolvedValue(makeDbUser());
    type CompareAsync = (password: string, hash: string) => Promise<boolean>;
    const bcryptCompareMock = vi.mocked(
      bcrypt.compare as unknown as CompareAsync
    );
    bcryptCompareMock.mockResolvedValue(false);

    await expect(
      credentialsAuthorize({ email: "user@example.com", password: "123456" })
    ).rejects.toThrow(/Invalid credentials/i);
  });

  it("resolves with id/email/name on success", async () => {
    const mockedGetUserByEmail = getUserByEmail as MockedFunction<
      typeof getUserByEmail
    >;
    mockedGetUserByEmail.mockResolvedValue(makeDbUser());
    type CompareAsync = (password: string, hash: string) => Promise<boolean>;
    const bcryptCompareMock = vi.mocked(
      bcrypt.compare as unknown as CompareAsync
    );
    bcryptCompareMock.mockResolvedValue(true);

    const res = await credentialsAuthorize({
      email: "user@example.com",
      password: "123456",
    });
    expect(res).toEqual({ id: "u1", email: "user@example.com", name: "User" });
  });
});

describe("auth callbacks", () => {
  it("jwt merges user name/email when present", async () => {
    const token: JWT = { sub: "u1", email: "old@example.com", name: "Old" };
    const user: NextAuthUser = {
      id: "u1",
      email: "new@example.com",
      name: "New",
    };
    type JwtCallback = NonNullable<(typeof authOptions)["callbacks"]>["jwt"];
    type JwtArgs = Parameters<NonNullable<JwtCallback>>[0];
    const merged = await authOptions.callbacks!.jwt!({
      token,
      user,
    } as JwtArgs);
    expect(merged.email).toBe("new@example.com");
    expect(merged.name).toBe("New");
  });

  it("session sets user.id from token.sub", async () => {
    const session: Session = {
      user: { id: "", email: "e@example.com", name: "Name" },
      expires: new Date().toISOString(),
    };
    const token: JWT = { sub: "u1" };
    type SessionCallback = NonNullable<
      (typeof authOptions)["callbacks"]
    >["session"];
    type SessionArgs = Parameters<NonNullable<SessionCallback>>[0];
    const res = await authOptions.callbacks!.session!({
      session,
      token,
    } as SessionArgs);
    expect(res.user).toBeDefined();
    expect((res.user as Session["user"]).id).toBe("u1");
  });

  it("getServerAuthSession proxies to next-auth", async () => {
    const mocked = vi.mocked((await import("next-auth")).getServerSession);
    mocked.mockResolvedValueOnce({ mocked: true });
    const res = await getServerAuthSession();
    expect(res).toEqual({ mocked: true });
    expect(mocked).toHaveBeenCalledWith(authOptions);
  });
});
