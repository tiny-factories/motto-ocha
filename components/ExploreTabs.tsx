"use client";

import Link from "next/link";

export function ExploreTabs({
  activeTab,
}: {
  activeTab: "all" | "followed";
}) {
  const allHref = "/explore";
  const followedHref = "/explore?tab=followed";

  return (
    <div
      className="mt-6 flex rounded-lg border border-card-border bg-warm-highlight/50 p-1"
      role="tablist"
      aria-label="Explore view"
    >
      <Link
        href={allHref}
        role="tab"
        aria-selected={activeTab === "all"}
        className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
          activeTab === "all"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </Link>
      <Link
        href={followedHref}
        role="tab"
        aria-selected={activeTab === "followed"}
        className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
          activeTab === "followed"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Followed
      </Link>
    </div>
  );
}
