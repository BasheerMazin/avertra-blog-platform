"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PostCard, type PostDto } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";

import { PostForm, type PostFormResult, type PostFormValues } from "./PostForm";

type UserPostsManagerProps = {
  posts: PostDto[];
  errorMessage?: string | null;
  pagination: {
    page: number;
    totalPages: number;
  };
};

export function UserPostsManager({
  posts,
  errorMessage,
  pagination,
}: UserPostsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = useCallback(
    async (values: PostFormValues) => {
      try {
        const response = await fetch(`/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const json = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        if (!response.ok) {
          const message = json?.error?.message ?? "Unable to create post";
          return { error: message } satisfies PostFormResult;
        }
        setIsCreating(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create post";
        return { error: message } satisfies PostFormResult;
      }
      return {} satisfies PostFormResult;
    },
    [router]
  );

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Your posts</h2>
        <div className="flex gap-3">
          {isCreating ? (
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Close editor
            </Button>
          ) : (
            <Button onClick={() => setIsCreating(true)}>New post</Button>
          )}
        </div>
      </div>

      {isCreating ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Create post</h3>
          <p className="mt-1 text-sm text-slate-600">
            Compose your draft and decide whether to publish right away.
          </p>
          <div className="mt-6">
            <PostForm
              key="create"
              initialValues={{ title: "", content: "", published: false }}
              submitLabel="Create post"
              submittingLabel="Creating..."
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {!errorMessage && posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          You have no posts yet
        </div>
      ) : null}

      {!errorMessage && posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} href={`/posts/${post.id}`} />
            ))}
          </div>
          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const nextPage = Math.max(1, pagination.page - 1);
                  const params = new URLSearchParams(searchParams.toString());
                  if (nextPage <= 1) {
                    params.delete("page");
                  } else {
                    params.set("page", String(nextPage));
                  }
                  const query = params.toString();
                  router.push(
                    query ? `/posts/manage?${query}` : "/posts/manage"
                  );
                }}
              >
                ← Previous
              </Button>
              <span className="font-medium">
                Page {Math.min(pagination.page, pagination.totalPages)} of{" "}
                {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const nextPage = Math.min(
                    pagination.totalPages,
                    pagination.page + 1
                  );
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(nextPage));
                  router.push(`/posts/manage?${params.toString()}`);
                }}
              >
                Next →
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
