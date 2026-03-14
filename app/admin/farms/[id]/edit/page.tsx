import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FarmForm } from "@/components/admin/FarmForm";

export default async function EditFarmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farm = await prisma.farm.findUnique({ where: { id } });
  if (!farm) notFound();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Edit farm
      </h1>
      <FarmForm farm={farm} />
    </div>
  );
}
