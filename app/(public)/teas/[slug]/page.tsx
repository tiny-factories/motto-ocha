import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Viewer3D } from "@/components/Viewer3D";
import { AddToList } from "@/components/AddToList";
import { TeaReviewForm } from "@/components/TeaReviewForm";

export default async function TeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tea = await prisma.tea.findUnique({
    where: { slug },
    include: {
      farm: true,
      vendorTeas: { include: { vendor: true } },
      teaTasteTags: { orderBy: { rank: "asc" }, include: { tasteTag: true } },
      categoryAssignments: { include: { teaCategory: true } },
    },
  });

  if (!tea) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 grid gap-8 md:grid-cols-2">
        <div className="aspect-[4/3] relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {tea.imageUrl ? (
            <Image
              src={tea.imageUrl}
              alt={tea.nameEnglish ?? tea.nameNative}
              fill
              className="object-cover"
              priority
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
            {tea.nameNative}
          </h1>
          {tea.nameEnglish && (
            <p className="mt-1 text-lg text-zinc-500 dark:text-zinc-400">
              {tea.nameEnglish}
            </p>
          )}
          {tea.description && (
            <p className="mt-4 text-zinc-600 dark:text-zinc-300">
              {tea.description}
            </p>
          )}
          {tea.farm && (
            <p className="mt-4">
              <span className="text-zinc-500 dark:text-zinc-400">Farm: </span>
              <Link
                href={`/farms/${tea.farm.slug}`}
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {tea.farm.nameNative}
                {tea.farm.nameEnglish && ` (${tea.farm.nameEnglish})`}
              </Link>
            </p>
          )}
          {tea.vendorTeas.length > 0 && (
            <p className="mt-1">
              <span className="text-zinc-500 dark:text-zinc-400">
                Imported by:{" "}
              </span>
              {tea.vendorTeas.map((vt, i) => (
                <span key={vt.vendor.id}>
                  {i > 0 && ", "}
                  <Link
                    href={`/vendors/${vt.vendor.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {vt.vendor.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {tea.categoryAssignments.length > 0 && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Type:{" "}
              {tea.categoryAssignments.map((a) => a.teaCategory.label).join(", ")}
            </p>
          )}
          {tea.teaTasteTags.length > 0 && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Taste:{" "}
              {tea.teaTasteTags.map((tt) => tt.tasteTag.label).join(", ")}
            </p>
          )}
          {tea.year && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tea.year} harvest
            </p>
          )}
          {tea.caffeineLevel && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Caffeine: {tea.caffeineLevel.charAt(0).toUpperCase() + tea.caffeineLevel.slice(1)}
            </p>
          )}
          {tea.processingNotes && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Processing: {tea.processingNotes}
            </p>
          )}
          {tea.singleOrigin !== null && tea.singleOrigin !== undefined && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tea.singleOrigin ? "Single origin" : "Blend"}
            </p>
          )}
          {tea.scale && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tea.scale === "independent" ? "Independent" : "Commercial"} producer
            </p>
          )}
          {(tea.farm?.prefecture ?? tea.prefecture ?? tea.farm?.region ?? tea.region ?? tea.farm?.country ?? tea.country) && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {[
                tea.farm?.prefecture ?? tea.prefecture,
                tea.farm?.region ?? tea.region,
                tea.farm?.country ?? tea.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          <AddToList teaId={tea.id} />
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Your review & where you found it
            </h2>
            <TeaReviewForm
              teaId={tea.id}
              vendors={tea.vendorTeas.map((vt) => ({
                id: vt.vendor.id,
                name: vt.vendor.name,
              }))}
            />
          </div>
        </div>
      </div>

      <section className="mt-12 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          3D views
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Tea
            </h3>
            <Viewer3D src={tea.teaModelUrl} alt={`${tea.nameNative} – tea`} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Packaging
            </h3>
            <Viewer3D
              src={tea.packagingModelUrl}
              alt={`${tea.nameNative} – packaging`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
