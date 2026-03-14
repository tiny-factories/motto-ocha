"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type RecommendedGuide = {
  leafGrams: number | null;
  waterMl: number | null;
  temperatureC: number | null;
  notes: string | null;
  infusions: { infusionNumber: number; steepSeconds: number; note: string | null }[];
};

type TeaBrewProfileFormProps = {
  teaId: string;
  recommended: RecommendedGuide;
};

function parseInfusionInput(raw: string): number[] {
  return raw
    .split(/[\n,]/)
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function TeaBrewProfileForm({ teaId, recommended }: TeaBrewProfileFormProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leafGrams, setLeafGrams] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [temperatureC, setTemperatureC] = useState("");
  const [notes, setNotes] = useState("");
  const [infusionSeconds, setInfusionSeconds] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teas/${teaId}/brew-profile`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Failed to load brew profile"
          );
        }
        const profile = data.profile as
          | {
              leafGrams: number | null;
              waterMl: number | null;
              temperatureC: number | null;
              notes: string | null;
              infusions: { steepSeconds: number }[];
            }
          | null;
        if (cancelled || !profile) return;
        setLeafGrams(profile.leafGrams != null ? String(profile.leafGrams) : "");
        setWaterMl(profile.waterMl != null ? String(profile.waterMl) : "");
        setTemperatureC(profile.temperatureC != null ? String(profile.temperatureC) : "");
        setNotes(profile.notes ?? "");
        setInfusionSeconds(profile.infusions.map((step) => step.steepSeconds).join(", "));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load brew profile"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [status, teaId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        leafGrams: leafGrams.trim() ? Number.parseFloat(leafGrams) : null,
        waterMl: waterMl.trim() ? Number.parseInt(waterMl, 10) : null,
        temperatureC: temperatureC.trim() ? Number.parseInt(temperatureC, 10) : null,
        notes: notes.trim() || null,
        infusionSeconds: parseInfusionInput(infusionSeconds),
      };
      const res = await fetch(`/api/teas/${teaId}/brew-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to save brew profile"
        );
      }
      setMessage("Saved your personal brew setup.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save brew profile"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800/40">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">
          Recommended baseline
        </p>
        {(recommended.leafGrams != null ||
          recommended.waterMl != null ||
          recommended.temperatureC != null ||
          recommended.infusions.length > 0 ||
          recommended.notes) ? (
          <div className="mt-1 space-y-1 text-zinc-600 dark:text-zinc-300">
            <p>
              {recommended.leafGrams != null ? `${recommended.leafGrams}g` : "—"} tea ·{" "}
              {recommended.waterMl != null ? `${recommended.waterMl}ml` : "—"} water ·{" "}
              {recommended.temperatureC != null ? `${recommended.temperatureC}°C` : "—"}
            </p>
            {recommended.infusions.length > 0 && (
              <p>
                Infusions:{" "}
                {recommended.infusions
                  .map((step) => `${step.infusionNumber}) ${step.steepSeconds}s`)
                  .join(" · ")}
              </p>
            )}
            {recommended.notes && <p>{recommended.notes}</p>}
          </div>
        ) : (
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            No default brew guide yet for this tea.
          </p>
        )}
      </div>

      {status === "loading" || loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading your brew profile…
        </p>
      ) : !session ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="underline hover:no-underline">
            Sign in
          </Link>{" "}
          to save your own brew settings.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Leaf (g)</label>
              <input
                value={leafGrams}
                onChange={(e) => setLeafGrams(e.target.value)}
                type="number"
                step="0.1"
                min="0"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Water (ml)</label>
              <input
                value={waterMl}
                onChange={(e) => setWaterMl(e.target.value)}
                type="number"
                min="0"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Temp (°C)</label>
              <input
                value={temperatureC}
                onChange={(e) => setTemperatureC(e.target.value)}
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Infusion times (seconds)
            </label>
            <input
              value={infusionSeconds}
              onChange={(e) => setInfusionSeconds(e.target.value)}
              placeholder="e.g. 25, 35, 50"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Personal notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="How you brewed this and what worked best."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}
          {message && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Saving…" : "Save my brew settings"}
          </button>
        </form>
      )}
    </div>
  );
}
