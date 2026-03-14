import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { slug, label, parentId } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label required" }, { status: 400 });
  }
  const existing = await prisma.teaCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const conflict = await prisma.teaCategory.findFirst({
    where: { slug, id: { not: id } },
  });
  if (conflict) return NextResponse.json({ error: "Slug taken" }, { status: 400 });
  const category = await prisma.teaCategory.update({
    where: { id },
    data: { slug, label, parentId: parentId || null },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.teaCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
