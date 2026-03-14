import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MocktailDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role;
  if (!canAccessExpertData(role)) {
    redirect("/");
  }

  const { slug } = await params;
  const mocktail = await prisma.mocktail.findUnique({
    where: { slug },
    include: {
      tea: { select: { slug: true, nameNative: true } },
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { stepNumber: "asc" } },
    },
  });
  if (!mocktail) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/mocktails"
        className="mb-6 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to mocktails
      </Link>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {mocktail.name}
      </h1>
      {mocktail.description && (
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{mocktail.description}</p>
      )}
      {mocktail.tea && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Base tea:{" "}
          <Link href={`/teas/${mocktail.tea.slug}`} className="underline hover:no-underline">
            {mocktail.tea.nameNative}
          </Link>
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Ingredients
        </h2>
        {mocktail.ingredients.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No ingredients listed.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
            {mocktail.ingredients.map((ingredient) => (
              <li key={ingredient.id}>
                {[ingredient.amount, ingredient.unit, ingredient.name]
                  .filter(Boolean)
                  .join(" ")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Recipe
        </h2>
        {mocktail.steps.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No steps listed.</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-zinc-700 dark:text-zinc-200">
            {mocktail.steps.map((step) => (
              <li key={step.id}>
                {step.instruction}
                {step.durationSeconds != null && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {" "}
                    ({step.durationSeconds}s)
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
