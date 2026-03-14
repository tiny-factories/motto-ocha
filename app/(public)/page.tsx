import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";
import { FarmCard } from "@/components/FarmCard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canViewRestrictedData = canAccessExpertData(role);

  let teas: Awaited<ReturnType<typeof prisma.tea.findMany>> = [];
  let farms: Awaited<ReturnType<typeof prisma.farm.findMany>> = [];
  let vendors: Awaited<
    ReturnType<
      typeof prisma.vendor.findMany<{
        include: { _count: { select: { teas: true } } };
      }>
    >
  > = [];
  let dbError = false;

  try {
    [teas, farms] = await Promise.all([
      prisma.tea.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: {
          farm: { select: { nameNative: true, slug: true } },
          vendorTeas: { include: { vendor: { select: { id: true, name: true } } } },
        },
      }),
      prisma.farm.findMany({
        take: 3,
        orderBy: { nameNative: "asc" },
        include: { _count: { select: { teas: true } } },
      }),
    ]);
    if (canViewRestrictedData) {
      vendors = await prisma.vendor.findMany({
        take: 6,
        orderBy: { name: "asc" },
        include: { _count: { select: { teas: true } } },
      });
    }
  } catch {
    dbError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {dbError && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Database is not connected. Start PostgreSQL (e.g.{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
            docker compose up -d postgres
          </code>
          ) and set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">DATABASE_URL</code> in{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">.env</code> to{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">postgresql://motto:motto@localhost:5432/motto_ocha</code>, then run{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">npx prisma migrate deploy</code>.
        </div>
      )}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Motto Ocha
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Tea index — farms, vendors, and teas. Native names, English labels.
        </p>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Recent teas
          </h2>
          <Link
            href="/teas"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teas.map((tea) => (
            <TeaCard key={tea.id} tea={tea} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Farms
          </h2>
          <Link
            href="/farms"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      </section>

      {canViewRestrictedData && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Vendors
            </h2>
            <Link
              href="/vendors"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {vendor.name}
                </h3>
                {vendor.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {vendor.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  {vendor._count.teas} tea{vendor._count.teas !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
          {vendors.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400">No vendors yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
