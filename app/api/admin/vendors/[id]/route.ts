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
  const { name, logoUrl, url, description, scale } = body;
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name,
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      url: url || null,
      description: description || null,
      scale: scale || null,
    },
  });
  return NextResponse.json(vendor);
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
  await prisma.vendor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
