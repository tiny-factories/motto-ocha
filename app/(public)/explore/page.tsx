import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";
import { ExploreTabs } from "@/components/ExploreTabs";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "followed" ? "followed" : "all";

  let teas: Awaited<ReturnType<typeof prisma.tea.findMany>> = [];

  if (activeTab === "all") {
    try {
      teas = await prisma.tea.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
        include: {
          farm: { select: { nameNative: true, slug: true } },
          vendorTeas: {
            include: { vendor: { select: { id: true, name: true } } },
          },
          teaTasteTags: {
            orderBy: { rank: "asc" },
            include: { tasteTag: { select: { label: true } } },
          },
          categoryAssignments: {
            include: { teaCategory: { select: { id: true, label: true } } },
          },
        },
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Explore
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse the tea catalog. Follow vendors or people to see them in
        Followed.
      </p>

      <Suspense fallback={null}>
        <ExploreTabs activeTab={activeTab} />
      </Suspense>

      {activeTab === "all" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {teas.map((tea) => (
            <TeaCard key={tea.id} tea={tea} />
          ))}
        </div>
      )}
      {teas.length === 0 && activeTab === "all" && (
        <div className="mt-8 rounded-lg border border-card-border bg-warm-highlight p-8 text-center">
          <p className="text-muted-foreground">No teas in the catalog yet.</p>
        </div>
      )}

      {activeTab === "followed" && (
        <div className="mt-8 rounded-lg border border-card-border bg-warm-highlight p-8 text-center">
          <p className="text-muted-foreground">
            Follow vendors or people to see their teas and posts here. Coming
            soon.
          </p>
          <Link
            href="/explore?tab=all"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Browse all teas →
          </Link>
        </div>
      )}
    </div>
  );
}
