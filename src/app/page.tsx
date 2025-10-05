import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { PostCard, type PostDto } from "@/components/posts/PostCard";
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

type HomePageSearchParams = {
  page?: string | string[];
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<HomePageSearchParams> | HomePageSearchParams;
}) {
  const session = await getServerAuthSession();
  const isLoggedIn = Boolean(session?.user?.id);

  const resolvedSearchParams =
    typeof searchParams === "object" && "then" in (searchParams as object)
      ? await (searchParams as Promise<HomePageSearchParams>)
      : (searchParams as HomePageSearchParams | undefined);

  const rawPage = resolvedSearchParams?.page;
  const parsedPage = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const currentPage = Number.isFinite(Number(parsedPage))
    ? Math.max(1, Number(parsedPage))
    : 1;

  const limit = 9;

  let feedPosts: PostDto[] = [];
  let feedError: string | null = null;
  let totalPages = 1;

  try {
    const data = await listPosts({
      limit,
      page: currentPage,
      publishedOnly: true,
    });
    feedPosts = data.items.map(serializePost);
    totalPages = data.totalPages;
  } catch (error) {
    feedError = error instanceof Error ? error.message : "Unable to load posts";
  }

  const buildPageHref = (page: number) => {
    if (page <= 1) {
      return "/";
    }
    const params = new URLSearchParams();
    params.set("page", String(page));
    return `/?${params.toString()}`;
  };

  if (!feedError && totalPages > 0 && currentPage > totalPages) {
    redirect(buildPageHref(totalPages));
  }

  const clampedPage = Math.min(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Latest posts
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Explore the newest updates and insights from our community.
            </p>
          </div>
          {isLoggedIn ? (
            <Link
              href="/posts/manage"
              className="inline-flex items-center justify-center rounded-pill bg-navy px-5 py-2 font-semibold text-white transition-colors duration-150 hover:bg-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Manage your posts
            </Link>
          ) : null}
        </header>

        {feedError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {feedError}
          </div>
        ) : null}

        {!feedError && feedPosts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
            No posts published yet. Check back soon!
          </div>
        ) : null}

        {!feedError && feedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  href={`/posts/${post.id}`}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                <Link
                  aria-disabled={clampedPage <= 1}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium transition ${
                    clampedPage <= 1
                      ? "cursor-not-allowed text-slate-400"
                      : "text-navy hover:text-indigo"
                  }`}
                  href={buildPageHref(Math.max(1, clampedPage - 1))}
                  prefetch
                >
                  ← Previous
                </Link>
                <span className="font-medium">
                  Page {clampedPage} of {totalPages}
                </span>
                <Link
                  aria-disabled={clampedPage >= totalPages}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium transition ${
                    clampedPage >= totalPages
                      ? "cursor-not-allowed text-slate-400"
                      : "text-navy hover:text-indigo"
                  }`}
                  href={buildPageHref(Math.min(totalPages, clampedPage + 1))}
                  prefetch
                >
                  Next →
                </Link>
              </nav>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
