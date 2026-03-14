import Link from "next/link";
import Image from "next/image";

type Farm = {
  slug: string;
  nameNative: string;
  nameEnglish: string | null;
  imageUrl: string | null;
  _count?: { teas: number };
};

export function FarmCard({ farm }: { farm: Farm }) {
  return (
    <Link
      href={`/farms/${farm.slug}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="aspect-[4/3] relative bg-zinc-100 dark:bg-zinc-800">
        {farm.imageUrl ? (
          <Image
            src={farm.imageUrl}
            alt={farm.nameEnglish ?? farm.nameNative}
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
          {farm.nameNative}
        </h3>
        {farm.nameEnglish && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {farm.nameEnglish}
          </p>
        )}
        {farm._count != null && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {farm._count.teas} tea{farm._count.teas !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
