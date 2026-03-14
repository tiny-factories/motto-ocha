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
  const { nameNative, nameEnglish, slug, description, locationText, imageUrl, region, country, prefecture, scale } = body;
  if (!nameNative || !slug) {
    return NextResponse.json({ error: "nameNative and slug required" }, { status: 400 });
  }
  const existing = await prisma.farm.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }
  const farm = await prisma.farm.create({
    data: {
      nameNative,
      nameEnglish: nameEnglish || null,
      slug,
      description: description || null,
      locationText: locationText || null,
      imageUrl: imageUrl || null,
      region: region || null,
      country: country || null,
      prefecture: prefecture || null,
      scale: scale || null,
    },
  });
  return NextResponse.json(farm);
}
