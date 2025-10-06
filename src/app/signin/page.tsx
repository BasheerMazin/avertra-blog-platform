import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in · Avertra Blog",
  description:
    "Sign in to manage posts, drafts, and more across the Avertra blog platform.",
};

export default function SignInPage() {
  return (
    <section className="py-16" aria-labelledby="signin-heading">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="space-y-2 text-center">
            <h1
              id="signin-heading"
              className="text-2xl font-semibold text-navy"
            >
              Welcome back
            </h1>
          </div>
          <div className="mt-8">
            <Suspense fallback={null}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
