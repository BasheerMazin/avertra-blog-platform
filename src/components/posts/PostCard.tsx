"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PostDto = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type PostCardProps = {
  post: PostDto;
  href?: string;
  actions?: ReactNode;
};

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getDateLabel(value: string | Date) {
  const dateValue = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(dateValue.getTime())) {
    return "";
  }
  return formatter.format(dateValue);
}

export function PostCard({ post, href, actions }: PostCardProps) {
  const createdAt = getDateLabel(post.createdAt);
  const contentPreview =
    post.content.length > 160
      ? `${post.content.slice(0, 157).trimEnd()}...`
      : post.content;

  const showReadMore = Boolean(href);

  const cardContent = (
    <article className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative z-10 flex flex-1 flex-col gap-4 transition duration-200 group-hover:blur-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {createdAt ? <span>{createdAt}</span> : null}
          {!post.published ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Draft
            </span>
          ) : null}
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{post.title}</h2>
        <p className="overflow-hidden text-ellipsis text-sm text-slate-600">
          {contentPreview}
        </p>
        {actions ? (
          <div className="mt-auto flex flex-col gap-2">{actions}</div>
        ) : null}
      </div>
      {showReadMore ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 opacity-0 transition duration-200 group-hover:opacity-100">
          <span className="flex items-center gap-2 text-2xl font-semibold text-navy">
            Read more
            <span aria-hidden>→</span>
          </span>
        </div>
      ) : null}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
