"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TasteTagForm({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const label = (formData.get("label") as string).trim();
    const slug =
      (formData.get("slug") as string).trim() ||
      label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const res = await fetch("/api/admin/taste-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-wrap items-end gap-4 ${className}`}>
      <div>
        <label className="mb-1 block text-sm font-medium">Label</label>
        <input
          name="label"
          required
          placeholder="e.g. Earthy"
          className="w-40 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          name="slug"
          placeholder="auto from label"
          className="w-40 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Adding…" : "Add taste tag"}
      </button>
    </form>
  );
}
