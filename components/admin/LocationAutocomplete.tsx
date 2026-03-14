"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { filterLocationOptions, type LocationOption } from "@/lib/location-data";

type LocationAutocompleteProps = {
  placeholder?: string;
  className?: string;
  /** Input names in the form for country, prefecture, region (must be in same form) */
  countryName?: string;
  prefectureName?: string;
  regionName?: string;
};

export function LocationAutocomplete({
  placeholder = "Search location (e.g. Uji, Kyoto, Fujian…)",
  className = "",
  countryName = "country",
  prefectureName = "prefecture",
  regionName = "region",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = useMemo<LocationOption[]>(
    () => filterLocationOptions(query),
    [query]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOption(opt: LocationOption) {
    const form = containerRef.current?.closest("form");
    if (!form) return;
    const countryEl = form.elements.namedItem(countryName) as HTMLInputElement | null;
    const prefectureEl = form.elements.namedItem(prefectureName) as HTMLInputElement | null;
    const regionEl = form.elements.namedItem(regionName) as HTMLInputElement | null;
    if (countryEl) countryEl.value = opt.country;
    if (prefectureEl) prefectureEl.value = opt.prefecture ?? "";
    if (regionEl) regionEl.value = opt.region ?? "";
    setQuery(opt.label);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {open && options.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
          role="listbox"
        >
          {options.map((opt, i) => (
            <li
              key={`${opt.country}-${opt.prefecture}-${opt.region ?? ""}-${i}`}
              role="option"
              aria-selected={false}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
