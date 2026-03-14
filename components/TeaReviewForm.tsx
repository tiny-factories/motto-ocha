"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type TeaReviewFormProps = {
  teaId: string;
  vendors: { id: string; name: string }[];
};

type ApiReview = {
  rating: number | null;
  review: string | null;
  locationName: string | null;
  vendorId: string | null;
};

export function TeaReviewForm({ teaId, vendors }: TeaReviewFormProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [locationName, setLocationName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teas/${teaId}/review`, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Failed to load review"
          );
        }
        const reviewData = data.review as ApiReview | null;
        if (cancelled) return;
        setRating(reviewData?.rating ? String(reviewData.rating) : "");
        setReview(reviewData?.review ?? "");
        setLocationName(reviewData?.locationName ?? "");
        setVendorId(reviewData?.vendorId ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load review");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [status, teaId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        rating: rating ? Number(rating) : null,
        review: review || null,
        locationName: locationName || null,
        vendorId: vendorId || null,
      };
      const res = await fetch(`/api/teas/${teaId}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to save review"
        );
      }
      setMessage("Saved your tea notes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your notes…</p>;
  }

  if (!session) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/login" className="underline hover:no-underline">
          Sign in
        </Link>{" "}
        to add a review and where you drank or bought this tea.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rating
          </label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">No rating</option>
            <option value="1">1 - Not for me</option>
            <option value="2">2 - Okay</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Great</option>
            <option value="5">5 - Favorite</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Vendor / brand
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Not specified</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Location (cafe/shop)
        </label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Kissa Saryo - Kyoto"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Review notes
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="Flavor, aroma, brew method, and whether you would drink it again."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </form>
  );
}
