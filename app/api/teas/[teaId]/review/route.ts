import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, canAccessExpertData } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teaId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canViewVendorInfo = canAccessExpertData(user.role);

  const { teaId } = await params;
  const review = await prisma.teaReview.findUnique({
    where: { userId_teaId: { userId: user.id, teaId } },
    include: { vendor: { select: { id: true, name: true } } },
  });

  if (!review) {
    return NextResponse.json({ review: null });
  }

  return NextResponse.json({
    review: {
      ...review,
      ...(canViewVendorInfo ? {} : { vendorId: null, vendor: null }),
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ teaId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canUseVendorInfo = canAccessExpertData(user.role);

  const { teaId } = await params;
  const tea = await prisma.tea.findUnique({ where: { id: teaId } });
  if (!tea) {
    return NextResponse.json({ error: "Tea not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const ratingInput = Number(body.rating);
  const rating =
    Number.isFinite(ratingInput) && ratingInput >= 0 && ratingInput <= 3
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
  const requestedVendorId =
    typeof body.vendorId === "string" && body.vendorId.trim()
      ? body.vendorId.trim()
      : null;
  const vendorId = canUseVendorInfo ? requestedVendorId : null;
  const isPublic = body.isPublic === true;

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
    await prisma.teaReview.deleteMany({ where: { userId: user.id, teaId } });
    return NextResponse.json({ review: null });
  }

  const saved = await prisma.teaReview.upsert({
    where: { userId_teaId: { userId: user.id, teaId } },
    create: {
      userId: user.id,
      teaId,
      rating,
      review,
      locationName,
      vendorId,
      isPublic,
    },
    update: {
      rating,
      review,
      locationName,
      vendorId,
      isPublic,
    },
    include: { vendor: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ review: saved });
}
