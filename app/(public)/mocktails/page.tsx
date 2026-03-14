import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MocktailsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role;
  if (!canAccessExpertData(role)) {
    redirect("/");
  }

  const mocktails = await prisma.mocktail.findMany({
    orderBy: { name: "asc" },
    include: {
      tea: { select: { nameNative: true } },
      _count: { select: { ingredients: true, steps: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Tea mocktails
      </h1>
      {mocktails.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No mocktails yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mocktails.map((mocktail) => (
            <Link
              key={mocktail.id}
              href={`/mocktails/${mocktail.slug}`}
              className="rounded-lg border border-zinc-200 bg-white p-5 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {mocktail.name}
              </h2>
              {mocktail.description && (
                <p className="mt-1 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {mocktail.description}
                </p>
              )}
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {mocktail.tea ? `Base tea: ${mocktail.tea.nameNative}` : "Base tea: —"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mocktail._count.ingredients} ingredients · {mocktail._count.steps} steps
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
