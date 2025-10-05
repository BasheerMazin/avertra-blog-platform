"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");

      if (typeof email !== "string" || typeof password !== "string") {
        setError("Email and password are required");
        return;
      }

      const confirmPasswordValue =
        typeof confirmPassword === "string" ? confirmPassword : "";

      const trimmedName = typeof name === "string" ? name.trim() : undefined;
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedConfirm = confirmPasswordValue.trim();

      const nextFieldErrors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};

      if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
        nextFieldErrors.email = "Enter a valid email address";
      }

      if (!trimmedPassword) {
        nextFieldErrors.password = "Password is required";
      } else if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
        nextFieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }

      if (!trimmedConfirm || trimmedPassword !== trimmedConfirm) {
        nextFieldErrors.confirmPassword = "Passwords do not match";
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError(null);
        return;
      }

      setFieldErrors({});

      if (!trimmedEmail) {
        setError("Please enter a valid email");
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPassword,
            ...(trimmedName ? { name: trimmedName } : {}),
          }),
        });

        const json = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;

        if (!response.ok) {
          const message = json?.error?.message ?? "Unable to create account";
          setError(message);
          return;
        }

        const signInResult = await signIn("credentials", {
          email: trimmedEmail,
          password: trimmedPassword,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Account created. Please sign in to continue");
          router.replace("/signin");
          router.refresh();
          return;
        }

        router.replace("/");
        router.refresh();
      } catch {
        setError("We could not process your registration. Please try again");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setError(null);
    setFormValues((prev) => {
      const updated = { ...prev, [name]: value };

      setFieldErrors((prevErrors) => {
        const next = { ...prevErrors };

        if (name === "password" || name === "confirmPassword") {
          const passwordValue = name === "password" ? value : updated.password;
          const confirmValue =
            name === "confirmPassword" ? value : updated.confirmPassword;
          const trimmedPasswordValue = passwordValue.trim();
          const trimmedConfirmValue = confirmValue.trim();

          if (!trimmedPasswordValue) {
            next.password = "Password is required";
          } else if (trimmedPasswordValue.length < MIN_PASSWORD_LENGTH) {
            next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
          } else {
            delete next.password;
          }

          if (
            trimmedConfirmValue &&
            trimmedPasswordValue !== trimmedConfirmValue
          ) {
            next.confirmPassword = "Passwords do not match";
          } else {
            delete next.confirmPassword;
          }
        } else if (name === "email") {
          if (!value.trim()) {
            next.email = "Enter a valid email address";
          } else if (!EMAIL_REGEX.test(value.trim())) {
            next.email = "Enter a valid email address";
          } else {
            delete next.email;
          }
        }

        return next;
      });

      return updated;
    });
  }, []);

  const trimmedName = formValues.name.trim();
  const trimmedEmail = formValues.email.trim();
  const trimmedPassword = formValues.password.trim();
  const trimmedConfirm = formValues.confirmPassword.trim();
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);

  const isSubmitDisabled =
    isSubmitting ||
    !trimmedName ||
    !trimmedEmail ||
    !EMAIL_REGEX.test(trimmedEmail) ||
    !trimmedPassword ||
    trimmedPassword.length < MIN_PASSWORD_LENGTH ||
    !trimmedConfirm ||
    trimmedPassword !== trimmedConfirm ||
    hasFieldErrors;

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Input
          label="Name"
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={formValues.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Input
          label="Email"
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={formValues.email}
          onChange={handleChange}
          aria-invalid={fieldErrors.email ? true : false}
          aria-describedby={
            fieldErrors.email ? "signup-email-error" : undefined
          }
          required
        />
        {fieldErrors.email ? (
          <p
            id="signup-email-error"
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
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          withPasswordToggle
          value={formValues.password}
          onChange={handleChange}
          aria-invalid={fieldErrors.password ? true : false}
          aria-describedby={
            fieldErrors.password ? "signup-password-error" : undefined
          }
          required
        />
        {fieldErrors.password ? (
          <p
            id="signup-password-error"
            className="text-sm text-pink-600"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Input
          label="Confirm password"
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          withPasswordToggle
          value={formValues.confirmPassword}
          onChange={handleChange}
          aria-invalid={fieldErrors.confirmPassword ? true : false}
          aria-describedby={
            fieldErrors.confirmPassword
              ? "signup-confirm-password-error"
              : undefined
          }
          required
        />
        {fieldErrors.confirmPassword ? (
          <p
            id="signup-confirm-password-error"
            className="text-sm text-pink-600"
            role="alert"
          >
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-pink-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        Create account
      </Button>
      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-semibold text-navy transition-colors hover:text-cyan"
        >
          Sign in instead
        </Link>
        .
      </p>
    </form>
  );
}
