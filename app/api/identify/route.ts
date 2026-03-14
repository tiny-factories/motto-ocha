import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type MatchPayload = {
  tea: {
    id: string;
    slug: string;
    nameNative: string;
    nameEnglish: string | null;
    imageUrl: string | null;
    farm: { nameNative: string; slug: string } | null;
    vendorTeas: { vendor: { id: string; name: string } }[];
  };
  score: number;
  reason: string;
};

function normalizeBarcode(raw: string): string {
  return raw.replace(/[^\dA-Za-z]/g, "").trim();
}

function normalizeText(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

async function getCurrentUser(): Promise<{ id: string; role: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user) return null;
  return { id: user.id, role: user.role };
}

const teaCardSelect = {
  id: true,
  slug: true,
  nameNative: true,
  nameEnglish: true,
  imageUrl: true,
  farm: { select: { nameNative: true, slug: true } },
  vendorTeas: { select: { vendor: { select: { id: true, name: true } } } },
} as const;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canViewVendorInfo = canAccessExpertData(user.role);

  const body = await req.json().catch(() => ({}));
  const barcode =
    typeof body.barcode === "string" ? normalizeBarcode(body.barcode) : "";
  const text = typeof body.text === "string" ? normalizeText(body.text) : "";

  if (!barcode && !text) {
    return NextResponse.json(
      { error: "Provide a barcode or text to identify a tea." },
      { status: 400 }
    );
  }

  const byTeaId = new Map<string, MatchPayload>();
  const upsert = (match: MatchPayload) => {
    const current = byTeaId.get(match.tea.id);
    if (!current || match.score > current.score) {
      byTeaId.set(match.tea.id, match);
    }
  };

  if (barcode) {
    const barcodeHit = await prisma.teaBarcode.findUnique({
      where: { code: barcode },
      include: { tea: { select: teaCardSelect } },
    });
    if (barcodeHit) {
      upsert({
        tea: barcodeHit.tea,
        score: 1,
        reason: `Barcode match (${barcodeHit.code})`,
      });
    }
  }

  if (text) {
    const [teaNameHits, aliasHits, vendorHits, farmHits] = await Promise.all([
      prisma.tea.findMany({
        where: {
          OR: [
            { nameNative: { contains: text, mode: "insensitive" } },
            { nameEnglish: { contains: text, mode: "insensitive" } },
          ],
        },
        select: teaCardSelect,
        take: 10,
      }),
      prisma.teaAlias.findMany({
        where: { value: { contains: text, mode: "insensitive" } },
        include: { tea: { select: teaCardSelect } },
        take: 10,
      }),
      canViewVendorInfo
        ? prisma.vendorTea.findMany({
            where: { vendor: { name: { contains: text, mode: "insensitive" } } },
            include: {
              tea: { select: teaCardSelect },
              vendor: { select: { name: true } },
            },
            take: 10,
          })
        : Promise.resolve([]),
      prisma.tea.findMany({
        where: {
          farm: {
            OR: [
              { nameNative: { contains: text, mode: "insensitive" } },
              { nameEnglish: { contains: text, mode: "insensitive" } },
            ],
          },
        },
        select: teaCardSelect,
        take: 10,
      }),
    ]);

    teaNameHits.forEach((tea) => {
      upsert({ tea, score: 0.85, reason: "Matched tea name" });
    });
    aliasHits.forEach((alias) => {
      upsert({
        tea: alias.tea,
        score: 0.82,
        reason: `Matched alternate name "${alias.value}"`,
      });
    });
    vendorHits.forEach((row) => {
      upsert({
        tea: row.tea,
        score: 0.74,
        reason: `Matched vendor "${row.vendor.name}"`,
      });
    });
    farmHits.forEach((tea) => {
      upsert({
        tea,
        score: 0.68,
        reason: `Matched farm "${tea.farm?.nameNative ?? "farm"}"`,
      });
    });
  }

  const matches = Array.from(byTeaId.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((match) => ({
      ...match,
      tea: {
        ...match.tea,
        vendorTeas: canViewVendorInfo ? match.tea.vendorTeas : [],
      },
    }));

  return NextResponse.json({ matches });
}
