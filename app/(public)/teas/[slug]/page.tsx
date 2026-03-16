import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddToList } from "@/components/AddToList";
import { TeaReviewForm } from "@/components/TeaReviewForm";

export default async function TeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const tea = await prisma.tea.findUnique({
    where: { slug },
    include: {
      vendorTeas: { include: { vendor: true } },
      teaTasteTags: { orderBy: { rank: "asc" }, include: { tasteTag: true } },
      categoryAssignments: { include: { teaCategory: true } },
    },
  });

  if (!tea) notFound();

  const vendors = tea.vendorTeas.map((vt) => ({
    id: vt.vendor.id,
    name: vt.vendor.name,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-light">
            <span className="text-2xl font-semibold text-accent" aria-hidden>
              {tea.nameNative.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {tea.nameNative}
            </h1>
            {tea.nameEnglish && (
              <p className="mt-0.5 text-lg text-muted-foreground">
                {tea.nameEnglish}
              </p>
            )}
          </div>
        </div>

        {tea.description && (
          <p className="text-muted-foreground">{tea.description}</p>
        )}
      </div>

      {/* Details */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {tea.categoryAssignments.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              Type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tea.categoryAssignments.map((a) => (
                <span
                  key={a.teaCategory.id}
                  className="rounded-full bg-accent-light px-2.5 py-0.5 text-sm font-medium text-accent"
                >
                  {a.teaCategory.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {tea.vendorTeas.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              Vendor
            </p>
            <p className="text-sm text-foreground">
              {tea.vendorTeas.map((vt) => vt.vendor.name).join(", ")}
            </p>
          </div>
        )}

        {(tea.prefecture || tea.region || tea.country) && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              Origin
            </p>
            <p className="text-sm text-foreground">
              {[tea.prefecture, tea.region, tea.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {tea.caffeineLevel && (
          <div className="rounded-xl border border-card-border bg-card p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              Caffeine
            </p>
            <p className="text-sm capitalize text-foreground">
              {tea.caffeineLevel}
            </p>
          </div>
        )}
      </div>

      {/* Taste tags */}
      {tea.teaTasteTags.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
            Tasting notes
          </h2>
          <div className="flex flex-wrap gap-2">
            {tea.teaTasteTags.map((tt) => (
              <span
                key={tt.tasteTag.id}
                className="rounded-lg bg-warm-highlight px-3 py-1.5 text-sm text-foreground"
              >
                {tt.tasteTag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add to list */}
      <div className="mb-8">
        <AddToList teaId={tea.id} />
      </div>

      {/* Review */}
      <div className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Your notes
        </h2>
        <TeaReviewForm
          teaId={tea.id}
          vendors={vendors}
          allowVendorSelection={vendors.length > 1}
        />
      </div>

      {/* Additional info */}
      {(tea.year || tea.processingNotes || tea.singleOrigin !== null) && (
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
            Additional details
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            {tea.year && <p>{tea.year} harvest</p>}
            {tea.singleOrigin !== null && (
              <p>{tea.singleOrigin ? "Single origin" : "Blend"}</p>
            )}
            {tea.processingNotes && <p>{tea.processingNotes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
