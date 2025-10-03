import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";

export type { User, NewUser } from "../db/schema";

export async function getUserByEmail(email: string) {
  if (typeof email !== "string" || email.trim() === "") {
    throw new Error("Invalid email");
  }
  const trimmedEmail = email.trim();

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, trimmedEmail),
  });
  return user ?? null;
}

export async function getUserById(id: string) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid user id");
  }
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
  return user ?? null;
}

export async function createUser(input: {
  email: string;
  name?: string | null;
  passwordHash: string;
}) {
  const { email, name, passwordHash } = input;

  if (typeof email !== "string" || email.trim() === "") {
    throw new Error("Email is required");
  }
  if (typeof passwordHash !== "string" || passwordHash.trim() === "") {
    throw new Error("Password hash is required");
  }
  if (name != null && typeof name !== "string") {
    throw new Error("Invalid name");
  }

  const trimmedEmail = email.trim();
  const trimmedPasswordHash = passwordHash.trim();

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, trimmedEmail),
  });
  if (existing) {
    throw new Error("Email already registered");
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      email: trimmedEmail,
      name: name ?? null,
      passwordHash: trimmedPasswordHash,
    })
    .returning();

  if (!created) {
    throw new Error("Could not create user");
  }

  return created;
}
