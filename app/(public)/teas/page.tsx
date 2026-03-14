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
    orderBy: { nameNative: "asc" },
    include: {
      farm: { select: { nameNative: true, slug: true } },
      vendorTeas: { include: { vendor: { select: { id: true, name: true } } } },
      teaTasteTags: { orderBy: { rank: "asc" }, include: { tasteTag: { select: { label: true } } } },
      categoryAssignments: { include: { teaCategory: { select: { id: true, label: true } } } },
    },
  });

  const teaCategories = await prisma.teaCategory.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Teas
      </h1>
      <Suspense fallback={null}>
        <TeasListFilters
          teaCategories={teaCategories}
          currentCategory={categoryId}
          currentScale={scale}
          currentYear={year}
        />
      </Suspense>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teas.map((tea) => (
          <TeaCard key={tea.id} tea={tea} />
        ))}
      </div>
      {teas.length === 0 && (
        <p className="mt-6 text-zinc-500 dark:text-zinc-400">No teas match the filters.</p>
      )}
    </div>
  );
}
