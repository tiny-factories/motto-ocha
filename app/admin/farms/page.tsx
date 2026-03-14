import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminFarmsPage() {
  const farms = await prisma.farm.findMany({
    orderBy: { nameNative: "asc" },
    include: { _count: { select: { teas: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Farms
        </h1>
        <Link
          href="/admin/farms/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add farm
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Native name</th>
              <th className="px-4 py-3 font-medium">English</th>
              <th className="px-4 py-3 font-medium">Teas</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {farms.map((farm) => (
              <tr
                key={farm.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{farm.nameNative}</td>
                <td className="px-4 py-3 text-zinc-500">{farm.nameEnglish ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{farm._count.teas}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/farms/${farm.id}/edit`}
                    className="text-zinc-600 hover:underline dark:text-zinc-400"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {farms.length === 0 && (
        <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          No farms yet.
        </p>
      )}
    </div>
  );
}
