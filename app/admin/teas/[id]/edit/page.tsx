import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeaForm } from "@/components/admin/TeaForm";

export default async function EditTeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tea, farms, vendors, tasteTags, teaCategories] = await Promise.all([
    prisma.tea.findUnique({
      where: { id },
      include: {
        vendorTeas: { select: { vendorId: true } },
        teaTasteTags: { orderBy: { rank: "asc" }, select: { tasteTagId: true } },
        categoryAssignments: { select: { teaCategoryId: true } },
        aliases: { select: { value: true }, orderBy: { value: "asc" } },
        barcodes: { select: { code: true }, orderBy: { code: "asc" } },
      },
    }),
    prisma.farm.findMany({ orderBy: { nameNative: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.tasteTag.findMany({ orderBy: { label: "asc" } }),
    prisma.teaCategory.findMany({ orderBy: { label: "asc" } }),
  ]);

  if (!tea) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Edit tea
      </h1>
      <TeaForm
        tea={{
          ...tea,
          vendorIds: tea.vendorTeas.map((vt) => vt.vendorId),
          tasteTagIds: tea.teaTasteTags.map((tt) => tt.tasteTagId),
          categoryIds: tea.categoryAssignments.map((a) => a.teaCategoryId),
          alternativeNames: tea.aliases.map((alias) => alias.value),
          barcodes: tea.barcodes.map((barcode) => barcode.code),
        }}
        farms={farms}
        vendors={vendors}
        tasteTags={tasteTags}
        teaCategories={teaCategories}
      />
    </div>
  );
}
