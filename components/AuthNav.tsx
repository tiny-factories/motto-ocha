"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-zinc-400">…</span>;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Sign out
      </button>
    </div>
  );
}
