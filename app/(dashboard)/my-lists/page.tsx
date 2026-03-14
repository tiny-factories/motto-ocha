import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultLists } from "@/lib/lists";
import { TeaCard } from "@/components/TeaCard";
import { CreateListForm } from "@/components/CreateListForm";

export default async function MyListsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return null;

  await ensureDefaultLists(user.id);

  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    orderBy: [{ slug: "asc" }],
    include: {
      _count: { select: { listTeas: true } },
      listTeas: {
        take: 3,
        orderBy: { createdAt: "desc" },
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

  const defaultLists = lists.filter((l) =>
    ["favorites", "want-to-try", "tried"].includes(l.slug)
  );
  const customLists = lists.filter(
    (l) => !["favorites", "want-to-try", "tried"].includes(l.slug)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        My lists
      </h1>
      <div className="mb-8">
        <Link
          href="/identify"
          className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Scan or identify a tea
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Default lists
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {defaultLists.map((list) => (
            <div
              key={list.id}
              className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link
                href={`/my-lists/${list.id}`}
                className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {list.name}
              </Link>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {list._count.listTeas} tea{list._count.listTeas !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {list.listTeas.slice(0, 3).map((lt) => (
                  <TeaCard key={lt.tea.id} tea={lt.tea} />
                ))}
              </div>
              <Link
                href={`/my-lists/${list.id}`}
                className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                View all →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My lists
          </h2>
          <CreateListForm />
        </div>
        {customLists.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No custom lists yet. Create one to organize teas your way.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customLists.map((list) => (
              <div
                key={list.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link
                  href={`/my-lists/${list.id}`}
                  className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {list.name}
                </Link>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {list._count.listTeas} tea
                  {list._count.listTeas !== 1 ? "s" : ""}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {list.listTeas.slice(0, 3).map((lt) => (
                    <TeaCard key={lt.tea.id} tea={lt.tea} />
                  ))}
                </div>
                <Link
                  href={`/my-lists/${list.id}`}
                  className="mt-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  View all →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
