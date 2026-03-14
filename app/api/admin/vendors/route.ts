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
  const { name, logoUrl, url, description, scale } = body;
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const vendor = await prisma.vendor.create({
    data: {
      name,
      logoUrl: logoUrl || null,
      url: url || null,
      description: description || null,
      scale: scale || null,
    },
  });
  return NextResponse.json(vendor);
}
