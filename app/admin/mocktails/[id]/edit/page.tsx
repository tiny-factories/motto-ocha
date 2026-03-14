import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MocktailForm } from "@/components/admin/MocktailForm";

export default async function EditMocktailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mocktail, teas] = await Promise.all([
    prisma.mocktail.findUnique({
      where: { id },
      include: {
        ingredients: { orderBy: { sortOrder: "asc" } },
        steps: { orderBy: { stepNumber: "asc" } },
      },
    }),
    prisma.tea.findMany({
      orderBy: { nameNative: "asc" },
      select: { id: true, nameNative: true, nameEnglish: true },
    }),
  ]);

  if (!mocktail) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Edit mocktail
      </h1>
      <MocktailForm teas={teas} mocktail={mocktail} />
    </div>
  );
}
