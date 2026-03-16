"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type TeaReviewFormProps = {
  teaId: string;
  vendors: { id: string; name: string }[];
  allowVendorSelection?: boolean;
};

type ApiReview = {
  rating: number | null;
  review: string | null;
  locationName: string | null;
  vendorId: string | null;
  isPublic?: boolean;
};

export function TeaReviewForm({
  teaId,
  vendors,
  allowVendorSelection = false,
}: TeaReviewFormProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [locationName, setLocationName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
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
        // Normalize: 0 or null = no rating; legacy 1–5 map to 1–3 for display
        const r = reviewData?.rating;
        const normalized =
          r == null || r === 0
            ? ""
            : r <= 3
              ? String(r)
              : r <= 5
                ? "3"
                : "";
        setRating(normalized);
        setReview(reviewData?.review ?? "");
        setLocationName(reviewData?.locationName ?? "");
        setVendorId(reviewData?.vendorId ?? "");
        setIsPublic(reviewData?.isPublic ?? false);
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
        vendorId: allowVendorSelection ? vendorId || null : null,
        isPublic,
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
      setMessage("Saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading your notes…</p>
    );
  }

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>{" "}
        to add your notes on this tea.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Rating
          </label>
          <div className="flex items-center gap-2" role="group" aria-label="Tea cup rating 0 to 3">
            {(["", "1", "2", "3"] as const).map((v) => (
              <button
                key={v === "" ? "none" : v}
                type="button"
                onClick={() => setRating(v)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  rating === v
                    ? "border-accent bg-accent-light text-accent"
                    : "border-card-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
                title={v === "" ? "No rating" : `${v} cup${v === "1" ? "" : "s"}`}
              >
                {v === "" ? (
                  <span className="text-xs font-medium">—</span>
                ) : (
                  <span aria-hidden>🍵</span>
                )}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">
              {rating === "" ? "No rating" : `${rating} cup${rating === "1" ? "" : "s"}`}
            </span>
          </div>
        </div>
        {allowVendorSelection && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Vendor / brand
            </label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Not specified</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Where you had it
        </label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Kissa Saryo — Kyoto"
          className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-card-border text-accent focus:ring-accent"
        />
        <label htmlFor="isPublic" className="text-sm text-foreground">
          Share to feed (others can see this log)
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Notes
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={3}
          placeholder="What did it taste like? Would you drink it again?"
          className="w-full resize-none rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {message && (
        <p className="text-sm text-accent">{message}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save notes"}
      </button>
    </form>
  );
}
