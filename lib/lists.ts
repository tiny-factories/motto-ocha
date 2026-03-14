import { prisma } from "@/lib/prisma";

const DEFAULT_LISTS = [
  { name: "Favorites", slug: "favorites" },
  { name: "Want to try", slug: "want-to-try" },
  { name: "Tried", slug: "tried" },
] as const;

export const DEFAULT_SLUGS = DEFAULT_LISTS.map((l) => l.slug);
export type DefaultSlug = (typeof DEFAULT_LISTS)[number]["slug"];

export function isDefaultList(slug: string): boolean {
  return DEFAULT_SLUGS.includes(slug as DefaultSlug);
}

/**
 * Ensures the user has the three default lists (Favorites, Want to try, Tried).
 * Idempotent: safe to call on every My Lists visit or after signup.
 */
export async function ensureDefaultLists(userId: string): Promise<void> {
  const existing = await prisma.list.findMany({
    where: { userId },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((l) => l.slug));
  const toCreate = DEFAULT_LISTS.filter((d) => !existingSlugs.has(d.slug));
  if (toCreate.length === 0) return;
  await prisma.list.createMany({
    data: toCreate.map((d) => ({
      userId,
      name: d.name,
      slug: d.slug,
    })),
  });
}

/**
 * Generate a unique slug for a custom list (from name + short id to avoid collisions).
 */
export function slugForCustomList(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const id = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${id}` : id;
}
