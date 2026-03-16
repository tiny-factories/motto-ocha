"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Compass, Plus } from "lucide-react";

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-0 border-t border-card-border bg-card/95 px-3 py-2 backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div className="flex w-full max-w-[280px] items-center justify-around rounded-xl bg-warm-highlight/80 py-1.5">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0 rounded-lg px-3 py-1.5 transition-colors ${
            pathname === "/"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Home"
        >
          <span className="text-base leading-none" aria-hidden>茶</span>
          <span className="text-[9px] font-medium">Home</span>
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center gap-0 rounded-lg px-3 py-1.5 transition-colors ${
            pathname?.startsWith("/search")
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Search"
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="text-[9px] font-medium">Search</span>
        </Link>
        <Link
          href="/explore"
          className={`flex flex-col items-center gap-0 rounded-lg px-3 py-1.5 transition-colors ${
            pathname?.startsWith("/explore")
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Explore"
        >
          <Compass className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="text-[9px] font-medium">Explore</span>
        </Link>
        <Link
          href="/log"
          className="flex flex-col items-center gap-0 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Add / Log a tea"
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="text-[9px] font-medium">Add</span>
        </Link>
      </div>
    </nav>
  );
}
