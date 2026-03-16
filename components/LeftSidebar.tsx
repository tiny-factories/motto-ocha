"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Compass, List, Bookmark, Plus } from "lucide-react";

export function LeftSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-10 hidden h-screen w-14 flex-col items-center border-r border-card-border bg-card/95 backdrop-blur md:flex">
      <nav className="flex flex-1 flex-col items-center gap-6 pt-6" aria-label="Main">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-muted-foreground transition-colors hover:bg-warm-highlight hover:text-foreground"
          aria-label="Home"
        >
          <span aria-hidden>茶</span>
        </Link>
        <Link
          href="/search"
          className={`transition-colors hover:text-foreground ${
            pathname?.startsWith("/search") ? "text-foreground" : "text-muted-foreground"
          }`}
          aria-label="Search"
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link
          href="/explore"
          className={`transition-colors hover:text-foreground ${
            pathname?.startsWith("/explore") ? "text-foreground" : "text-muted-foreground"
          }`}
          aria-label="Explore"
        >
          <Compass className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link
          href="/my-lists"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Lists"
        >
          <List className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link
          href="/my-lists"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Favorites"
        >
          <Bookmark className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link
          href="/log"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Add new log"
        >
          <Plus className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </nav>
      <div className="border-t border-card-border p-3">
        <Link
          href="/log"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90"
          aria-label="Log a tea"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </aside>
  );
}
