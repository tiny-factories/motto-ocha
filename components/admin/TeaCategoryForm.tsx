"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeaCategory = {
  id: string;
  slug: string;
  label: string;
  parentId: string | null;
};

type TeaCategoryFormProps = {
  category?: TeaCategory;
  parentOptions: { id: string; label: string }[];
};

export function TeaCategoryForm({ category, parentOptions }: TeaCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const slug = (formData.get("slug") as string).trim();
    const label = (formData.get("label") as string).trim();
    const parentId = (formData.get("parentId") as string) || null;
    try {
      const body = { slug, label, parentId };
      const url = category
        ? `/api/admin/tea-categories/${category.id}`
        : "/api/admin/tea-categories";
      const res = await fetch(url, {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      router.push("/admin/tea-categories");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Label *</label>
        <input
          name="label"
          defaultValue={category?.label}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug *</label>
        <input
          name="slug"
          defaultValue={category?.slug}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Parent category</label>
        <select
          name="parentId"
          defaultValue={category?.parentId ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">None</option>
          {parentOptions
            .filter((p) => p.id !== category?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving…" : category ? "Update" : "Create"}
        </button>
        <a
          href="/admin/tea-categories"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 dark:text-zinc-300"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
