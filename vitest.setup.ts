import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";

afterEach(() => {
  cleanup();
});

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname?: string } | URL;
    [key: string]: unknown;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href && typeof href === "object" && "pathname" in href
        ? (href.pathname as string)
        : "";
    return React.createElement("a", { href: resolvedHref, ...props }, children);
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) =>
    React.createElement("img", props),
}));
