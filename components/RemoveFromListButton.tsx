"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveFromListButton({
  listId,
  teaId,
}: {
  listId: string;
  teaId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this tea from the list?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/teas/${teaId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleRemove}
      className="rounded-md bg-zinc-800/90 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
      title="Remove from list"
    >
      {loading ? "…" : "Remove"}
    </button>
  );
}
