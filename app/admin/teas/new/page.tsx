import { prisma } from "@/lib/prisma";
import { TeaForm } from "@/components/admin/TeaForm";

export default async function NewTeaPage() {
  const [farms, vendors, tasteTags, teaCategories] = await Promise.all([
    prisma.farm.findMany({ orderBy: { nameNative: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.tasteTag.findMany({ orderBy: { label: "asc" } }),
    prisma.teaCategory.findMany({ orderBy: { label: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add tea
      </h1>
      <TeaForm
        farms={farms}
        vendors={vendors}
        tasteTags={tasteTags}
        teaCategories={teaCategories}
      />
    </div>
  );
}
