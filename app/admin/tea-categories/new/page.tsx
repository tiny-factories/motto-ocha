import { prisma } from "@/lib/prisma";
import { TeaCategoryForm } from "@/components/admin/TeaCategoryForm";

export default async function NewTeaCategoryPage() {
  const categories = await prisma.teaCategory.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add tea category
      </h1>
      <TeaCategoryForm parentOptions={categories} />
    </div>
  );
}
