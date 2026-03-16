"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  BookmarkPlus,
  CheckCircle,
  ListPlus,
  ChevronDown,
  Heart,
} from "lucide-react";

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
      <div className="flex gap-3 text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (!session) {
    return (
      <div>
        <Link
          href="/login"
          className="text-sm font-medium text-accent hover:underline"
        >
          Sign in to add this tea to your lists
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {triedList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(triedList.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inTried
              ? "bg-accent text-white"
              : "border border-card-border text-foreground hover:bg-warm-highlight"
          }`}
        >
          {inTried ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" />
          )}
          Tried it
        </button>
      )}
      {wantToTryList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(wantToTryList.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inWantToTry
              ? "border-2 border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-200"
              : "border border-card-border text-foreground hover:bg-warm-highlight"
          }`}
        >
          <BookmarkPlus className="size-4 shrink-0" />
          Want to try
        </button>
      )}
      {favoritesList && (
        <button
          type="button"
          disabled={loading}
          onClick={() => addToList(favoritesList.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            inFavorites
              ? "bg-rose-500 text-white"
              : "border border-card-border text-foreground hover:bg-warm-highlight"
          }`}
        >
          <Heart
            className={`size-4 shrink-0 ${inFavorites ? "fill-current" : ""}`}
          />
          Favorite
        </button>
      )}
      {lists.length > 0 && (
        <div className="relative">
          <button
            type="button"
            disabled={loading}
            onClick={() => setDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-warm-highlight disabled:opacity-50"
          >
            <ListPlus className="size-4 shrink-0" />
            <ChevronDown className="size-3 shrink-0 opacity-70" />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setDropdownOpen(false)}
              />
              <ul className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-card-border bg-card py-1 shadow-lg">
                {lists.map((list) => (
                  <li key={list.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-warm-highlight"
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
