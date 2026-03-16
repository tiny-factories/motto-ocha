"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-muted">…</span>;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Sign in
      </Link>
    );
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin";

  return (
    <div className="flex items-center gap-4">
      {isAdmin && (
        <Link
          href="/admin"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
