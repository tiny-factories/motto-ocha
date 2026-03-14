/**
 * Scrape Song Tea & Ceramics product data from their Shopify store.
 * Fetches collection products.json (e.g. /collections/green-tea/products.json)
 * and writes prisma/song-products.json for use in db:seed.
 *
 * Run: npx tsx scripts/scrape-song.ts
 */

const BASE = "https://songtea.com";

// Collection handles from https://songtea.com/pages/tea-by-type
const COLLECTIONS: { handle: string; categorySlug: string | null }[] = [
  { handle: "green-tea", categorySlug: "green" },
  { handle: "white-tea", categorySlug: "white" },
  { handle: "oolong-tea", categorySlug: "oolong" },
  { handle: "red-tea", categorySlug: "red" },
  { handle: "aged-oolong", categorySlug: "oolong" },
  { handle: "si-fang-cha-private-room-tea", categorySlug: "oolong" },
  { handle: "matcha", categorySlug: "matcha" },
  { handle: "botanical-tea", categorySlug: "herbal" },
  { handle: "tea-gift-box", categorySlug: null },
];

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

export interface SongProduct {
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

function extractOrigin(html: string): string | null {
  const summaryMatch = html.match(
    /tea-summary[^>]*>[\s\S]*?(?:from|・)\s*([^・<]+?)(?:・|<\/p>)/i
  );
  if (summaryMatch) return stripHtml(summaryMatch[1]).trim();
  const fromMatch = html.match(/from\s+([^・<.]+?)(?:・|\.|<\/p>)/i);
  if (fromMatch) return stripHtml(fromMatch[1]).trim();
  return null;
}

function productToSong(
  p: ShopifyProduct,
  categorySlug: string | null
): SongProduct {
  const desc = p.body_html ? stripHtml(p.body_html).slice(0, 2000) : null;
  const imageUrl =
    p.images && p.images.length > 0 ? p.images[0].src : null;
  return {
    handle: p.handle,
    nameNative: p.title,
    nameEnglish: p.title,
    slug: `song-${p.handle}`,
    description: desc || null,
    imageUrl,
    categorySlug,
    origin: p.body_html ? extractOrigin(p.body_html) : null,
    sourceUrl: `${BASE}/products/${p.handle}`,
  };
}

async function fetchCollection(
  collectionHandle: string,
  categorySlug: string | null
): Promise<SongProduct[]> {
  const url = `${BASE}/collections/${collectionHandle}/products.json`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as CollectionResponse;
    return (data.products || []).map((p) => productToSong(p, categorySlug));
  } catch {
    return [];
  }
}

async function main() {
  const outPath = "prisma/song-products.json";
  const byHandle = new Map<string, SongProduct>();

  for (let i = 0; i < COLLECTIONS.length; i++) {
    const { handle, categorySlug } = COLLECTIONS[i];
    process.stderr.write(
      `Fetching ${i + 1}/${COLLECTIONS.length}: ${handle}...\n`
    );
    const products = await fetchCollection(handle, categorySlug);
    for (const p of products) {
      if (!byHandle.has(p.handle)) byHandle.set(p.handle, p);
      else if (categorySlug && !byHandle.get(p.handle)!.categorySlug) {
        byHandle.set(p.handle, { ...p, categorySlug });
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const results = Array.from(byHandle.values());
  const fs = await import("fs");
  const path = await import("path");
  const fullPath = path.join(process.cwd(), outPath);
  fs.writeFileSync(fullPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Wrote ${results.length} products to ${fullPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
