"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditListNameForm({
  listId,
  initialName,
}: {
  listId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditing(false);
      router.refresh();
    } catch {
      alert("Failed to update list name");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {initialName}
        </h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Edit name
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-2xl font-bold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setName(initialName);
        }}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
      >
        Cancel
      </button>
    </form>
  );
}
