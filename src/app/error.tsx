"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-3 text-center">
        <span className="block text-6xl font-black tracking-tight text-rose-600 md:text-7xl">
          Error
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Something went wrong!
        </h1>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-pill bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
