"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SCALE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "commercial", label: "Commercial" },
  { value: "independent", label: "Independent" },
];

type VendorFormProps = {
  vendor?: {
    id: string;
    name: string;
    logoUrl: string | null;
    url: string | null;
    description: string | null;
    scale: string | null;
  };
};

export function VendorForm({ vendor }: VendorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const url = (formData.get("url") as string) || null;
    const description = (formData.get("description") as string) || null;
    const scale = (formData.get("scale") as string) || null;
    try {
      const body = { name, logoUrl: null, url, description, scale };
      const urlPath = vendor ? `/api/admin/vendors/${vendor.id}` : "/api/admin/vendors";
      const res = await fetch(urlPath, {
        method: vendor ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      router.push("/admin/vendors");
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
        <label className="mb-1 block text-sm font-medium">Name *</label>
        <input
          name="name"
          defaultValue={vendor?.name}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">URL</label>
        <input
          name="url"
          type="url"
          defaultValue={vendor?.url ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={vendor?.description ?? ""}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Scale</label>
        <select
          name="scale"
          defaultValue={vendor?.scale ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {SCALE_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
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
          {loading ? "Saving…" : vendor ? "Update" : "Create"}
        </button>
        <a
          href="/admin/vendors"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 dark:text-zinc-300"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
