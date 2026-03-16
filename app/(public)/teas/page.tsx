import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";
import { TeasListFilters } from "@/components/TeasListFilters";

export default async function TeasPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; scale?: string; year?: string }>;
}) {
  const { category: categoryId, scale, year } = await searchParams;
  const teas = await prisma.tea.findMany({
    where: {
      ...(categoryId
        ? { categoryAssignments: { some: { teaCategoryId: categoryId } } }
        : {}),
      ...(scale ? { scale } : {}),
      ...(year ? { year: parseInt(year, 10) } : {}),
    },
    orderBy: { createdAt: "desc" },
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

  const teaCategories = await prisma.teaCategory.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Tea database
        </h1>
        <p className="mt-2 text-muted-foreground">
          {teas.length} tea{teas.length !== 1 ? "s" : ""} cataloged by the
          community.
        </p>
      </div>
      <Suspense fallback={null}>
        <TeasListFilters
          teaCategories={teaCategories}
          currentCategory={categoryId}
          currentScale={scale}
          currentYear={year}
        />
      </Suspense>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teas.map((tea) => (
          <TeaCard key={tea.id} tea={tea} />
        ))}
      </div>
      {teas.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-card-border p-12 text-center">
          <p className="text-muted-foreground">
            No teas match the filters. Try broadening your search.
          </p>
        </div>
      )}
    </div>
  );
}
