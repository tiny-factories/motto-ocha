/**
 * Tea-relevant locations for autocomplete (country, prefecture, region).
 * Used by LocationAutocomplete to suggest and fill location fields.
 */
export type LocationOption = {
  country: string;
  prefecture: string;
  region?: string;
  /** Display label for search (e.g. "Uji, Kyoto, Japan") */
  label: string;
};

export const LOCATION_OPTIONS: LocationOption[] = [
  // Japan
  { country: "Japan", prefecture: "Kyoto", region: "Kyoto", label: "Kyoto, Japan" },
  { country: "Japan", prefecture: "Kyoto", region: "Uji", label: "Uji, Kyoto, Japan" },
  { country: "Japan", prefecture: "Shizuoka", region: "Shizuoka", label: "Shizuoka, Japan" },
  { country: "Japan", prefecture: "Shizuoka", region: "Fujieda", label: "Fujieda, Shizuoka, Japan" },
  { country: "Japan", prefecture: "Kagoshima", region: "Kagoshima", label: "Kagoshima, Japan" },
  { country: "Japan", prefecture: "Mie", region: "Mie", label: "Mie, Japan" },
  { country: "Japan", prefecture: "Nara", region: "Nara", label: "Nara, Japan" },
  { country: "Japan", prefecture: "Saitama", region: "Sayama", label: "Sayama, Saitama, Japan" },
  { country: "Japan", prefecture: "Fukuoka", region: "Yame", label: "Yame, Fukuoka, Japan" },
  { country: "Japan", prefecture: "Kyushu", region: "Kyushu", label: "Kyushu, Japan" },
  // China
  { country: "China", prefecture: "Fujian", region: "Fujian", label: "Fujian, China" },
  { country: "China", prefecture: "Fujian", region: "Wuyi", label: "Wuyi Mountains, Fujian, China" },
  { country: "China", prefecture: "Zhejiang", region: "Zhejiang", label: "Zhejiang, China" },
  { country: "China", prefecture: "Zhejiang", region: "Hangzhou", label: "Hangzhou, Zhejiang, China" },
  { country: "China", prefecture: "Yunnan", region: "Yunnan", label: "Yunnan, China" },
  { country: "China", prefecture: "Anhui", region: "Anhui", label: "Anhui, China" },
  { country: "China", prefecture: "Hunan", region: "Hunan", label: "Hunan, China" },
  { country: "China", prefecture: "Sichuan", region: "Sichuan", label: "Sichuan, China" },
  { country: "China", prefecture: "Taiwan", region: "Taiwan", label: "Taiwan, China" },
  { country: "China", prefecture: "Taiwan", region: "Nantou", label: "Nantou, Taiwan, China" },
  // India
  { country: "India", prefecture: "Assam", region: "Assam", label: "Assam, India" },
  { country: "India", prefecture: "West Bengal", region: "Darjeeling", label: "Darjeeling, West Bengal, India" },
  { country: "India", prefecture: "Tamil Nadu", region: "Nilgiri", label: "Nilgiri, Tamil Nadu, India" },
  { country: "India", prefecture: "Kerala", region: "Kerala", label: "Kerala, India" },
  // Sri Lanka
  { country: "Sri Lanka", prefecture: "Central Province", region: "Kandy", label: "Kandy, Sri Lanka" },
  { country: "Sri Lanka", prefecture: "Southern Province", region: "Galle", label: "Galle, Sri Lanka" },
  { country: "Sri Lanka", prefecture: "Uva", region: "Uva", label: "Uva, Sri Lanka" },
  { country: "Sri Lanka", prefecture: "Sabaragamuwa", region: "Sabaragamuwa", label: "Sabaragamuwa, Sri Lanka" },
  // Other
  { country: "Kenya", prefecture: "Kericho", region: "Kericho", label: "Kericho, Kenya" },
  { country: "Nepal", prefecture: "Ilam", region: "Ilam", label: "Ilam, Nepal" },
  { country: "Vietnam", prefecture: "Thai Nguyen", region: "Thai Nguyen", label: "Thai Nguyen, Vietnam" },
  { country: "Indonesia", prefecture: "Java", region: "Java", label: "Java, Indonesia" },
  { country: "South Korea", prefecture: "Boseong", region: "Boseong", label: "Boseong, South Korea" },
  { country: "Georgia", prefecture: "Guria", region: "Guria", label: "Guria, Georgia" },
];

/** Filter options by search string (case-insensitive match on label, country, prefecture, region). */
export function filterLocationOptions(query: string): LocationOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCATION_OPTIONS.slice(0, 20);
  return LOCATION_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.country.toLowerCase().includes(q) ||
      opt.prefecture.toLowerCase().includes(q) ||
      (opt.region && opt.region.toLowerCase().includes(q))
  ).slice(0, 15);
}
