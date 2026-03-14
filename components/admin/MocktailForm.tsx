"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeaOption = { id: string; nameNative: string; nameEnglish: string | null };

type MocktailFormProps = {
  teas: TeaOption[];
  mocktail?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    teaId: string | null;
    ingredients: { name: string; amount: string | null; unit: string | null }[];
    steps: { instruction: string; durationSeconds: number | null }[];
  };
};

function parseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function MocktailForm({ teas, mocktail }: MocktailFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const ingredientsDefault = (mocktail?.ingredients ?? [])
    .map((ing) => `${ing.amount ?? ""}|${ing.unit ?? ""}|${ing.name}`)
    .join("\n");
  const stepsDefault = (mocktail?.steps ?? [])
    .map((step) =>
      `${step.durationSeconds != null ? `${step.durationSeconds}|` : ""}${step.instruction}`
    )
    .join("\n");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const rawSlug = (formData.get("slug") as string).trim();
    const slug = rawSlug ? parseSlug(rawSlug) : parseSlug(name);
    const description = ((formData.get("description") as string) || "").trim() || null;
    const teaId = ((formData.get("teaId") as string) || "").trim() || null;
    const ingredientsRaw = ((formData.get("ingredients") as string) || "").trim();
    const stepsRaw = ((formData.get("steps") as string) || "").trim();

    const ingredients = ingredientsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [amount = "", unit = "", ...nameParts] = line.split("|");
        return {
          amount: amount.trim() || null,
          unit: unit.trim() || null,
          name: nameParts.join("|").trim(),
        };
      })
      .filter((item) => item.name.length > 0);

    const steps = stepsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [first, ...rest] = line.split("|");
        const duration = Number.parseInt(first.trim(), 10);
        if (rest.length > 0 && Number.isFinite(duration)) {
          return {
            durationSeconds: duration,
            instruction: rest.join("|").trim(),
          };
        }
        return {
          durationSeconds: null,
          instruction: line,
        };
      })
      .filter((step) => step.instruction.length > 0);

    try {
      const method = mocktail ? "PATCH" : "POST";
      const url = mocktail ? `/api/admin/mocktails/${mocktail.id}` : "/api/admin/mocktails";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          teaId,
          ingredients,
          steps,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to save");
      }
      router.push("/admin/mocktails");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save mocktail");
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
          required
          defaultValue={mocktail?.name ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          name="slug"
          defaultValue={mocktail?.slug ?? ""}
          placeholder="auto-from-name-if-empty"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Base tea</label>
        <select
          name="teaId"
          defaultValue={mocktail?.teaId ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Not specified</option>
          {teas.map((tea) => (
            <option key={tea.id} value={tea.id}>
              {tea.nameNative}
              {tea.nameEnglish ? ` (${tea.nameEnglish})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={mocktail?.description ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Ingredients</label>
        <textarea
          name="ingredients"
          rows={5}
          defaultValue={ingredientsDefault}
          placeholder={"One ingredient per line:\namount|unit|name\nExample:\n30|ml|chilled sencha\n10|ml|yuzu juice"}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Recipe steps</label>
        <textarea
          name="steps"
          rows={6}
          defaultValue={stepsDefault}
          placeholder={"One step per line. Optional duration:\nseconds|instruction\nExample:\n20|Shake with ice\nStrain into chilled glass"}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving…" : mocktail ? "Update mocktail" : "Create mocktail"}
        </button>
        <a
          href="/admin/mocktails"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 dark:text-zinc-300"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
