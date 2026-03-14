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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; teaId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: listId, teaId } = await params;
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  if (list.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.listTea.deleteMany({
    where: { listId, teaId },
  });
  return NextResponse.json({ ok: true });
}
