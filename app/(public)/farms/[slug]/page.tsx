import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { TeaCard } from "@/components/TeaCard";

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const farm = await prisma.farm.findUnique({
    where: { slug },
    include: {
      teas: {
        include: {
          vendorTeas: { include: { vendor: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!farm) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {farm.imageUrl ? (
            <Image
              src={farm.imageUrl}
              alt={farm.nameEnglish ?? farm.nameNative}
              width={400}
              height={225}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              No image
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {farm.nameNative}
          </h1>
          {farm.nameEnglish && (
            <p className="mt-1 text-lg text-zinc-500 dark:text-zinc-400">
              {farm.nameEnglish}
            </p>
          )}
          {(farm.locationText || farm.prefecture || farm.region || farm.country) && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">
              {[farm.locationText, farm.prefecture, farm.region, farm.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {farm.scale && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {farm.scale === "independent" ? "Independent" : "Commercial"} producer
            </p>
          )}
          {farm.description && (
            <p className="mt-4 text-zinc-600 dark:text-zinc-300">
              {farm.description}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Teas from this farm
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {farm.teas.map((tea) => (
            <TeaCard
              key={tea.id}
              tea={{
                ...tea,
                farm: { nameNative: farm.nameNative, slug: farm.slug },
              }}
            />
          ))}
        </div>
        {farm.teas.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">
            No teas linked to this farm yet.
          </p>
        )}
      </section>
    </div>
  );
}
