import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!token) {
    return NextResponse.json(
      { error: "Reset token is required" },
      { status: 400 }
    );
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.expires < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Please request a new one." },
      { status: 400 }
    );
  }

  const email = verification.identifier;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired reset link. Please request a new one." },
      { status: 400 }
    );
  }

  const hashed = await hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: email },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
