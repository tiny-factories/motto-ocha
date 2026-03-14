import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminTeaCategoriesPage() {
  const categories = await prisma.teaCategory.findMany({
    orderBy: [{ parentId: "asc" }, { label: "asc" }],
    include: {
      parent: { select: { label: true } },
      _count: { select: { assignments: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Tea categories
        </h1>
        <Link
          href="/admin/tea-categories/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add category
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Teas</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{cat.label}</td>
                <td className="px-4 py-3 text-zinc-500">{cat.slug}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {cat.parent?.label ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">{cat._count.assignments}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/tea-categories/${cat.id}/edit`}
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
      {categories.length === 0 && (
        <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          No categories. Run <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">yarn prisma db seed</code> to seed default types.
        </p>
      )}
    </div>
  );
}
