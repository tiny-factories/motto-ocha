import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FeedCard } from "@/components/FeedCard";

type FeedItem =
  | {
      type: "post";
      id: string;
      date: Date;
      review: string | null;
      rating: number | null;
      createdAt: Date;
      user: { name: string | null };
      tea: { slug: string; nameEnglish: string | null; nameNative: string };
      vendor: { name: string } | null;
    }
  | {
      type: "tea";
      date: Date;
      slug: string;
      nameNative: string;
      nameEnglish: string | null;
      createdAt: Date;
      categoryLabel?: string | null;
      vendorName?: string | null;
    };

export default async function HomePage() {
  let posts: Array<{
    id: string;
    review: string | null;
    rating: number | null;
    createdAt: Date;
    user: { name: string | null };
    tea: { slug: string; nameEnglish: string | null; nameNative: string };
    vendor: { name: string } | null;
  }> = [];
  let newTeas: Array<{
    slug: string;
    nameNative: string;
    nameEnglish: string | null;
    createdAt: Date;
    categoryLabel: string | null;
    vendorName: string | null;
  }> = [];

  try {
    [posts, newTeas] = await Promise.all([
      prisma.teaReview.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          review: true,
          rating: true,
          createdAt: true,
          user: { select: { name: true } },
          tea: {
            select: { slug: true, nameEnglish: true, nameNative: true },
          },
          vendor: { select: { name: true } },
        },
      }),
      prisma.tea.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          slug: true,
          nameNative: true,
          nameEnglish: true,
          createdAt: true,
          categoryAssignments: {
            take: 1,
            include: {
              teaCategory: { select: { label: true } },
            },
          },
          vendorTeas: {
            take: 1,
            include: { vendor: { select: { name: true } } },
          },
        },
      }),
    ]);
  } catch {
    // ignore DB errors
  }

  const feedItems: FeedItem[] = [
    ...posts.map((p) => ({
      type: "post" as const,
      id: p.id,
      date: p.createdAt,
      review: p.review,
      rating: p.rating,
      createdAt: p.createdAt,
      user: p.user,
      tea: p.tea,
      vendor: p.vendor,
    })),
    ...newTeas.map((t) => ({
      type: "tea" as const,
      date: t.createdAt,
      slug: t.slug,
      nameNative: t.nameNative,
      nameEnglish: t.nameEnglish,
      createdAt: t.createdAt,
      categoryLabel: t.categoryAssignments[0]?.teaCategory?.label ?? null,
      vendorName: t.vendorTeas[0]?.vendor?.name ?? null,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Feed
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Public posts and new teas. Log a tea and share to feed to appear here.
      </p>

      {feedItems.length === 0 ? (
        <div className="mt-10 rounded-lg border border-card-border bg-warm-highlight p-8 text-center">
          <p className="text-muted-foreground">
            No public posts or teas yet. Log a tea and check &ldquo;Share to
            feed&rdquo; on a tea page to show it here.
          </p>
          <Link
            href="/log"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Log a tea →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {feedItems.map((item) =>
            item.type === "post" ? (
              <FeedCard
                key={`post-${item.id}`}
                item={{
                  type: "post",
                  id: item.id,
                  review: item.review,
                  rating: item.rating,
                  createdAt: item.createdAt,
                  user: item.user,
                  tea: item.tea,
                  vendor: item.vendor,
                }}
              />
            ) : (
              <FeedCard
                key={`tea-${item.slug}`}
                item={{
                  type: "tea",
                  slug: item.slug,
                  nameNative: item.nameNative,
                  nameEnglish: item.nameEnglish,
                  createdAt: item.createdAt,
                  categoryLabel: item.categoryLabel,
                  vendorName: item.vendorName,
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
