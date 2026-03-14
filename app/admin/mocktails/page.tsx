import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminMocktailsPage() {
  const mocktails = await prisma.mocktail.findMany({
    orderBy: { name: "asc" },
    include: {
      tea: { select: { nameNative: true } },
      _count: { select: { ingredients: true, steps: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Mocktails
        </h1>
        <Link
          href="/admin/mocktails/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add mocktail
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Base tea</th>
              <th className="px-4 py-3 font-medium">Recipe</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {mocktails.map((mocktail) => (
              <tr
                key={mocktail.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {mocktail.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    /mocktails/{mocktail.slug}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {mocktail.tea?.nameNative ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {mocktail._count.ingredients} ingredients, {mocktail._count.steps} steps
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/mocktails/${mocktail.id}/edit`}
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

      {mocktails.length === 0 && (
        <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          No mocktails yet.
        </p>
      )}
    </div>
  );
}
