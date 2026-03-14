"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, BookmarkPlus, CheckCircle, ListPlus, ChevronDown, Heart } from "lucide-react";

type List = { id: string; name: string; slug: string; hasTea?: boolean };

export function AddToList({ teaId }: { teaId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchLists = useCallback(() => {
    if (!session) return;
    fetch(`/api/lists?teaId=${encodeURIComponent(teaId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLists(Array.isArray(data) ? data : []))
      .catch(() => setLists([]));
  }, [session, teaId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  async function addToList(listId: string) {
    setLoading(true);
    setDropdownOpen(false);
    try {
      const res = await fetch(`/api/lists/${listId}/teas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teaId }),
      });
      if (res.ok) {
        router.refresh();
        fetchLists();
      }
    } finally {
      setLoading(false);
    }
  }

  const triedList = lists.find((l) => l.slug === "tried");
  const wantToTryList = lists.find((l) => l.slug === "want-to-try");
  const favoritesList = lists.find((l) => l.slug === "favorites");
  const inTried = triedList?.hasTea === true;
  const inWantToTry = wantToTryList?.hasTea === true;
  const inFavorites = favoritesList?.hasTea === true;

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
          Sign in to add this tea to your lists
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {triedList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(triedList.id)}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inTried
              ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          }`}
        >
          {inTried ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" />
          )}
          I tried this
        </button>
      )}
      {wantToTryList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(wantToTryList.id)}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inWantToTry
              ? "border-2 border-amber-500 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <BookmarkPlus className="size-4 shrink-0" />
          I want to try this
        </button>
      )}
      {favoritesList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(favoritesList.id)}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inFavorites
              ? "bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <Heart
            className={`size-4 shrink-0 ${inFavorites ? "fill-current" : ""}`}
          />
          I really like it
        </button>
      )}
      {lists.length > 0 && (
        <div className="relative">
          <button
            type="button"
            disabled={loading}
            onClick={() => setDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ListPlus className="size-4 shrink-0" />
            Add to list
            <ChevronDown className="size-3 shrink-0 opacity-70" />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setDropdownOpen(false)}
              />
              <ul className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {lists.map((list) => (
                  <li key={list.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => addToList(list.id)}
                    >
                      {list.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
