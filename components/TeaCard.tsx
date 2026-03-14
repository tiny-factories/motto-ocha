import Link from "next/link";
import Image from "next/image";

type Tea = {
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  imageUrl: string | null;
  year?: number | null;
  farm?: { nameNative: string; slug: string } | null;
  vendorTeas?: { vendor: { id: string; name: string } }[];
  teaTasteTags?: { tasteTag: { label: string } }[];
  categoryAssignments?: { teaCategory: { id: string; label: string } }[];
};

export function TeaCard({ tea }: { tea: Tea }) {
  const categories = tea.categoryAssignments?.map((a) => a.teaCategory.label) ?? [];
  const tasteLabels = tea.teaTasteTags?.map((tt) => tt.tasteTag.label) ?? [];

  return (
    <Link
      href={`/teas/${tea.slug}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="aspect-[4/3] relative bg-zinc-100 dark:bg-zinc-800">
        {tea.imageUrl ? (
          <Image
            src={tea.imageUrl}
            alt={tea.nameEnglish ?? tea.nameNative}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
          {tea.nameNative}
        </h3>
        {tea.nameEnglish && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tea.nameEnglish}
          </p>
        )}
        {(categories.length > 0 || tea.year) && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {categories.slice(0, 2).join(", ")}
            {tea.year && (categories.length > 0 ? ` · ${tea.year}` : `${tea.year} harvest`)}
          </p>
        )}
        {(tea.farm || (tea.vendorTeas && tea.vendorTeas.length > 0)) && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {tea.farm && (
              <Link
                href={`/farms/${tea.farm.slug}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {tea.farm.nameNative}
              </Link>
            )}
            {tea.farm && tea.vendorTeas?.length ? " · " : null}
            {tea.vendorTeas?.length
              ? tea.vendorTeas.map((vt) => vt.vendor.name).join(", ")
              : null}
          </p>
        )}
        {tasteLabels.length > 0 && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
            {tasteLabels.slice(0, 3).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
