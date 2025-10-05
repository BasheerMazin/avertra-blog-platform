import Image from "next/image";
import Link from "next/link";

import { getServerAuthSession } from "@/auth";

export async function Navbar() {
  const session = await getServerAuthSession();
  const userLabel = session?.user?.name ?? session?.user?.email ?? null;

  return (
    <header className="sticky top-4 z-50 mx-auto flex h-[5rem] w-[90%] items-center justify-between border-2 border-cyan-tint px-8 py-3 bg-white">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src={"/avertra-horizontal-dark-logo.webp"}
          alt="Avertra Logo"
          width={130}
          height={26}
        />
      </Link>

      {userLabel ? (
        <span className="text-sm font-medium text-navy">{userLabel}</span>
      ) : (
        <Link
          href="/signin"
          className="rounded-full bg-navy px-6 py-2 text-sm text-white hover:bg-indigo "
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
