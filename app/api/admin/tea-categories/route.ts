import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const categories = await prisma.teaCategory.findMany({
    orderBy: [{ parentId: "asc" }, { label: "asc" }],
    include: { _count: { select: { assignments: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { slug, label, parentId } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label required" }, { status: 400 });
  }
  const existing = await prisma.teaCategory.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }
  const category = await prisma.teaCategory.create({
    data: {
      slug,
      label,
      parentId: parentId || null,
    },
  });
  return NextResponse.json(category);
}
