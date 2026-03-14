import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: listId } = await params;
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  if (list.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const teaId = typeof body.teaId === "string" ? body.teaId.trim() : "";
  if (!teaId) {
    return NextResponse.json({ error: "teaId is required" }, { status: 400 });
  }
  const tea = await prisma.tea.findUnique({ where: { id: teaId } });
  if (!tea) {
    return NextResponse.json({ error: "Tea not found" }, { status: 404 });
  }
  await prisma.listTea.upsert({
    where: {
      listId_teaId: { listId, teaId },
    },
    create: { listId, teaId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
