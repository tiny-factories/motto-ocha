import { prisma } from "@/lib/prisma";
import { TasteTagForm } from "@/components/admin/TasteTagForm";

export default async function AdminTasteTagsPage() {
  const tasteTags = await prisma.tasteTag.findMany({
    orderBy: { label: "asc" },
    include: { _count: { select: { teaTasteTags: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Taste tags
      </h1>
      <TasteTagForm className="mb-8" />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Teas</th>
            </tr>
          </thead>
          <tbody>
            {tasteTags.map((tag) => (
              <tr
                key={tag.id}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{tag.label}</td>
                <td className="px-4 py-3 text-zinc-500">{tag.slug}</td>
                <td className="px-4 py-3 text-zinc-500">{tag._count.teaTasteTags}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tasteTags.length === 0 && (
        <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          No taste tags. Run <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">yarn prisma db seed</code> to seed defaults.
        </p>
      )}
    </div>
  );
}
