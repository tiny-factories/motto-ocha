import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role;
  if (!canAccessExpertData(role)) {
    redirect("/");
  }

  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: {
      teas: {
        include: {
          tea: {
            select: {
              farm: { select: { nameNative: true } },
              region: true,
              country: true,
              prefecture: true,
              categoryAssignments: {
                include: {
                  teaCategory: { select: { id: true, label: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Vendors
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => {
          const places = new Set<string>();
          const types = new Map<string, string>();
          for (const { tea } of vendor.teas) {
            if (tea.farm?.nameNative) places.add(tea.farm.nameNative);
            const loc = [tea.region, tea.prefecture, tea.country]
              .filter(Boolean)
              .join(", ");
            if (loc) places.add(loc);
            for (const a of tea.categoryAssignments) {
              types.set(a.teaCategory.id, a.teaCategory.label);
            }
          }
          const placeList = Array.from(places).slice(0, 5);
          const typeList = Array.from(types.values());

          return (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex flex-1 flex-col">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {vendor.name.charAt(0)}
                  </div>
                  <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                    {vendor.name}
                  </h2>
                </div>
                {placeList.length > 0 && (
                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Sources from: {placeList.join(" · ")}
                    {places.size > 5 && " …"}
                  </p>
                )}
                {typeList.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1.5" title={typeList.join(", ")}>
                    {typeList.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"
                        title={label}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
                          aria-hidden
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {vendors.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No vendors yet.</p>
      )}
    </div>
  );
}
