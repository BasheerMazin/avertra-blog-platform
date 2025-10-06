"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/signin" });
      const nextUrl = result?.url ?? "/signin";
      router.replace(nextUrl);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      disabled={isPending}
      aria-busy={isPending}
      className="px-4 py-1 text-xs tracking-wide"
    >
      {isPending ? (
        <span className="flex items-center gap-2" aria-live="polite">
          <svg
            className="h-4 w-4 animate-spin text-navy"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Logging out…
        </span>
      ) : (
        "Log out"
      )}
    </Button>
  );
}
