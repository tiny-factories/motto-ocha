"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TriedWantButtonsProps = {
  teaId: string;
};

export function TriedWantButtons({ teaId }: TriedWantButtonsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: "tried" | "want_to_try") {
    setLoading(true);
    try {
      const res = await fetch("/api/user-teas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teaId, status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mt-6 flex gap-3 text-sm text-zinc-500">Loading…</div>
    );
  }

  if (!session) {
    return (
      <div className="mt-6">
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign in to mark as tried or want to try
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => setStatus("tried")}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        I tried this
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => setStatus("want_to_try")}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        I want to try this
      </button>
    </div>
  );
}
