"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

import { PostForm, type PostFormResult, type PostFormValues } from "./PostForm";
import type { PostDto } from "./PostCard";

type PostOwnerActionsProps = {
  post: PostDto;
};

export function PostOwnerActions({ post }: PostOwnerActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdate = useCallback(
    async (values: PostFormValues) => {
      try {
        const response = await fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const json = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        if (!response.ok) {
          const message = json?.error?.message ?? "Unable to update post";
          return { error: message } satisfies PostFormResult;
        }
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update post";
        return { error: message } satisfies PostFormResult;
      }
      return {} satisfies PostFormResult;
    },
    [post.id, router]
  );

  const handleTogglePublish = useCallback(async () => {
    setIsPublishing(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        const message = json?.error?.message ?? "Unable to update post";
        setActionError(message);
        return;
      }
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update post";
      setActionError(message);
    } finally {
      setIsPublishing(false);
    }
  }, [post.id, post.published, router]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      const json = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        const message = json?.error?.message ?? "Unable to delete post";
        setDeleteError(message);
        return;
      }
      router.replace("/posts/manage");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete post";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [post.id, router]);

  const isBusy = isPublishing || isDeleting;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setIsEditing((current) => !current)}
          disabled={isBusy}
        >
          {isEditing ? "Close editor" : "Edit post"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void handleTogglePublish()}
          disabled={isBusy}
        >
          {isPublishing
            ? "Updating..."
            : post.published
            ? "Mark as draft"
            : "Publish"}
        </Button>
        <Button
          variant="outline"
          className="border-rose-300 text-rose-600 hover:border-rose-400 hover:text-rose-500"
          onClick={() => void handleDelete()}
          disabled={isBusy}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
      {actionError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}
      {deleteError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {deleteError}
        </div>
      ) : null}
      {isEditing ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <PostForm
            key={post.id}
            initialValues={{
              title: post.title,
              content: post.content,
              published: post.published,
            }}
            submitLabel="Save changes"
            submittingLabel="Saving..."
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
