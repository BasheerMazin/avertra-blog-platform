"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formValues, setFormValues] = useState({ email: "", password: "" });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const emailValue = formData.get("email");
      const passwordValue = formData.get("password");

      const nextFieldErrors: { email?: string; password?: string } = {};
      const email = typeof emailValue === "string" ? emailValue.trim() : "";
      const password = typeof passwordValue === "string" ? passwordValue : "";

      if (!email) {
        nextFieldErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextFieldErrors.email = "Enter a valid email address";
      }

      if (!password.trim()) {
        nextFieldErrors.password = "Password is required.";
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError(null);
        return;
      }

      setFieldErrors({});
      setError(null);
      setIsSubmitting(true);

      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
          return;
        }

        const rawCallback = searchParams.get("callbackUrl");
        const target =
          rawCallback && rawCallback.startsWith("/") ? rawCallback : "/";
        router.replace(target);
        router.refresh();
      } catch {
        setError("Unable to sign in right now. Please try again");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, searchParams]
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const isSubmitDisabled =
    isSubmitting || !formValues.email.trim() || !formValues.password.trim();

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={fieldErrors.email ? true : false}
          aria-describedby={
            fieldErrors.email ? "signin-email-error" : undefined
          }
          value={formValues.email}
          onChange={handleChange}
          required
        />
        {fieldErrors.email ? (
          <p
            id="signin-email-error"
            className="text-sm text-pink-600"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          withPasswordToggle
          aria-invalid={fieldErrors.password ? true : false}
          aria-describedby={
            fieldErrors.password ? "signin-password-error" : undefined
          }
          value={formValues.password}
          onChange={handleChange}
          required
        />
        {fieldErrors.password ? (
          <p
            id="signin-password-error"
            className="text-sm text-pink-600"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-pink-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        Sign in
      </Button>
      <p className="text-sm text-slate-500">
        Need an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-navy transition-colors hover:text-cyan"
        >
          Create one here
        </Link>
        .
      </p>
    </form>
  );
}
