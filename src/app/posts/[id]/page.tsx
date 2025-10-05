import { notFound } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { PostOwnerActions } from "@/components/posts/PostOwnerActions";
import type { PostDto } from "@/components/posts/PostCard";
import { getPost } from "@/server/services/posts";

export const revalidate = 0;

const formatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function serializePost(post: Awaited<ReturnType<typeof getPost>>) {
  if (!post) {
    return null;
  }
  return {
    ...post,
    createdAt:
      post.createdAt instanceof Date
        ? post.createdAt.toISOString()
        : post.createdAt,
    updatedAt:
      post.updatedAt instanceof Date
        ? post.updatedAt.toISOString()
        : post.updatedAt,
  } satisfies PostDto;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerAuthSession();
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const isOwner = session?.user?.id === post.authorId;

  if (!post.published && !isOwner) {
    notFound();
  }

  const serialized = serializePost(post);
  if (!serialized) {
    notFound();
  }

  const createdAt = formatter.format(new Date(serialized.createdAt));

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-slate-100 via-white to-slate-100 shadow-[0_45px_100px_-50px_rgba(15,23,42,0.4)]" />
      <div className="relative space-y-10 rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-lg sm:p-12">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{createdAt}</span>
            {!post.published ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Draft
              </span>
            ) : null}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            {post.title}
          </h1>
        </header>

        <article className="whitespace-pre-line text-base leading-7 text-slate-700">
          {post.content}
        </article>

        {isOwner ? <PostOwnerActions post={serialized} /> : null}
      </div>
    </div>
  );
}
