"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";

type NavbarClientProps = {
  userLabel: string | null;
};

export function NavbarClient({ userLabel }: NavbarClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky z-50 bg-mint-50 transition-all duration-200 ${
        isScrolled ? "top-0" : "top-8"
      }`}
    >
      <div className="mx-auto flex h-20 w-[80%] items-center justify-between border-2 border-cyan-tint bg-white px-8 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/avertra-horizontal-dark-logo.webp"}
            alt="Avertra Logo"
            width={130}
            height={26}
            priority
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-2xl font-medium text-navy hover:text-indigo"
          >
            Home
          </Link>
          <Link
            href="/posts/manage"
            className="text-2xl font-medium text-navy hover:text-indigo"
          >
            My posts
          </Link>
        </nav>

        {userLabel ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-navy">{userLabel}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/signin"
            className="rounded-full bg-navy px-6 py-2 text-sm text-white hover:bg-indigo "
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
