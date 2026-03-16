import Link from "next/link";

type FeedPost = {
  type: "post";
  id: string;
  review: string | null;
  rating: number | null;
  createdAt: Date;
  user: { name: string | null };
  tea: { slug: string; nameEnglish: string | null; nameNative: string };
  vendor: { name: string } | null;
};

type FeedTea = {
  type: "tea";
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  createdAt: Date;
  categoryLabel?: string | null;
  vendorName?: string | null;
};

export function FeedCard({ item }: { item: FeedPost | FeedTea }) {
  if (item.type === "post") {
    const reviewLen = item.review?.length ?? 0;
    const isTall = reviewLen > 120;
    return (
      <Link
        href={`/teas/${item.tea.slug}`}
        className={`group flex flex-col overflow-hidden rounded-xl border border-card-border bg-card transition-all hover:border-accent/30 hover:shadow-md ${
          isTall ? "min-h-[180px]" : "min-h-[120px]"
        }`}
      >
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-medium text-foreground">
              {item.user.name || "Someone"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-accent group-hover:underline">
              {item.tea.nameEnglish || item.tea.nameNative}
            </span>
            {item.vendor && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{item.vendor.name}</span>
              </>
            )}
          </div>
          {item.review && (
            <p
              className={`mt-2 text-sm leading-relaxed text-muted-foreground ${
                isTall ? "line-clamp-5" : "line-clamp-2"
              }`}
            >
              {item.review}
            </p>
          )}
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </Link>
    );
  }

  // type === "tea"
  return (
    <Link
      href={`/teas/${item.slug}`}
      className="group flex min-h-[100px] flex-col justify-center overflow-hidden rounded-xl border border-card-border bg-card p-4 transition-all hover:border-accent/30 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl text-accent/50" aria-hidden>茶</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground group-hover:text-accent">
            {item.nameNative}
          </h3>
          {item.nameEnglish && (
            <p className="text-xs text-muted-foreground">{item.nameEnglish}</p>
          )}
          {(item.categoryLabel || item.vendorName) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[item.categoryLabel, item.vendorName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Added{" "}
        {new Date(item.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </p>
    </Link>
  );
}
