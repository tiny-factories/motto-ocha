"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "@/components/admin/LocationAutocomplete";

const SCALE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "commercial", label: "Commercial" },
  { value: "independent", label: "Independent" },
];

type FarmFormProps = {
  farm?: {
    id: string;
    nameNative: string;
    nameEnglish: string | null;
    slug: string;
    description: string | null;
    locationText: string | null;
    imageUrl: string | null;
    region: string | null;
    country: string | null;
    prefecture: string | null;
    scale: string | null;
  };
};

export function FarmForm({ farm }: FarmFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(farm?.imageUrl ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nameNative = formData.get("nameNative") as string;
    const nameEnglish = (formData.get("nameEnglish") as string) || null;
    const slug =
      (formData.get("slug") as string) ||
      nameNative.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fff\-]/g, "");
    const description = (formData.get("description") as string) || null;
    const locationText = (formData.get("locationText") as string) || null;
    const region = (formData.get("region") as string) || null;
    const country = (formData.get("country") as string) || null;
    const prefecture = (formData.get("prefecture") as string) || null;
    const scale = (formData.get("scale") as string) || null;
    const imageFile = formData.get("image") as File | null;
    let finalImageUrl = imageUrl;
    if (imageFile?.size) {
      const fd = new FormData();
      fd.set("file", imageFile);
      fd.set("prefix", "farms");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      finalImageUrl = data.url;
    }
    try {
      const body = {
        nameNative,
        nameEnglish,
        slug,
        description,
        locationText,
        region,
        country,
        prefecture,
        scale,
        imageUrl: finalImageUrl || null,
      };
      const url = farm ? `/api/admin/farms/${farm.id}` : "/api/admin/farms";
      const res = await fetch(url, {
        method: farm ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      router.push("/admin/farms");
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
        <label className="mb-1 block text-sm font-medium">Native name *</label>
        <input
          name="nameNative"
          defaultValue={farm?.nameNative}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">English name</label>
        <input
          name="nameEnglish"
          defaultValue={farm?.nameEnglish ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          name="slug"
          defaultValue={farm?.slug}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Location (free text)</label>
        <input
          name="locationText"
          defaultValue={farm?.locationText ?? ""}
          placeholder="e.g. Uji, Kyoto"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Location search</label>
        <LocationAutocomplete placeholder="Search and select to fill country, prefecture, region" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <input
            name="country"
            defaultValue={farm?.country ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prefecture / Region</label>
          <input
            name="prefecture"
            defaultValue={farm?.prefecture ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Region</label>
          <input
            name="region"
            defaultValue={farm?.region ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Scale</label>
        <select
          name="scale"
          defaultValue={farm?.scale ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {SCALE_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={farm?.description ?? ""}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Image</label>
        {imageUrl && <p className="mb-1 text-xs text-zinc-500">Current: set</p>}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="w-full text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving…" : farm ? "Update" : "Create"}
        </button>
        <a
          href="/admin/farms"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 dark:text-zinc-300"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
