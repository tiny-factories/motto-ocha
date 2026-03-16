import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDefaultList } from "@/lib/lists";
import { TeaCard } from "@/components/TeaCard";
import { RemoveFromListButton } from "@/components/RemoveFromListButton";
import { EditListNameForm } from "@/components/EditListNameForm";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return null;
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      listTeas: {
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

  if (!list || list.userId !== user.id) notFound();

  const canEditName = !isDefaultList(list.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/my-lists"
        className="mb-6 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Back to My lists
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {canEditName ? (
            <EditListNameForm listId={list.id} initialName={list.name} />
          ) : (
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {list.name}
            </h1>
          )}
        </div>
        <Link
          href="/teas"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Add tea from catalog
        </Link>
      </div>

      {list.listTeas.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No teas in this list yet.{" "}
          <Link href="/teas" className="underline hover:no-underline">
            Browse teas
          </Link>{" "}
          and add them from a tea page.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.listTeas.map((lt) => (
            <div key={lt.tea.id} className="relative">
              <TeaCard tea={lt.tea} />
              <div className="absolute right-2 top-2">
                <RemoveFromListButton listId={list.id} teaId={lt.tea.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
