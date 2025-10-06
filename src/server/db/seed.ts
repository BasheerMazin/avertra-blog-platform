import "dotenv/config";
import { db, schema, pool } from "./client";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function main() {
  const demoEmail = "admin@avertra.com";

  const passwordHash = await bcrypt.hash("avertraAdmin123", 10);

  await db
    .insert(schema.users)
    .values({
      email: demoEmail,
      name: "Admin",
      passwordHash,
    })
    .onConflictDoNothing({ target: schema.users.email });

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, demoEmail),
  });
  if (!user) throw new Error("Failed to create or fetch admin user");

  const postsData = [
    {
      title: "Welcome to the Avertra Blog",
      content: "Kick off your journey with an overview of the platform and what you can build next.",
      published: true,
    },
    {
      title: "Exploring Next.js 15 Features",
      content: "Highlights from the latest Next.js release and how they power this assessment project.",
      published: true,
    },
    {
      title: "Why Drizzle ORM Matters",
      content: "A quick dive into using Drizzle for type-safe database access in modern applications.",
      published: true,
    },
    {
      title: "Authentication with NextAuth",
      content: "Lessons learned while wiring credentials-based login and protecting author workflows.",
      published: true,
    },
    {
      title: "Tailwind CSS 4 Tips",
      content: "A few styling patterns used throughout the Avertra blog interface to stay consistent.",
      published: true,
    },
    {
      title: "Vitest Testing Strategies",
      content: "How the project approaches frontend and backend coverage with Vitest and Testing Library.",
      published: true,
    },
    {
      title: "Seeding Reliable Demo Data",
      content: "Guidelines for creating deterministic seeds that showcase pagination and author tools.",
      published: true,
    },
    {
      title: "TRPC and React Query Synergy",
      content: "Leveraging typed routers and hooks to keep data fetching predictable and resilient.",
      published: true,
    },
    {
      title: "Dockerizing Fullstack Apps",
      content: "The docker-compose workflow used here to spin up PostgreSQL and the Next.js dev server.",
      published: true,
    },
    {
      title: "Pagination UX Considerations",
      content: "Observations on building a pleasant pagination experience across public feeds and dashboards.",
      published: true,
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
