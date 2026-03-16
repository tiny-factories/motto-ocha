"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { Send, Loader2, CheckCircle2, Plus } from "lucide-react";

type LoggedTea = {
  id: string;
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  vendor: string | null;
  category: string | null;
  tastingNotes: string[];
  rating: number | null;
  region: string | null;
  country: string | null;
};

export function TeaLogger() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedTeas, setLoggedTeas] = useState<LoggedTea[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/log-tea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to log tea");
      }

      setLoggedTeas((prev) => [data.tea, ...prev]);
      setDescription("");
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Input area */}
      <div className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          What are you drinking?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Describe it however you like &mdash; the tea, where it&apos;s from,
          how it tastes, what you think of it. We&apos;ll organize the rest.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder='e.g. "Just tried this ceremonial matcha from Ippodo in Kyoto. Really smooth and umami-forward, not bitter at all. Bright green color. One of the best I&apos;ve had, maybe a 5/5."'
            className="w-full resize-none rounded-lg border border-card-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            disabled={loading}
          />

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted">
              {navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter to
              submit
            </span>
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Log this tea
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Logged teas */}
      {loggedTeas.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Just logged
            </h3>
            <button
              type="button"
              onClick={() => {
                setDescription("");
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <Plus className="size-3.5" />
              Log another
            </button>
          </div>

          {loggedTeas.map((tea) => (
            <Link
              key={tea.id}
              href={`/teas/${tea.slug}`}
              className="block rounded-xl border border-card-border bg-card p-5 transition-colors hover:bg-warm-highlight"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-accent" />
                    <h4 className="truncate font-semibold text-foreground">
                      {tea.nameEnglish || tea.nameNative}
                    </h4>
                  </div>
                  {tea.nameEnglish && tea.nameNative !== tea.nameEnglish && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {tea.nameNative}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {tea.category && (
                      <span className="inline-flex rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
                        {tea.category}
                      </span>
                    )}
                    {tea.vendor && (
                      <span className="inline-flex rounded-full border border-card-border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {tea.vendor}
                      </span>
                    )}
                    {(tea.region || tea.country) && (
                      <span className="inline-flex rounded-full border border-card-border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {[tea.region, tea.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>

                  {tea.tastingNotes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tea.tastingNotes.map((note) => (
                        <span
                          key={note}
                          className="rounded-md bg-warm-highlight px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {tea.rating && (
                  <div className="flex shrink-0 flex-col items-center rounded-lg bg-warm-highlight px-3 py-2">
                    <span className="text-lg font-bold text-accent">
                      {tea.rating}
                    </span>
                    <span className="text-[10px] text-muted">/5</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state encouragement */}
      {loggedTeas.length === 0 && !loading && (
        <div className="mt-8 rounded-xl border border-dashed border-card-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your logged teas will appear here. Try describing something
            you&apos;re drinking right now!
          </p>
        </div>
      )}
    </div>
  );
}
