import Link from "next/link";

type Tea = {
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  year?: number | null;
  farm?: { nameNative: string; slug: string } | null;
  vendorTeas?: { vendor: { id: string; name: string } }[];
  teaTasteTags?: { tasteTag: { label: string } }[];
  categoryAssignments?: { teaCategory: { id: string; label: string } }[];
};

export function TeaCard({ tea }: { tea: Tea }) {
  const categories =
    tea.categoryAssignments?.map((a) => a.teaCategory.label) ?? [];
  const tasteLabels =
    tea.teaTasteTags?.map((tt) => tt.tasteTag.label) ?? [];
  const vendor = tea.vendorTeas?.[0]?.vendor?.name;

  return (
    <Link
      href={`/teas/${tea.slug}`}
      className="group block overflow-hidden rounded-xl border border-card-border bg-card transition-all hover:border-accent/30 hover:shadow-md"
    >
      <div className="flex aspect-[5/3] items-center justify-center bg-warm-highlight">
        <span className="text-3xl font-medium text-accent/40" aria-hidden>
          {tea.nameNative.charAt(0)}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground transition-colors group-hover:text-accent">
          {tea.nameNative}
        </h3>
        {tea.nameEnglish && (
          <p className="text-sm text-muted-foreground">{tea.nameEnglish}</p>
        )}
        {(categories.length > 0 || vendor) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent"
              >
                {cat}
              </span>
            ))}
            {vendor && (
              <span className="rounded-full border border-card-border px-2 py-0.5 text-[11px] text-muted-foreground">
                {vendor}
              </span>
            )}
          </div>
        )}
        {tasteLabels.length > 0 && (
          <p className="mt-1.5 text-xs text-muted">
            {tasteLabels.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
