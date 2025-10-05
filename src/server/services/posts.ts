import { db, schema } from "../db/client";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
export type { Post, NewPost } from "../db/schema";

type ListArgs = {
  authorId?: string;
  publishedOnly?: boolean;
  limit?: number; // default 10, max 100
  page?: number; // default 1
};

export async function listPosts(args: ListArgs = {}) {
  const { authorId, publishedOnly } = args;
  let { limit = 10, page = 1 } = args;

  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    throw new Error("Invalid limit");
  }
  limit = Math.max(1, Math.min(100, Math.floor(limit)));
  if (typeof page !== "number" || !Number.isFinite(page)) {
    throw new Error("Invalid page");
  }
  page = Math.max(1, Math.floor(page));

  const conditions: SQL[] = [];
  if (authorId != null) {
    if (typeof authorId !== "string" || authorId.trim() === "") {
      throw new Error("Invalid authorId");
    }
    conditions.push(eq(schema.posts.authorId, authorId));
  }
  if (publishedOnly) {
    conditions.push(eq(schema.posts.published, true));
  }
  const [{ value: total }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(schema.posts)
    .where(conditions.length ? and(...conditions) : undefined);

  const offset = (page - 1) * limit;

  const items = await db
    .select()
    .from(schema.posts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.posts.createdAt))
    .limit(limit)
    .offset(offset);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNextPage = page < totalPages;

  return { items, page, limit, total, totalPages, hasNextPage } as const;
}

export async function getPost(id: string) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid post id");
  }
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, id),
  });
  return post ?? null;
}

export async function createPost(input: {
  title: string;
  content: string;
  authorId: string;
  published?: boolean;
}) {
  const { title, content, authorId, published } = input;

  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Title is required");
  }
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Content is required");
  }
  if (typeof authorId !== "string" || authorId.trim() === "") {
    throw new Error("Author id is required");
  }

  const author = await db.query.users.findFirst({
    where: eq(schema.users.id, authorId),
  });
  if (!author) {
    throw new Error("Author not found");
  }

  if (published !== undefined && typeof published !== "boolean") {
    throw new Error("Invalid published flag");
  }

  const publishedValue = published ?? false;

  const [created] = await db
    .insert(schema.posts)
    .values({ title, content, authorId, published: publishedValue })
    .returning();

  if (!created) {
    throw new Error("Could not create post");
  }
  return created;
}

export async function updatePost(
  id: string,
  patch: { title?: string; content?: string; published?: boolean },
  userId: string // user requesting the update
) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid post id");
  }
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Invalid user id");
  }

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, id),
  });
  if (!post) {
    throw new Error("Post not found");
  }
  if (post.authorId !== userId) {
    throw new Error("Not authorized to modify this post");
  }

  const update: { title?: string; content?: string; published?: boolean } = {};
  if (patch.title !== undefined) {
    if (typeof patch.title !== "string" || patch.title.trim() === "") {
      throw new Error("Invalid title");
    }
    update.title = patch.title;
  }
  if (patch.content !== undefined) {
    if (typeof patch.content !== "string" || patch.content.trim() === "") {
      throw new Error("Invalid content");
    }
    update.content = patch.content;
  }
  if (patch.published !== undefined) {
    if (typeof patch.published !== "boolean") {
      throw new Error("Invalid published flag");
    }
    update.published = patch.published;
  }

  if (Object.keys(update).length === 0) {
    throw new Error("No fields to update");
  }

  const [updated] = await db
    .update(schema.posts)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(schema.posts.id, id))
    .returning();

  if (!updated) {
    throw new Error("Could not update post");
  }
  return updated;
}

export async function deletePost(id: string, userId: string) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid post id");
  }
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Invalid user id");
  }

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, id),
  });
  if (!post) {
    throw new Error("Post not found");
  }
  if (post.authorId !== userId) {
    throw new Error("Not authorized to delete this post");
  }

  await db.delete(schema.posts).where(eq(schema.posts.id, id));
}
