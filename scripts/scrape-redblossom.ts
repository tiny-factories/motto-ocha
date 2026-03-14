/**
 * Scrape Red Blossom Tea Company product data from their Shopify store.
 * Fetches the main /collections/teas plus all tea child collections with full
 * pagination (many child pages). Keeps only product_type "Teas"; excludes
 * Pre-Packed gift sets, teaware, etc.
 *
 * Run: npx tsx scripts/scrape-redblossom.ts
 */

const BASE = "https://redblossomtea.com";
const LIMIT = 250;

// Main teas collection + child collections (from https://redblossomtea.com/collections/teas)
const TEA_COLLECTIONS: { handle: string; categorySlug: string }[] = [
  { handle: "teas", categorySlug: "green" }, // main; category inferred from tags
  { handle: "white", categorySlug: "white" },
  { handle: "green", categorySlug: "green" },
  { handle: "oolong", categorySlug: "oolong" },
  { handle: "black", categorySlug: "red" },
  { handle: "pu-erh", categorySlug: "pu-erh" },
  { handle: "matcha", categorySlug: "matcha" },
  { handle: "scented-blended", categorySlug: "herbal" },
  { handle: "aged-teas", categorySlug: "pu-erh" },
  { handle: "cold-brew", categorySlug: "green" },
  { handle: "tea-bags", categorySlug: "green" },
  { handle: "herbal-tisanes", categorySlug: "herbal" },
  { handle: "red-label-collection", categorySlug: "green" }, // mixed; use tags
];

// Only include individual tea products; exclude Pre-Packed (gift sets), Teaware, etc.
const TEA_PRODUCT_TYPE = "Teas";

// Infer category from product tags when collection doesn't define it
function categoryFromTags(tags: string[]): string {
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x === "pu-erh" || x === "puerh")) return "pu-erh";
  if (t.some((x) => x === "white")) return "white";
  if (t.some((x) => x === "green")) return "green";
  if (t.some((x) => x === "oolong")) return "oolong";
  if (t.some((x) => x === "black")) return "red";
  if (t.some((x) => x === "matcha")) return "matcha";
  if (t.some((x) => x === "jasmine" || x === "scented")) return "herbal";
  return "green";
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  product_type: string;
  tags?: string[];
  images?: Array<{ src: string }>;
}

interface CollectionResponse {
  products: ShopifyProduct[];
}

export interface RedBlossomProduct {
  handle: string;
  nameNative: string;
  nameEnglish: string | null;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  categorySlug: string;
  origin: string | null;
  sourceUrl: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractOrigin(html: string): string | null {
  const m = html.match(/origin\s*<\/em>\s*<\/span>\s*<span[^>]*>([^<]+)</i);
  if (m) return stripHtml(m[1]).trim();
  const m2 = html.match(/origin\s*<\/span>\s*<[^>]+>([^<]+)/i);
  if (m2) return stripHtml(m2[1]).trim();
  const m3 = html.match(/origin\s*[:\s]+([^<\n]+?)(?:<|craft|$)/i);
  return m3 ? stripHtml(m3[1]).trim() : null;
}

function toRedBlossomProduct(
  p: ShopifyProduct,
  collectionCategorySlug: string
): RedBlossomProduct {
  const desc = p.body_html ? stripHtml(p.body_html).slice(0, 2000) : null;
  const imageUrl = p.images?.length ? p.images[0].src : null;
  const fromTags = p.tags ? categoryFromTags(p.tags) : "green";
  const categorySlug =
    collectionCategorySlug === "green" && p.tags?.length
      ? fromTags
      : collectionCategorySlug;
  return {
    handle: p.handle,
    nameNative: p.title,
    nameEnglish: p.title,
    slug: `redblossom-${p.handle}`,
    description: desc || null,
    imageUrl,
    categorySlug,
    origin: p.body_html ? extractOrigin(p.body_html) : null,
    sourceUrl: `${BASE}/products/${p.handle}`,
  };
}

async function fetchPage(
  collectionHandle: string,
  page: number
): Promise<ShopifyProduct[]> {
  const url = `${BASE}/collections/${collectionHandle}/products.json?limit=${LIMIT}&page=${page}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as CollectionResponse;
    return data.products || [];
  } catch {
    return [];
  }
}

async function main() {
  const outPath = "prisma/redblossom-products.json";
  const byHandle = new Map<string, RedBlossomProduct>();

  for (const { handle: collHandle, categorySlug } of TEA_COLLECTIONS) {
    let page = 1;
    for (;;) {
      process.stderr.write(
        `Fetching ${collHandle} page ${page}...\n`
      );
      const products = await fetchPage(collHandle, page);
      if (products.length === 0) break;

      for (const p of products) {
        if (p.product_type !== TEA_PRODUCT_TYPE) continue;
        const existing = byHandle.get(p.handle);
        const next = toRedBlossomProduct(p, categorySlug);
        if (!existing) byHandle.set(p.handle, next);
        else if (existing.categorySlug === "green" && next.categorySlug !== "green")
          byHandle.set(p.handle, next);
      }

      if (products.length < LIMIT) break;
      page++;
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const results = Array.from(byHandle.values());
  const fs = await import("fs");
  const path = await import("path");
  const fullPath = path.join(process.cwd(), outPath);
  fs.writeFileSync(fullPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(
    `Wrote ${results.length} tea products (from ${TEA_COLLECTIONS.length} collections, all pages) to ${fullPath}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
