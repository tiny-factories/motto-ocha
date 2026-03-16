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
              vendorTeas: {
                include: { vendor: { select: { id: true, name: true } } },
              },
              teaTasteTags: {
                orderBy: { rank: "asc" },
                include: { tasteTag: { select: { label: true } } },
              },
              categoryAssignments: {
                include: {
                  teaCategory: { select: { id: true, label: true } },
                },
              },
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

  const totalTeas = lists.reduce((sum, l) => sum + l._count.listTeas, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My lists</h1>
          <p className="mt-1 text-muted-foreground">
            {totalTeas} tea{totalTeas !== 1 ? "s" : ""} across{" "}
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/log"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Log a tea
        </Link>
      </div>

      {/* Default lists */}
      <section className="mb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {defaultLists.map((list) => (
            <Link
              key={list.id}
              href={`/my-lists/${list.id}`}
              className="group rounded-xl border border-card-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {list.name}
                </h3>
                <span className="rounded-full bg-warm-highlight px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                  {list._count.listTeas}
                </span>
              </div>
              {list.listTeas.length > 0 && (
                <div className="mt-3 flex -space-x-2">
                  {list.listTeas.slice(0, 3).map((lt) => (
                    <div
                      key={lt.tea.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-accent-light text-xs font-medium text-accent"
                      title={lt.tea.nameNative}
                    >
                      {lt.tea.nameNative.charAt(0)}
                    </div>
                  ))}
                  {list._count.listTeas > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-warm-highlight text-xs text-muted-foreground">
                      +{list._count.listTeas - 3}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Custom lists */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Custom lists
          </h2>
          <CreateListForm />
        </div>
        {customLists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Create a list to organize teas your way — seasonal picks, gift
              ideas, daily rotation, anything.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customLists.map((list) => (
              <Link
                key={list.id}
                href={`/my-lists/${list.id}`}
                className="group rounded-xl border border-card-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {list.name}
                  </h3>
                  <span className="rounded-full bg-warm-highlight px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    {list._count.listTeas}
                  </span>
                </div>
                {list.listTeas.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    {list.listTeas
                      .slice(0, 3)
                      .map((lt) => lt.tea.nameNative)
                      .join(", ")}
                    {list._count.listTeas > 3 && "…"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
