import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    nameNative,
    nameEnglish,
    slug,
    description,
    region,
    country,
    prefecture,
    farmId,
    vendorIds,
    imageUrl,
    teaModelUrl,
    packagingModelUrl,
    singleOrigin,
    scale,
    year,
    caffeineLevel,
    processingNotes,
    tasteTagIds,
    tasteTagRanks,
    categoryIds,
  } = body;

  if (!nameNative || !slug) {
    return NextResponse.json(
      { error: "nameNative and slug required" },
      { status: 400 }
    );
  }

  const existing = await prisma.tea.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A tea with this slug already exists" },
      { status: 400 }
    );
  }

  const tea = await prisma.tea.create({
    data: {
      nameNative,
      nameEnglish: nameEnglish || null,
      slug,
      description: description || null,
      region: region || null,
      country: country || null,
      prefecture: prefecture || null,
      farmId: farmId || null,
      imageUrl: imageUrl || null,
      teaModelUrl: teaModelUrl || null,
      packagingModelUrl: packagingModelUrl || null,
      singleOrigin: singleOrigin === true ? true : singleOrigin === false ? false : null,
      scale: scale || null,
      year: year != null && year !== "" ? Number(year) : null,
      caffeineLevel: caffeineLevel || null,
      processingNotes: processingNotes || null,
    },
  });

  const vendorIdList = Array.isArray(vendorIds) ? vendorIds.filter(Boolean) : [];
  if (vendorIdList.length > 0) {
    await prisma.vendorTea.createMany({
      data: vendorIdList.map((vendorId: string) => ({
        vendorId,
        teaId: tea.id,
      })),
    });
  }

  const tagIds = Array.isArray(tasteTagIds) ? tasteTagIds.filter(Boolean) : [];
  const tagRanks = Array.isArray(tasteTagRanks) ? tasteTagRanks : [];
  if (tagIds.length > 0) {
    await prisma.teaTasteTag.createMany({
      data: tagIds.map((tasteTagId: string, i: number) => ({
        teaId: tea.id,
        tasteTagId,
        rank: typeof tagRanks[i] === "number" ? tagRanks[i] : i + 1,
      })),
    });
  }

  const catIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [];
  if (catIds.length > 0) {
    await prisma.teaCategoryAssignment.createMany({
      data: catIds.map((teaCategoryId: string) => ({
        teaId: tea.id,
        teaCategoryId,
      })),
    });
  }

  return NextResponse.json(tea);
}
