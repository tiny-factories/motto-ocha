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

type UnitSystem = "metric" | "imperial";

const UNIT_PREFERENCE_KEY = "brew-unit-system";
const GRAMS_PER_OUNCE = 28.349523125;
const ML_PER_FLUID_OUNCE = 29.5735295625;

function parseInfusionInput(raw: string): number[] {
  return raw
    .split(/[\n,]/)
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toString();
}

function gramsToOunces(grams: number): number {
  return grams / GRAMS_PER_OUNCE;
}

function ouncesToGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}

function mlToFluidOunces(ml: number): number {
  return ml / ML_PER_FLUID_OUNCE;
}

function fluidOuncesToMl(flOz: number): number {
  return flOz * ML_PER_FLUID_OUNCE;
}

function celsiusToFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * (5 / 9);
}

function convertDisplayedValue(
  raw: string,
  converter: (value: number) => number,
  decimals: number
): string {
  const parsed = parseNumericInput(raw);
  if (parsed === null) return raw;
  return formatValue(converter(parsed), decimals);
}

export function TeaBrewProfileForm({ teaId, recommended }: TeaBrewProfileFormProps) {
  const { data: session, status } = useSession();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
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
    try {
      const storedPreference = window.localStorage.getItem(UNIT_PREFERENCE_KEY);
      if (storedPreference === "imperial") {
        setUnitSystem("imperial");
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(UNIT_PREFERENCE_KEY, unitSystem);
    } catch {
      // ignore localStorage errors
    }
  }, [unitSystem]);

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
        if (unitSystem === "imperial") {
          setLeafGrams(
            profile.leafGrams != null
              ? formatValue(gramsToOunces(profile.leafGrams), 2)
              : ""
          );
          setWaterMl(
            profile.waterMl != null
              ? formatValue(mlToFluidOunces(profile.waterMl), 2)
              : ""
          );
          setTemperatureC(
            profile.temperatureC != null
              ? formatValue(celsiusToFahrenheit(profile.temperatureC), 0)
              : ""
          );
        } else {
          setLeafGrams(profile.leafGrams != null ? formatValue(profile.leafGrams, 1) : "");
          setWaterMl(profile.waterMl != null ? String(profile.waterMl) : "");
          setTemperatureC(
            profile.temperatureC != null ? formatValue(profile.temperatureC, 0) : ""
          );
        }
        setNotes(profile.notes ?? "");
        setInfusionSeconds(profile.infusions.map((step) => step.steepSeconds).join(", "));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load brew profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [status, teaId, unitSystem]);

  function handleUnitSwitch(nextUnit: UnitSystem) {
    if (nextUnit === unitSystem) return;
    if (nextUnit === "imperial") {
      setLeafGrams((value) => convertDisplayedValue(value, gramsToOunces, 2));
      setWaterMl((value) => convertDisplayedValue(value, mlToFluidOunces, 2));
      setTemperatureC((value) => convertDisplayedValue(value, celsiusToFahrenheit, 0));
    } else {
      setLeafGrams((value) => convertDisplayedValue(value, ouncesToGrams, 1));
      setWaterMl((value) => convertDisplayedValue(value, fluidOuncesToMl, 0));
      setTemperatureC((value) => convertDisplayedValue(value, fahrenheitToCelsius, 0));
    }
    setUnitSystem(nextUnit);
  }

  function formatRecommendedLeaf(): string {
    if (recommended.leafGrams == null) return "—";
    return unitSystem === "metric"
      ? `${formatValue(recommended.leafGrams, 1)}g`
      : `${formatValue(gramsToOunces(recommended.leafGrams), 2)}oz`;
  }

  function formatRecommendedWater(): string {
    if (recommended.waterMl == null) return "—";
    return unitSystem === "metric"
      ? `${recommended.waterMl}ml`
      : `${formatValue(mlToFluidOunces(recommended.waterMl), 2)} fl oz`;
  }

  function formatRecommendedTemp(): string {
    if (recommended.temperatureC == null) return "—";
    return unitSystem === "metric"
      ? `${formatValue(recommended.temperatureC, 0)}°C`
      : `${formatValue(celsiusToFahrenheit(recommended.temperatureC), 0)}°F`;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const parsedLeaf = parseNumericInput(leafGrams);
      const parsedWater = parseNumericInput(waterMl);
      const parsedTemp = parseNumericInput(temperatureC);
      const metricLeaf =
        parsedLeaf == null
          ? null
          : unitSystem === "metric"
            ? parsedLeaf
            : ouncesToGrams(parsedLeaf);
      const metricWater =
        parsedWater == null
          ? null
          : unitSystem === "metric"
            ? parsedWater
            : fluidOuncesToMl(parsedWater);
      const metricTemp =
        parsedTemp == null
          ? null
          : unitSystem === "metric"
            ? parsedTemp
            : fahrenheitToCelsius(parsedTemp);

      const payload = {
        leafGrams: metricLeaf,
        waterMl: metricWater,
        temperatureC: metricTemp,
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
      setError(err instanceof Error ? err.message : "Failed to save brew profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Units</p>
        <div className="inline-flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-600">
          <button
            type="button"
            onClick={() => handleUnitSwitch("metric")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              unitSystem === "metric"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Metric
          </button>
          <button
            type="button"
            onClick={() => handleUnitSwitch("imperial")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              unitSystem === "imperial"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Imperial
          </button>
        </div>
      </div>

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
              {formatRecommendedLeaf()} tea · {formatRecommendedWater()} water ·{" "}
              {formatRecommendedTemp()}
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
              <label className="mb-1 block text-sm font-medium">
                Leaf ({unitSystem === "metric" ? "g" : "oz"})
              </label>
              <input
                value={leafGrams}
                onChange={(e) => setLeafGrams(e.target.value)}
                type="number"
                step={unitSystem === "metric" ? "0.1" : "0.01"}
                min="0"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Water ({unitSystem === "metric" ? "ml" : "fl oz"})
              </label>
              <input
                value={waterMl}
                onChange={(e) => setWaterMl(e.target.value)}
                type="number"
                step={unitSystem === "metric" ? "1" : "0.1"}
                min="0"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Temp ({unitSystem === "metric" ? "°C" : "°F"})
              </label>
              <input
                value={temperatureC}
                onChange={(e) => setTemperatureC(e.target.value)}
                type="number"
                min="0"
                max={unitSystem === "metric" ? "100" : "212"}
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
