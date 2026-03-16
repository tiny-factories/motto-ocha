import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const RESET_EXPIRY_HOURS = 1;
const baseUrl = () =>
  process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (user?.password) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const resetLink = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    if (process.env.NODE_ENV !== "production") {
      console.log("[dev] Password reset link:", resetLink);
    }
    // Optional: when you add email (e.g. Resend, SendGrid), send resetLink to email here.
    const devReturnLink = process.env.NODE_ENV !== "production" && body.returnLink === true;
    return NextResponse.json({
      message: "If an account exists with this email, you will receive reset instructions.",
      ...(devReturnLink && { resetLink }),
    });
  }

  return NextResponse.json({
    message: "If an account exists with this email, you will receive reset instructions.",
  });
}
