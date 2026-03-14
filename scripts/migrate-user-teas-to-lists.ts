/**
 * One-time migration: copy UserTea rows into List + ListTea.
 * Run with: npx tsx scripts/migrate-user-teas-to-lists.ts
 * After running, you can remove the UserTea model and this script.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_LISTS = [
  { name: "Favorites", slug: "favorites" },
  { name: "Want to try", slug: "want-to-try" },
  { name: "Tried", slug: "tried" },
] as const;

async function ensureDefaultListsForUser(userId: string) {
  const existing = await prisma.list.findMany({
    where: { userId },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((l) => l.slug));
  const toCreate = DEFAULT_LISTS.filter((d) => !existingSlugs.has(d.slug));
  if (toCreate.length > 0) {
    await prisma.list.createMany({
      data: toCreate.map((d) => ({ userId, name: d.name, slug: d.slug })),
    });
  }
}

async function main() {
  const userTeas = await prisma.userTea.findMany({
    orderBy: { userId: "asc" },
  });
  if (userTeas.length === 0) {
    console.log("No UserTea rows to migrate.");
    return;
  }
  const userIds = [...new Set(userTeas.map((ut) => ut.userId))];
  console.log(`Found ${userTeas.length} UserTea rows for ${userIds.length} user(s).`);
  for (const userId of userIds) {
    await ensureDefaultListsForUser(userId);
  }
  const listsByUser = await prisma.list.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, slug: true },
  });
  const triedListIdByUser = new Map<string, string>();
  const wantToTryListIdByUser = new Map<string, string>();
  for (const list of listsByUser) {
    if (list.slug === "tried") triedListIdByUser.set(list.userId, list.id);
    if (list.slug === "want-to-try") wantToTryListIdByUser.set(list.userId, list.id);
  }
  let created = 0;
  let skipped = 0;
  for (const ut of userTeas) {
    const listId =
      ut.status === "tried"
        ? triedListIdByUser.get(ut.userId)
        : ut.status === "want_to_try"
          ? wantToTryListIdByUser.get(ut.userId)
          : null;
    if (!listId) {
      skipped++;
      continue;
    }
    try {
      await prisma.listTea.upsert({
        where: { listId_teaId: { listId, teaId: ut.teaId } },
        create: { listId, teaId: ut.teaId },
        update: {},
      });
      created++;
    } catch {
      skipped++;
    }
  }
  console.log(`Created ${created} ListTea rows, skipped ${skipped}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
