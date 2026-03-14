import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Taste tags (for tea taste profile)
  const tasteTagSlugs = [
    "mellow",
    "smooth",
    "buttery",
    "nutty",
    "grassy",
    "umami",
    "sweet",
    "astringent",
    "vegetal",
    "floral",
  ];
  for (const slug of tasteTagSlugs) {
    await prisma.tasteTag.upsert({
      where: { slug },
      create: { slug, label: slug.charAt(0).toUpperCase() + slug.slice(1) },
      update: {},
    });
  }

  // Tea categories (type of tea) with optional parent
  const green = await prisma.teaCategory.upsert({
    where: { slug: "green" },
    create: { slug: "green", label: "Green" },
    update: {},
  });
  const categories: { slug: string; label: string; parentId?: string }[] = [
    { slug: "white", label: "White" },
    { slug: "red", label: "Red (Black)" },
    { slug: "oolong", label: "Oolong" },
    { slug: "matcha", label: "Matcha", parentId: green.id },
    { slug: "sencha", label: "Sencha", parentId: green.id },
    { slug: "gyokuro", label: "Gyokuro", parentId: green.id },
    { slug: "houjicha", label: "Hōjicha", parentId: green.id },
    { slug: "genmaicha", label: "Genmaicha", parentId: green.id },
    { slug: "pu-erh", label: "Pu-erh" },
    { slug: "chai", label: "Chai" },
    { slug: "herbal", label: "Herbal" },
  ];
  for (const c of categories) {
    await prisma.teaCategory.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        parentId: c.parentId ?? null,
      },
      update: { parentId: c.parentId ?? undefined },
    });
  }

  // Optional: Samovar Tea example data from scrape
  const path = await import("path");
  const fs = await import("fs");
  const samovarPath = path.join(__dirname, "samovar-products.json");
  if (fs.existsSync(samovarPath)) {
    const samovarProducts = JSON.parse(
      fs.readFileSync(samovarPath, "utf-8")
    ) as Array<{
      slug: string;
      nameNative: string;
      nameEnglish: string | null;
      description: string | null;
      imageUrl: string | null;
      categorySlug: string | null;
      origin: string | null;
    }>;

    let vendor = await prisma.vendor.findFirst({
      where: { name: "Samovar Tea" },
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          name: "Samovar Tea",
          url: "https://www.samovartea.com",
          description:
            "Shop our full selection of whole leaf tea, herbal infusions, and teaware.",
          scale: "commercial",
        },
      });
    }

    const categoryIds = new Map<string, string>();
    const categoriesList = await prisma.teaCategory.findMany({
      select: { id: true, slug: true },
    });
    for (const cat of categoriesList) categoryIds.set(cat.slug, cat.id);

    for (const p of samovarProducts) {
      const [region, country, prefecture] = p.origin
        ? parseOrigin(p.origin)
        : [null, null, null];

      const tea = await prisma.tea.upsert({
        where: { slug: p.slug },
        create: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          slug: p.slug,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
          scale: "commercial",
        },
        update: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
        },
      });

      await prisma.vendorTea.upsert({
        where: {
          vendorId_teaId: { vendorId: vendor.id, teaId: tea.id },
        },
        create: { vendorId: vendor.id, teaId: tea.id },
        update: {},
      });

      if (p.categorySlug) {
        const catId = categoryIds.get(p.categorySlug);
        if (catId)
          await prisma.teaCategoryAssignment.upsert({
            where: {
              teaId_teaCategoryId: { teaId: tea.id, teaCategoryId: catId },
            },
            create: { teaId: tea.id, teaCategoryId: catId },
            update: {},
          });
      }
    }
    console.log(
      `Seeded ${samovarProducts.length} teas from Samovar Tea (vendor: ${vendor.name}).`
    );
  } else {
    console.log(
      "No prisma/samovar-products.json found. Run: npx tsx scripts/scrape-samovar.ts then db:seed again."
    );
  }

  // Optional: Song Tea & Ceramics example data from scrape
  const songPath = path.join(__dirname, "song-products.json");
  if (fs.existsSync(songPath)) {
    const songProducts = JSON.parse(
      fs.readFileSync(songPath, "utf-8")
    ) as Array<{
      slug: string;
      nameNative: string;
      nameEnglish: string | null;
      description: string | null;
      imageUrl: string | null;
      categorySlug: string | null;
      origin: string | null;
    }>;

    let songVendor = await prisma.vendor.findFirst({
      where: { name: "Song Tea & Ceramics" },
    });
    if (!songVendor) {
      songVendor = await prisma.vendor.create({
        data: {
          name: "Song Tea & Ceramics",
          url: "https://songtea.com",
          description:
            "Tea by type: green, white, oolong, red, aged tea, matcha, and botanicals. San Francisco.",
          scale: "commercial",
        },
      });
    }

    const categoryIds = new Map<string, string>();
    const categoriesList = await prisma.teaCategory.findMany({
      select: { id: true, slug: true },
    });
    for (const cat of categoriesList) categoryIds.set(cat.slug, cat.id);

    for (const p of songProducts) {
      const [region, country, prefecture] = p.origin
        ? parseOrigin(p.origin)
        : [null, null, null];

      const tea = await prisma.tea.upsert({
        where: { slug: p.slug },
        create: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          slug: p.slug,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
          scale: "commercial",
        },
        update: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
        },
      });

      await prisma.vendorTea.upsert({
        where: {
          vendorId_teaId: { vendorId: songVendor.id, teaId: tea.id },
        },
        create: { vendorId: songVendor.id, teaId: tea.id },
        update: {},
      });

      if (p.categorySlug) {
        const catId = categoryIds.get(p.categorySlug);
        if (catId)
          await prisma.teaCategoryAssignment.upsert({
            where: {
              teaId_teaCategoryId: { teaId: tea.id, teaCategoryId: catId },
            },
            create: { teaId: tea.id, teaCategoryId: catId },
            update: {},
          });
      }
    }
    console.log(
      `Seeded ${songProducts.length} teas from Song Tea & Ceramics (vendor: ${songVendor.name}).`
    );
  } else {
    console.log(
      "No prisma/song-products.json found. Run: npx tsx scripts/scrape-song.ts then db:seed again."
    );
  }

  // Optional: Ippodo Tea example data (tea only; excludes utensils, gifts, etc.)
  const ippodoPath = path.join(__dirname, "ippodo-products.json");
  if (fs.existsSync(ippodoPath)) {
    const ippodoProducts = JSON.parse(
      fs.readFileSync(ippodoPath, "utf-8")
    ) as Array<{
      slug: string;
      nameNative: string;
      nameEnglish: string | null;
      description: string | null;
      imageUrl: string | null;
      categorySlug: string | null;
      origin: string | null;
    }>;

    let ippodoVendor = await prisma.vendor.findFirst({
      where: { name: "Ippodo Tea" },
    });
    if (!ippodoVendor) {
      ippodoVendor = await prisma.vendor.create({
        data: {
          name: "Ippodo Tea",
          url: "https://ippodotea.com",
          description:
            "Japanese tea company founded in 1717 in Kyoto. Matcha, Gyokuro, Sencha, Bancha.",
          scale: "commercial",
        },
      });
    }

    const categoryIds = new Map<string, string>();
    const categoriesList = await prisma.teaCategory.findMany({
      select: { id: true, slug: true },
    });
    for (const cat of categoriesList) categoryIds.set(cat.slug, cat.id);

    for (const p of ippodoProducts) {
      const [region, country, prefecture] = p.origin
        ? parseOrigin(p.origin)
        : [null, null, null];

      const tea = await prisma.tea.upsert({
        where: { slug: p.slug },
        create: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          slug: p.slug,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
          scale: "commercial",
        },
        update: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
        },
      });

      await prisma.vendorTea.upsert({
        where: {
          vendorId_teaId: { vendorId: ippodoVendor.id, teaId: tea.id },
        },
        create: { vendorId: ippodoVendor.id, teaId: tea.id },
        update: {},
      });

      if (p.categorySlug) {
        const catId = categoryIds.get(p.categorySlug);
        if (catId)
          await prisma.teaCategoryAssignment.upsert({
            where: {
              teaId_teaCategoryId: { teaId: tea.id, teaCategoryId: catId },
            },
            create: { teaId: tea.id, teaCategoryId: catId },
            update: {},
          });
      }
    }
    console.log(
      `Seeded ${ippodoProducts.length} teas from Ippodo Tea (vendor: ${ippodoVendor.name}).`
    );
  } else {
    console.log(
      "No prisma/ippodo-products.json found. Run: npx tsx scripts/scrape-ippodo.ts then db:seed again."
    );
  }

  // Optional: Red Blossom Tea Company (teas + all child collections, paginated)
  const redblossomPath = path.join(__dirname, "redblossom-products.json");
  if (fs.existsSync(redblossomPath)) {
    const redblossomProducts = JSON.parse(
      fs.readFileSync(redblossomPath, "utf-8")
    ) as Array<{
      slug: string;
      nameNative: string;
      nameEnglish: string | null;
      description: string | null;
      imageUrl: string | null;
      categorySlug: string;
      origin: string | null;
    }>;

    let redblossomVendor = await prisma.vendor.findFirst({
      where: { name: "Red Blossom Tea Company" },
    });
    if (!redblossomVendor) {
      redblossomVendor = await prisma.vendor.create({
        data: {
          name: "Red Blossom Tea Company",
          url: "https://redblossomtea.com",
          description:
            "Crafted in small batches, sourced from multi-generational producers in China and Taiwan. San Francisco.",
          scale: "commercial",
        },
      });
    }

    const categoryIds = new Map<string, string>();
    const categoriesList = await prisma.teaCategory.findMany({
      select: { id: true, slug: true },
    });
    for (const cat of categoriesList) categoryIds.set(cat.slug, cat.id);

    for (const p of redblossomProducts) {
      const [region, country, prefecture] = p.origin
        ? parseOrigin(p.origin)
        : [null, null, null];

      const tea = await prisma.tea.upsert({
        where: { slug: p.slug },
        create: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          slug: p.slug,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
          scale: "commercial",
        },
        update: {
          nameNative: p.nameNative,
          nameEnglish: p.nameEnglish ?? p.nameNative,
          description: p.description,
          imageUrl: p.imageUrl,
          region: region ?? undefined,
          country: country ?? undefined,
          prefecture: prefecture ?? undefined,
        },
      });

      await prisma.vendorTea.upsert({
        where: {
          vendorId_teaId: { vendorId: redblossomVendor.id, teaId: tea.id },
        },
        create: { vendorId: redblossomVendor.id, teaId: tea.id },
        update: {},
      });

      const catId = categoryIds.get(p.categorySlug);
      if (catId)
        await prisma.teaCategoryAssignment.upsert({
          where: {
            teaId_teaCategoryId: { teaId: tea.id, teaCategoryId: catId },
          },
          create: { teaId: tea.id, teaCategoryId: catId },
          update: {},
        });
    }
    console.log(
      `Seeded ${redblossomProducts.length} teas from Red Blossom Tea Company (vendor: ${redblossomVendor.name}).`
    );
  } else {
    console.log(
      "No prisma/redblossom-products.json found. Run: npx tsx scripts/scrape-redblossom.ts then db:seed again."
    );
  }

  console.log("Seed completed (taste tags + tea categories).");
}

function parseOrigin(origin: string): [string | null, string | null, string | null] {
  const s = origin.trim();
  if (!s) return [null, null, null];
  if (s.includes(",")) {
    const parts = s.split(",").map((x) => x.trim());
    if (parts.length >= 2)
      return [parts[0], parts[parts.length - 1], parts.length > 2 ? parts[1] : null];
  }
  if (s.toLowerCase().includes("japan")) return [s, "Japan", null];
  if (s.toLowerCase().includes("china")) return [s, "China", null];
  if (s.toLowerCase().includes("india")) return [s, "India", null];
  return [s, null, null];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
