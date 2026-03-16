"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search } from "lucide-react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const value = typeof q === "string" ? q.trim() : "";
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Tea or vendor name…"
          className="w-full rounded-lg border border-card-border bg-card py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
