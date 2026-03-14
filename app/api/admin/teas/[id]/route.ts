import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
    alternativeNames,
    barcodes,
  } = body;

  if (!nameNative || !slug) {
    return NextResponse.json(
      { error: "nameNative and slug required" },
      { status: 400 }
    );
  }

  const existing = await prisma.tea.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Tea not found" }, { status: 404 });
  }

  const slugConflict = await prisma.tea.findFirst({
    where: { slug, id: { not: id } },
  });
  if (slugConflict) {
    return NextResponse.json(
      { error: "Another tea already has this slug" },
      { status: 400 }
    );
  }

  const aliases = Array.isArray(alternativeNames)
    ? [...new Set(alternativeNames.map((value: string) => value.trim()).filter(Boolean))]
    : [];
  const barcodeCodes = Array.isArray(barcodes)
    ? [...new Set(barcodes.map((value: string) => value.replace(/[^\dA-Za-z]/g, "").trim()).filter(Boolean))]
    : [];
  if (barcodeCodes.length > 0) {
    const existingBarcodes = await prisma.teaBarcode.findMany({
      where: { code: { in: barcodeCodes }, teaId: { not: id } },
      include: { tea: { select: { nameNative: true } } },
    });
    if (existingBarcodes.length > 0) {
      return NextResponse.json(
        {
          error: `These barcodes are already assigned: ${existingBarcodes
            .map((row) => `${row.code} (${row.tea.nameNative})`)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  const tea = await prisma.tea.update({
    where: { id },
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

  await prisma.vendorTea.deleteMany({ where: { teaId: id } });
  const vendorIdList = Array.isArray(vendorIds) ? vendorIds.filter(Boolean) : [];
  if (vendorIdList.length > 0) {
    await prisma.vendorTea.createMany({
      data: vendorIdList.map((vendorId: string) => ({ vendorId, teaId: id })),
    });
  }

  await prisma.teaTasteTag.deleteMany({ where: { teaId: id } });
  const tagIds = Array.isArray(tasteTagIds) ? tasteTagIds.filter(Boolean) : [];
  const tagRanks = Array.isArray(tasteTagRanks) ? tasteTagRanks : [];
  if (tagIds.length > 0) {
    await prisma.teaTasteTag.createMany({
      data: tagIds.map((tasteTagId: string, i: number) => ({
        teaId: id,
        tasteTagId,
        rank: typeof tagRanks[i] === "number" ? tagRanks[i] : i + 1,
      })),
    });
  }

  await prisma.teaCategoryAssignment.deleteMany({ where: { teaId: id } });
  const catIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [];
  if (catIds.length > 0) {
    await prisma.teaCategoryAssignment.createMany({
      data: catIds.map((teaCategoryId: string) => ({
        teaId: id,
        teaCategoryId,
      })),
    });
  }

  await prisma.teaAlias.deleteMany({ where: { teaId: id } });
  if (aliases.length > 0) {
    await prisma.teaAlias.createMany({
      data: aliases.map((value: string) => ({
        teaId: id,
        value,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.teaBarcode.deleteMany({ where: { teaId: id } });
  if (barcodeCodes.length > 0) {
    await prisma.teaBarcode.createMany({
      data: barcodeCodes.map((code: string) => ({
        teaId: id,
        code,
      })),
    });
  }

  return NextResponse.json(tea);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.tea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
