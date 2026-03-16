import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// NextAuth requires a valid NEXTAUTH_URL; avoid "Invalid URL" when unset (e.g. local dev)
if (!process.env.NEXTAUTH_URL?.trim()) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

// JWT signing requires a non-empty secret (min 1 byte); avoid "ikm must be at least one byte" when unset
if (!process.env.NEXTAUTH_SECRET?.trim()) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET must be set in production");
  }
  process.env.NEXTAUTH_SECRET = "dev-secret-at-least-32-chars-for-jwt-signing";
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.password) return null;
        const ok = await compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, email: true },
        });
        if (
          dbUser?.email &&
          adminEmails.includes(dbUser.email.toLowerCase())
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });
          token.role = "admin";
        } else if (dbUser?.role) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        // Use database as source of truth for role so admin flag changes apply without re-login
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        const role = dbUser?.role ?? (token.role as string);
        (session.user as { role?: string }).role = role;
      }
      return session;
    },
  },
};

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export function isAdminByRole(role: string | undefined): boolean {
  return role === "admin";
}

export function canAccessExpertData(role: string | undefined): boolean {
  return role === "admin" || role === "reviewer" || role === "expert";
}
