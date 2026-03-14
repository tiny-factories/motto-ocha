import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultLists, slugForCustomList, isDefaultList } from "@/lib/lists";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureDefaultLists(userId);
  const { searchParams } = new URL(req.url);
  const teaId = searchParams.get("teaId")?.trim() || undefined;

  const lists = await prisma.list.findMany({
    where: { userId },
    orderBy: [{ slug: "asc" }],
    include: {
      _count: { select: { listTeas: true } },
      ...(teaId
        ? {
            listTeas: {
              where: { teaId },
              select: { teaId: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  const payload = lists.map((list) => {
    const { listTeas, ...rest } = list as typeof list & { listTeas?: { teaId: string }[] };
    const hasTea = Array.isArray(listTeas) ? listTeas.length > 0 : undefined;
    return { ...rest, ...(hasTea !== undefined && { hasTea }) };
  });

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const slug = slugForCustomList(name);
  const existing = await prisma.list.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A list with this name already exists" },
      { status: 400 }
    );
  }
  const list = await prisma.list.create({
    data: { userId, name, slug },
  });
  return NextResponse.json(list);
}
