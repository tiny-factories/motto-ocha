import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeaCategoryForm } from "@/components/admin/TeaCategoryForm";

export default async function EditTeaCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    prisma.teaCategory.findUnique({ where: { id } }),
    prisma.teaCategory.findMany({ orderBy: { label: "asc" }, select: { id: true, label: true } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Edit tea category
      </h1>
      <TeaCategoryForm category={category} parentOptions={categories} />
    </div>
  );
}
