import { prisma } from "@/lib/prisma";
import { FarmCard } from "@/components/FarmCard";

export default async function FarmsPage() {
  const farms = await prisma.farm.findMany({
    orderBy: { nameNative: "asc" },
    include: { _count: { select: { teas: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Farms
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <FarmCard key={farm.id} farm={farm} />
        ))}
      </div>
      {farms.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No farms yet.</p>
      )}
    </div>
  );
}
