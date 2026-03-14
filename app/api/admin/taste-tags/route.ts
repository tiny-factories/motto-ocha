import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { slug, label } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label required" }, { status: 400 });
  }
  const existing = await prisma.tasteTag.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }
  const tag = await prisma.tasteTag.create({
    data: { slug, label },
  });
  return NextResponse.json(tag);
}
