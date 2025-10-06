import { getServerAuthSession } from "@/auth";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const session = await getServerAuthSession();
  const userLabel = session?.user?.name ?? session?.user?.email ?? null;

  return <NavbarClient userLabel={userLabel} />;
}
