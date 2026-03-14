import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDefaultList } from "@/lib/lists";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  if (list.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isDefaultList(list.slug)) {
    return NextResponse.json(
      { error: "Default list name cannot be changed" },
      { status: 400 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const updated = await prisma.list.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }
  if (list.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isDefaultList(list.slug)) {
    return NextResponse.json(
      { error: "Default lists cannot be deleted" },
      { status: 400 }
    );
  }
  await prisma.list.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
