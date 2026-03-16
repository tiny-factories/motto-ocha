import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";
import { SearchForm } from "@/components/SearchForm";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let teas: Awaited<ReturnType<typeof prisma.tea.findMany>> = [];
  let vendors: { id: string; name: string }[] = [];

  if (query.length >= 2) {
    try {
      const [teaResults, vendorResults] = await Promise.all([
        prisma.tea.findMany({
          where: {
            OR: [
              { nameNative: { contains: query, mode: "insensitive" } },
              { nameEnglish: { contains: query, mode: "insensitive" } },
              {
                aliases: {
                  some: { value: { contains: query, mode: "insensitive" } },
                },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 30,
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
        }),
        prisma.vendor.findMany({
          where: { name: { contains: query, mode: "insensitive" } },
          take: 10,
          select: { id: true, name: true },
        }),
      ]);
      teas = teaResults;
      vendors = vendorResults;
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Search
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find teas and vendors by name.
      </p>

      <Suspense fallback={null}>
        <SearchForm initialQuery={query} />
      </Suspense>

      {query.length > 0 && (
        <>
          {vendors.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Vendors
              </h2>
              <ul className="mt-2 space-y-1">
                {vendors.map((v) => (
                  <li key={v.id}>
                    <a
                      href={`/vendors/${v.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {v.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Teas
            </h2>
            {teas.length === 0 && vendors.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;. Try a different term.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {teas.map((tea) => (
                  <TeaCard key={tea.id} tea={tea} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {query.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Enter at least 2 characters to search.
        </p>
      )}
    </div>
  );
}
