import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      teas: {
        include: {
          tea: {
            include: {
              farm: { select: { nameNative: true, slug: true } },
              vendorTeas: { include: { vendor: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!vendor) notFound();

  const teas = vendor.teas.map((vt) => vt.tea);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/vendors"
        className="mb-6 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to Vendors
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {vendor.name}
        </h1>
        {vendor.scale && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {vendor.scale === "independent" ? "Independent" : "Commercial"} vendor
          </p>
        )}
        {vendor.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            {vendor.description}
          </p>
        )}
        {vendor.url && (
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Visit website
          </a>
        )}
      </div>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Teas from this vendor
        </h2>
        {teas.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No teas linked to this vendor yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teas.map((tea) => (
              <TeaCard key={tea.id} tea={tea} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
