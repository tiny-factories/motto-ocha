"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

interface ConversationMessage {
  role: string;
  content: string;
  hasImage?: boolean;
}

interface TeaLog {
  id: string;
  teaId: string;
  rating: number | null;
  review: string | null;
  locationName: string | null;
  conversationLog: ConversationMessage[] | null;
  createdAt: string;
  tea: {
    slug: string;
    nameNative: string;
    nameEnglish: string | null;
    imageUrl: string | null;
    vendor: string | null;
    category: string | null;
    tastingNotes: string[];
  };
}

// ── Date helpers ───────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(
  logs: TeaLog[]
): { label: string; logs: TeaLog[] }[] {
  const groups: Map<string, TeaLog[]> = new Map();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  for (const log of logs) {
    const d = new Date(log.createdAt).toDateString();
    let label: string;
    if (d === today) label = "Today";
    else if (d === yesterday) label = "Yesterday";
    else {
      label = new Date(log.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(log);
  }

  return Array.from(groups.entries()).map(([label, logs]) => ({
    label,
    logs,
  }));
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function logsByDateMap(logs: TeaLog[]): Map<string, TeaLog[]> {
  const map = new Map<string, TeaLog[]>();
  for (const log of logs) {
    const key = toDateKey(new Date(log.createdAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }
  return map;
}

// ── Rating display (0–3 tea cups; legacy 4–5 shown as 3 cups) ───────────────

function RatingDisplay({ rating }: { rating: number }) {
  const cups = rating >= 1 && rating <= 3 ? rating : rating >= 4 ? 3 : 0;
  if (cups === 0) return null;
  return (
    <span className="text-xs font-medium text-foreground" aria-label={`${cups} cup${cups === 1 ? "" : "s"}`}>
      {"🍵".repeat(cups)}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

// ── Single log card (shared by list and calendar) ──────────────────────────

function LogCard({ log }: { log: TeaLog }) {
  const [showConversation, setShowConversation] = useState(false);
  const hasConversation =
    log.conversationLog && log.conversationLog.length > 0;

  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      <Link
        href={`/teas/${log.tea.slug}`}
        className="group flex items-start gap-3 p-3.5 transition-all hover:border-accent/30 hover:shadow-sm"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-light">
          <span className="text-sm font-semibold text-accent">
            {log.tea.nameNative.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
              {log.tea.nameEnglish || log.tea.nameNative}
            </h4>
            <span className="shrink-0 text-xs text-muted">
              {formatRelativeDate(log.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {log.tea.category && (
              <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-medium text-accent">
                {log.tea.category}
              </span>
            )}
            {log.tea.vendor && (
              <span className="rounded-full border border-card-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {log.tea.vendor}
              </span>
            )}
            {log.tea.tastingNotes.slice(0, 3).map((note) => (
              <span key={note} className="text-[10px] text-muted">
                {note}
              </span>
            ))}
          </div>
          {log.review && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {log.review}
            </p>
          )}
        </div>
      {log.rating != null && (
        <div className="shrink-0 pt-0.5">
          <RatingDisplay rating={log.rating} />
        </div>
      )}
      </Link>
      {hasConversation && (
        <>
          <button
            type="button"
            onClick={() => setShowConversation((v) => !v)}
            className="w-full border-t border-card-border px-3.5 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-warm-highlight hover:text-foreground"
          >
            {showConversation ? "Hide conversation" : "View conversation"}
          </button>
          {showConversation && (
            <div className="border-t border-card-border bg-muted/30 px-3.5 py-2 space-y-1.5 max-h-48 overflow-y-auto">
              {log.conversationLog!.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">
                    {msg.role === "user" ? "You" : "Assistant"}:
                  </span>{" "}
                  <span className="text-muted-foreground">{msg.content}</span>
                  {msg.hasImage && (
                    <span className="ml-1 text-muted" aria-hidden>
                      📷
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Calendar view (GitHub-style scrollable past months) ─────────────────────

const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const MONTHS_TO_SHOW = 12;

function CalendarView({ logs }: { logs: TeaLog[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const byDate = logsByDateMap(logs);
  const today = new Date();
  const todayKey = toDateKey(today);

  // Build list of months: current + past (MONTHS_TO_SHOW total)
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < MONTHS_TO_SHOW; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div className="flex flex-col gap-0 min-h-0">
      <div className="flex-1 overflow-y-auto space-y-5 pb-2 -mx-0.5">
        {months.map(({ year, month }) => {
          const first = new Date(year, month, 1);
          const last = new Date(year, month + 1, 0);
          const startPad = first.getDay();
          const daysInMonth = last.getDate();

          return (
            <section
              key={`${year}-${month}`}
              className="rounded-lg border border-card-border bg-card/50 px-2.5 py-2"
            >
              <header className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  {new Date(year, month).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {month === today.getMonth() && year === today.getFullYear() && (
                  <span className="text-[10px] text-accent font-medium">
                    This month
                  </span>
                )}
              </header>

              <div className="grid grid-cols-7 gap-px text-center">
                {WEEKDAYS_SHORT.map((wd, i) => (
                  <div
                    key={i}
                    className="h-4 flex items-center justify-center text-[9px] font-medium text-muted"
                  >
                    {wd}
                  </div>
                ))}
                {Array.from({ length: startPad }, (_, i) => (
                  <div key={`pad-${i}`} className="h-5" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const key = toDateKey(date);
                  const dayLogs = byDate.get(key) ?? [];
                  const hasLogs = dayLogs.length > 0;
                  const isToday = key === todayKey;
                  const isSelected = selectedKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(isSelected ? null : key)}
                      className={`h-5 min-w-0 rounded text-[10px] transition-colors flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-accent text-white"
                          : hasLogs
                            ? "bg-accent/20 text-foreground hover:bg-accent/30"
                            : "text-muted-foreground/80 hover:bg-card hover:text-foreground"
                      } ${isToday && !isSelected ? "ring-1 ring-accent/60" : ""}`}
                    >
                      <span>{day}</span>
                      {hasLogs && (
                        <span className="text-[8px] leading-none opacity-90">
                          {dayLogs.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selectedKey && byDate.has(selectedKey) && (
        <div className="shrink-0 space-y-2 border-t border-card-border pt-3 mt-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {new Date(selectedKey).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {(byDate.get(selectedKey) ?? []).map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function TeaLogFeed({
  refreshKey,
  view = "list",
}: {
  refreshKey?: number;
  view?: "list" | "calendar";
}) {
  const [logs, setLogs] = useState<TeaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/log-tea?limit=50");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setError("Couldn't load your tea logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading your tea journal…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-3 text-5xl text-accent/30" aria-hidden>
          茶
        </span>
        <h3 className="text-lg font-semibold text-foreground">
          Your journal is empty
        </h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Log your first tea to start building your collection. Just describe
          what you&apos;re drinking in the chat.
        </p>
      </div>
    );
  }

  if (view === "calendar") {
    return <CalendarView logs={logs} />;
  }

  const grouped = groupByDate(logs);
  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.logs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
