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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground">
        Filter:
      </span>
      <div className="flex flex-wrap gap-2">
        <select
          value={currentCategory ?? ""}
          onChange={(e) => updateFilter("category", e.target.value || null)}
          className="rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
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
          className="rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">All scales</option>
          <option value="independent">Independent</option>
          <option value="commercial">Commercial</option>
        </select>
        {(currentCategory || currentScale || currentYear) && (
          <button
            type="button"
            onClick={() => router.push("/teas")}
            className="text-sm text-accent hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
