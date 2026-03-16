"use client";

import { useState } from "react";
import { TeaLogChat } from "@/components/TeaLogChat";
import { TeaLogFeed } from "@/components/TeaLogFeed";

export default function JournalPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<"list" | "calendar">("list");

  function handleTeaLogged() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-6xl">
      {/* ── Feed (left on desktop, full on mobile when no chat focus) ── */}
      <div className="hidden w-full flex-col border-r border-card-border md:flex md:w-[55%] lg:w-[60%]">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Tea journal
            </h1>
            <p className="text-xs text-muted-foreground">
              Your recent logs
            </p>
          </div>
          <div className="flex rounded-lg border border-card-border p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "calendar"
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TeaLogFeed refreshKey={refreshKey} view={view} />
        </div>
      </div>

      {/* ── Chat input (right on desktop, full on mobile) ── */}
      <div className="flex w-full flex-col md:w-[45%] lg:w-[40%]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-card-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground md:text-base">
              <span className="md:hidden">Tea journal</span>
              <span className="hidden md:inline">Log a tea</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Describe it, snap a photo, or dictate
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <TeaLogChat onTeaLogged={handleTeaLogged} />
        </div>
      </div>

      {/* ── Mobile feed (below the fold, scrollable) ── */}
      <div className="fixed inset-x-0 bottom-0 top-auto z-40 md:hidden">
        {/* This is handled by the TeaLogChat sticky bottom bar */}
      </div>
    </div>
  );
}
