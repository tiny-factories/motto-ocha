import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VendorForm } from "@/components/admin/VendorForm";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Edit vendor
      </h1>
      <VendorForm vendor={vendor} />
    </div>
  );
}
