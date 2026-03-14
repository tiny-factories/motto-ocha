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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teaId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teaId } = await params;
  const review = await prisma.teaReview.findUnique({
    where: { userId_teaId: { userId, teaId } },
    include: { vendor: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ review });
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
  const tea = await prisma.tea.findUnique({ where: { id: teaId } });
  if (!tea) {
    return NextResponse.json({ error: "Tea not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const ratingInput = Number(body.rating);
  const rating =
    Number.isFinite(ratingInput) && ratingInput >= 1 && ratingInput <= 5
      ? Math.round(ratingInput)
      : null;
  const review =
    typeof body.review === "string" && body.review.trim()
      ? body.review.trim()
      : null;
  const locationName =
    typeof body.locationName === "string" && body.locationName.trim()
      ? body.locationName.trim()
      : null;
  const vendorId =
    typeof body.vendorId === "string" && body.vendorId.trim()
      ? body.vendorId.trim()
      : null;

  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 400 });
    }
  }

  if (!rating && !review && !locationName && !vendorId) {
    await prisma.teaReview.deleteMany({ where: { userId, teaId } });
    return NextResponse.json({ review: null });
  }

  const saved = await prisma.teaReview.upsert({
    where: { userId_teaId: { userId, teaId } },
    create: {
      userId,
      teaId,
      rating,
      review,
      locationName,
      vendorId,
    },
    update: {
      rating,
      review,
      locationName,
      vendorId,
    },
    include: { vendor: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ review: saved });
}
