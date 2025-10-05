import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { UserPostsManager } from "@/components/posts/UserPostsManager";
import type { PostDto } from "@/components/posts/PostCard";
import { listPosts, type Post } from "@/server/services/posts";

export const revalidate = 0;

function serializePost(post: Post): PostDto {
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
  };
}
type ManageSearchParams = {
  page?: string | string[];
};

export default async function ManagePostsPage({
  searchParams,
}: {
  searchParams?: Promise<ManageSearchParams> | ManageSearchParams;
}) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/signin");
  }

  const resolvedSearchParams =
    typeof searchParams === "object" && "then" in (searchParams as object)
      ? await (searchParams as Promise<ManageSearchParams>)
      : (searchParams as ManageSearchParams | undefined);

  const rawPage = resolvedSearchParams?.page;
  const parsedPage = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const page = Number.isFinite(Number(parsedPage))
    ? Math.max(1, Number(parsedPage))
    : 1;

  const limit = 8;

  let posts: PostDto[] = [];
  let errorMessage: string | null = null;
  let totalPages = 1;

  try {
    const data = await listPosts({
      authorId: userId,
      limit,
      page,
    });
    posts = data.items.map(serializePost);
    totalPages = data.totalPages;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load your posts";
  }

  if (!errorMessage && totalPages > 0 && page > totalPages) {
    const target =
      totalPages <= 1 ? "/posts/manage" : `/posts/manage?page=${totalPages}`;
    redirect(target);
  }

  const clampedPage = Math.max(1, Math.min(page, totalPages));

  const pagination = {
    page: clampedPage,
    totalPages,
  } as const;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Manage your posts
        </h1>
        <p className="text-base text-slate-600">
          Create drafts, publish updates, and curate your writing from one
          place.
        </p>
      </div>
      <UserPostsManager
        posts={posts}
        errorMessage={errorMessage}
        pagination={pagination}
      />
    </div>
  );
}
