"use client";

import { useRouter, useSearchParams } from "next/navigation";

type TeasListFiltersProps = {
  teaCategories: { id: string; label: string }[];
  currentCategory?: string;
  currentScale?: string;
  currentYear?: string;
};

export function TeasListFilters({
  teaCategories,
  currentCategory,
  currentScale,
  currentYear,
}: TeasListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/teas?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Filter:</span>
      <div className="flex flex-wrap gap-2">
        <select
          value={currentCategory ?? ""}
          onChange={(e) => updateFilter("category", e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">All types</option>
          {teaCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={currentScale ?? ""}
          onChange={(e) => updateFilter("scale", e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">All scales</option>
          <option value="independent">Independent</option>
          <option value="commercial">Commercial</option>
        </select>
        <select
          value={currentYear ?? ""}
          onChange={(e) => updateFilter("year", e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Any year</option>
          {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {(currentCategory || currentScale || currentYear) && (
          <button
            type="button"
            onClick={() => router.push("/teas")}
            className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
