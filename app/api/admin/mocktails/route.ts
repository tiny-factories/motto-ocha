import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type IngredientInput = { name?: string; amount?: string | null; unit?: string | null };
type StepInput = { instruction?: string; durationSeconds?: number | null };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminByRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email ?? "" },
    select: { id: true },
  });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const teaId = typeof body.teaId === "string" && body.teaId.trim() ? body.teaId : null;
  const ingredients: IngredientInput[] = Array.isArray(body.ingredients)
    ? body.ingredients
    : [];
  const steps: StepInput[] = Array.isArray(body.steps) ? body.steps : [];

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const existing = await prisma.mocktail.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A mocktail with this slug already exists" },
      { status: 400 }
    );
  }

  const mocktail = await prisma.mocktail.create({
    data: {
      name,
      slug,
      description,
      teaId,
      createdById: user?.id ?? null,
    },
  });

  const validIngredients = ingredients
    .map((ing) => ({
      name: typeof ing.name === "string" ? ing.name.trim() : "",
      amount: typeof ing.amount === "string" ? ing.amount.trim() || null : null,
      unit: typeof ing.unit === "string" ? ing.unit.trim() || null : null,
    }))
    .filter((ing) => ing.name.length > 0);
  if (validIngredients.length > 0) {
    await prisma.mocktailIngredient.createMany({
      data: validIngredients.map((ing, index) => ({
        mocktailId: mocktail.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        sortOrder: index + 1,
      })),
    });
  }

  const validSteps = steps
    .map((step) => ({
      instruction: typeof step.instruction === "string" ? step.instruction.trim() : "",
      durationSeconds:
        step.durationSeconds != null && Number.isFinite(Number(step.durationSeconds))
          ? Math.round(Number(step.durationSeconds))
          : null,
    }))
    .filter((step) => step.instruction.length > 0);
  if (validSteps.length > 0) {
    await prisma.mocktailStep.createMany({
      data: validSteps.map((step, index) => ({
        mocktailId: mocktail.id,
        stepNumber: index + 1,
        instruction: step.instruction,
        durationSeconds: step.durationSeconds,
      })),
    });
  }

  return NextResponse.json(mocktail);
}
