import "dotenv/config";
import { db, schema, pool } from "./client";
import { and, eq } from "drizzle-orm";

async function main() {
  const demoEmail = "admin@avertra.com";

  await db
    .insert(schema.users)
    .values({
      email: demoEmail,
      name: "Admin",
      passwordHash: "__replace_me__",
    })
    .onConflictDoNothing({ target: schema.users.email });

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, demoEmail),
  });
  if (!user) throw new Error("Failed to create or fetch admin user");

  const postsData = [
    {
      title: "First test post from Admin",
      content: "This is a demo post to get you started.",
      published: true,
    },
    {
      title: "Second test post from Admin",
      content: "This is a second demo post to get you started.",
      published: true,
    },
    {
      title: "Third test post from Admin",
      content: "This is a third demo post to get you started.",
      published: false,
    },
  ] as const;

  for (const post of postsData) {
    const existing = await db.query.posts.findFirst({
      where: and(
        eq(schema.posts.authorId, user.id),
        eq(schema.posts.title, post.title)
      ),
    });
    if (!existing) {
      await db.insert(schema.posts).values({
        title: post.title,
        content: post.content,
        authorId: user.id,
        published: post.published,
      });
    }
  }

  await pool.end();
}

main()
  .then(() => {
    console.log("Seed complete");
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
