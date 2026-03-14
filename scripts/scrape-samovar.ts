/**
 * Scrape Samovar Tea product data from their Shopify store.
 * Fetches product JSON (e.g. /products/gyokuro.json) and writes
 * prisma/samovar-products.json for use in db:seed.
 *
 * Run: npx tsx scripts/scrape-samovar.ts
 */

const BASE = "https://www.samovartea.com";

// Tea/herbal product handles from /collections/all-products (excludes teaware)
const TEA_HANDLES = [
  "organic-tea-masala-chai",
  "english-breakfast",
  "ryokucha",
  "earl-grey",
  "turmeric-spice",
  "california-persian",
  "sweet-matcha",
  "jasmine",
  "rooibos-ocean-of-wisdom",
  "cacao-mint",
  "chamomile-twist",
  "hibiscus-bliss",
  "velvet-cacao",
  "spearmint-sage",
  "shibumi-matcha",
  "blood-orange",
  "moorish-mint",
  "maidens-ecstasy",
  "iron-goddess-of-mercy",
  "mainichi-matcha",
  "green-ecstasy",
  "rooibos-earl-grey",
  "four-seasons",
  "nishi-sencha",
  "tart-peach",
  "pumpkin-chai",
  "jasmine-pearl",
  "turmeric-gold",
  "wuyi-dark-roast",
  "moon-bud",
  "cranberry-eucalyptus",
  "sweet-houjicha-powder",
  "gyokuro",
  "houjicha",
  "dandelion-detox",
  "chamomile-blossom",
  "golden-phoenix",
];

// Map Samovar product_type to our TeaCategory slug
const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  "Black Tea": "red",
  "Chai Tea": "chai",
  "Green Tea": "green",
  "Herbal Infusion": "herbal",
  Matcha: "matcha",
  "Oolong Tea": "oolong",
  "Pu-erh Tea": "pu-erh",
  "White Tea": "white",
};

interface ShopifyProduct {
  product: {
    title: string;
    body_html: string;
    product_type: string;
    handle: string;
    image?: { src: string };
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractOrigin(html: string): string | null {
  const match = html.match(/ORIGIN[\s\S]*?<\/span>\s*([^<]+?)\s*<\/p>/i);
  if (match) return stripHtml(match[1]).trim();
  const alt = html.match(/Origin[^>]*>([^<]+)/i);
  return alt ? stripHtml(alt[1]).trim() : null;
}

export interface SamovarProduct {
  handle: string;
  nameNative: string;
  nameEnglish: string | null;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productType: string;
  categorySlug: string | null;
  origin: string | null;
  sourceUrl: string;
}

async function fetchProduct(handle: string): Promise<SamovarProduct | null> {
  const url = `${BASE}/products/${handle}.json`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ShopifyProduct;
    const p = data.product;
    const categorySlug =
      PRODUCT_TYPE_TO_CATEGORY[p.product_type] ?? "herbal";
    const desc = p.body_html ? stripHtml(p.body_html).slice(0, 2000) : null;
    return {
      handle: p.handle,
      nameNative: p.title,
      nameEnglish: p.title,
      slug: `samovar-${p.handle}`,
      description: desc || null,
      imageUrl: p.image?.src ?? null,
      productType: p.product_type,
      categorySlug,
      origin: p.body_html ? extractOrigin(p.body_html) : null,
      sourceUrl: `${BASE}/products/${p.handle}`,
    };
  } catch {
    return null;
  }
}

async function main() {
  const outPath = "prisma/samovar-products.json";
  const results: SamovarProduct[] = [];
  for (let i = 0; i < TEA_HANDLES.length; i++) {
    const handle = TEA_HANDLES[i];
    process.stderr.write(
      `Fetching ${i + 1}/${TEA_HANDLES.length}: ${handle}...\n`
    );
    const product = await fetchProduct(handle);
    if (product) results.push(product);
    await new Promise((r) => setTimeout(r, 300));
  }
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
