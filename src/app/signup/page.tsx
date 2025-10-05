import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account · Avertra Blog",
  description:
    "Create your account to publish and collaborate across the Avertra blog platform.",
};

export default function SignUpPage() {
  return (
    <section className="py-16" aria-labelledby="signup-heading">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="space-y-2 text-center">
            <h1
              id="signup-heading"
              className="text-2xl font-semibold text-navy"
            >
              Create your account
            </h1>
          </div>
          <div className="mt-8">
            <SignUpForm />
          </div>
        </div>
      </div>
    </section>
  );
}
