import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name } = body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }
  const emailNorm = email.trim().toLowerCase();
  if (!emailNorm) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 }
    );
  }

  const hashed = await hash(password, 12);
  await prisma.user.create({
    data: {
      email: emailNorm,
      password: hashed,
      name: typeof name === "string" ? name.trim() || null : null,
    },
  });

  return NextResponse.json({ ok: true });
}
