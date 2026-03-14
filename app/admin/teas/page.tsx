import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminTeasPage() {
  const teas = await prisma.tea.findMany({
    orderBy: { nameNative: "asc" },
    include: {
      farm: { select: { nameNative: true } },
      vendorTeas: { include: { vendor: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Teas
        </h1>
        <Link
          href="/admin/teas/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add tea
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Native name</th>
              <th className="px-4 py-3 font-medium">English</th>
              <th className="px-4 py-3 font-medium">Farm</th>
              <th className="px-4 py-3 font-medium">Vendors</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {teas.map((tea) => (
              <tr
                key={tea.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{tea.nameNative}</td>
                <td className="px-4 py-3 text-zinc-500">{tea.nameEnglish ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {tea.farm?.nameNative ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {tea.vendorTeas.length
                    ? tea.vendorTeas.map((vt) => vt.vendor.name).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/teas/${tea.id}/edit`}
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
      {teas.length === 0 && (
        <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          No teas yet. Add one above.
        </p>
      )}
    </div>
  );
}
