import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z as zod } from "zod";
import { getUserByEmail } from "@/server/services/users";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";

const credentialsSchema = zod.object({
  email: zod.email(),
  password: zod.string().min(6),
});

export async function credentialsAuthorize(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid credentials");
  }
  const { email, password } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    throw new Error("Invalid credentials");
  }

  return { id: user.id, email: user.email, name: user.name ?? undefined };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: credentialsAuthorize,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
