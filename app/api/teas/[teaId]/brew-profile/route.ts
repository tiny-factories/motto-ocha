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

function parseInfusions(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) =>
      typeof value === "number" ? value : Number.parseInt(String(value), 10)
    )
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.round(value));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teaId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teaId } = await params;
  const profile = await prisma.userTeaBrewProfile.findUnique({
    where: { userId_teaId: { userId, teaId } },
    include: { infusions: { orderBy: { infusionNumber: "asc" } } },
  });
  return NextResponse.json({ profile });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ teaId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teaId } = await params;
  const tea = await prisma.tea.findUnique({ where: { id: teaId }, select: { id: true } });
  if (!tea) {
    return NextResponse.json({ error: "Tea not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const leafGrams =
    body.leafGrams != null && body.leafGrams !== ""
      ? Number(body.leafGrams)
      : null;
  const waterMl =
    body.waterMl != null && body.waterMl !== "" ? Number(body.waterMl) : null;
  const temperatureC =
    body.temperatureC != null && body.temperatureC !== ""
      ? Number(body.temperatureC)
      : null;
  const notes =
    typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  const infusionSeconds = parseInfusions(body.infusionSeconds);

  const hasData =
    Number.isFinite(leafGrams) ||
    Number.isFinite(waterMl) ||
    Number.isFinite(temperatureC) ||
    Boolean(notes) ||
    infusionSeconds.length > 0;

  if (!hasData) {
    await prisma.userTeaBrewProfile.deleteMany({ where: { userId, teaId } });
    return NextResponse.json({ profile: null });
  }

  const profile = await prisma.userTeaBrewProfile.upsert({
    where: { userId_teaId: { userId, teaId } },
    create: {
      userId,
      teaId,
      leafGrams: Number.isFinite(leafGrams) ? leafGrams : null,
      waterMl: Number.isFinite(waterMl) ? Math.round(waterMl) : null,
      temperatureC: Number.isFinite(temperatureC) ? Math.round(temperatureC) : null,
      notes,
    },
    update: {
      leafGrams: Number.isFinite(leafGrams) ? leafGrams : null,
      waterMl: Number.isFinite(waterMl) ? Math.round(waterMl) : null,
      temperatureC: Number.isFinite(temperatureC) ? Math.round(temperatureC) : null,
      notes,
    },
    include: { infusions: true },
  });

  await prisma.userTeaBrewStep.deleteMany({ where: { profileId: profile.id } });
  if (infusionSeconds.length > 0) {
    await prisma.userTeaBrewStep.createMany({
      data: infusionSeconds.map((steepSeconds, index) => ({
        profileId: profile.id,
        infusionNumber: index + 1,
        steepSeconds,
      })),
    });
  }

  const refreshed = await prisma.userTeaBrewProfile.findUnique({
    where: { id: profile.id },
    include: { infusions: { orderBy: { infusionNumber: "asc" } } },
  });

  return NextResponse.json({ profile: refreshed });
}
