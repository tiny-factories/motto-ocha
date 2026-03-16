"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function CreateListForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create list");
      }
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create list");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-warm-highlight hover:text-foreground"
      >
        <Plus className="size-3.5" />
        New list
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="List name"
        className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "…" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-warm-highlight"
      >
        Cancel
      </button>
    </form>
  );
}
