import { prisma } from "@/lib/prisma";
import { MocktailForm } from "@/components/admin/MocktailForm";

export default async function NewMocktailPage() {
  const teas = await prisma.tea.findMany({
    orderBy: { nameNative: "asc" },
    select: { id: true, nameNative: true, nameEnglish: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add mocktail
      </h1>
      <MocktailForm teas={teas} />
    </div>
  );
}
