/**
 * Scrape Ippodo Tea product data from their Shopify store.
 * Fetches each tea sub-collection (Matcha, Gyokuro, Sencha, Bancha) with full
 * pagination so all child pages are covered. Keeps only tea; excludes Utensils,
 * Gift Cards, Gifts, etc.
 *
 * Run: npx tsx scripts/scrape-ippodo.ts
 */

const BASE = "https://ippodotea.com";
const LIMIT = 250;

// Tea sub-collections (child pages under /collections/all). We hit each with pagination.
const TEA_COLLECTIONS: { handle: string; categorySlug: string }[] = [
  { handle: "matcha", categorySlug: "matcha" },
  { handle: "gyokuro", categorySlug: "gyokuro" },
  { handle: "sencha", categorySlug: "sencha" },
  { handle: "bancha", categorySlug: "green" },
];

// Fallback: also fetch /collections/all in case any tea appears only there
const COLLECTION_ALL = "all";

// Only include these product types (tea); exclude Utensils, Gift Cards, Gifts, etc.
const TEA_PRODUCT_TYPES = new Set(["Matcha", "Gyokuro", "Sencha", "Bancha"]);

// Map Ippodo product_type to our TeaCategory slug
const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  Matcha: "matcha",
  Gyokuro: "gyokuro",
  Sencha: "sencha",
  Bancha: "green",
};

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  product_type: string;
  images?: Array<{ src: string }>;
}

interface CollectionResponse {
  products: ShopifyProduct[];
}

export interface IppodoProduct {
  handle: string;
  nameNative: string;
  nameEnglish: string | null;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  categorySlug: string | null;
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

function toIppodoProduct(
  p: ShopifyProduct,
  collectionCategorySlug?: string
): IppodoProduct {
  const desc = p.body_html ? stripHtml(p.body_html).slice(0, 2000) : null;
  const imageUrl = p.images?.length ? p.images[0].src : null;
  const categorySlug =
    collectionCategorySlug ??
    PRODUCT_TYPE_TO_CATEGORY[p.product_type] ??
    "green";
  return {
    handle: p.handle,
    nameNative: p.title,
    nameEnglish: p.title,
    slug: `ippodo-${p.handle}`,
    description: desc || null,
    imageUrl,
    categorySlug,
    origin: "Kyoto, Japan", // Ippodo is Kyoto since 1717
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
  const outPath = "prisma/ippodo-products.json";
  const byHandle = new Map<string, IppodoProduct>();

  // 1) Fetch each tea sub-collection (child pages) with full pagination
  for (const { handle: collHandle, categorySlug } of TEA_COLLECTIONS) {
    let page = 1;
    for (;;) {
      process.stderr.write(
        `Fetching ${collHandle} page ${page}...\n`
      );
      const products = await fetchPage(collHandle, page);
      if (products.length === 0) break;

      for (const p of products) {
        if (!TEA_PRODUCT_TYPES.has(p.product_type)) continue;
        const existing = byHandle.get(p.handle);
        const next = toIppodoProduct(p, categorySlug);
        if (!existing) byHandle.set(p.handle, next);
        else if (!existing.categorySlug) byHandle.set(p.handle, next);
      }

      if (products.length < LIMIT) break;
      page++;
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  // 2) Also paginate /collections/all so we don't miss anything
  let allPage = 1;
  for (;;) {
    process.stderr.write(`Fetching all page ${allPage}...\n`);
    const products = await fetchPage(COLLECTION_ALL, allPage);
    if (products.length === 0) break;

    for (const p of products) {
      if (!TEA_PRODUCT_TYPES.has(p.product_type)) continue;
      if (!byHandle.has(p.handle)) byHandle.set(p.handle, toIppodoProduct(p));
    }

    if (products.length < LIMIT) break;
    allPage++;
    await new Promise((r) => setTimeout(r, 350));
  }

  const allTea = Array.from(byHandle.values());
  const fs = await import("fs");
  const path = await import("path");
  const fullPath = path.join(process.cwd(), outPath);
  fs.writeFileSync(fullPath, JSON.stringify(allTea, null, 2), "utf-8");
  console.log(
    `Wrote ${allTea.length} tea products (from ${TEA_COLLECTIONS.length} child collections + all) to ${fullPath}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
