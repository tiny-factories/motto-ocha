import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage, isStorageConfigured } from "@/lib/storage";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExtractedTea {
  nameEnglish: string;
  nameNative: string | null;
  teaType: string;
  vendorName: string | null;
  region: string | null;
  country: string | null;
  prefecture: string | null;
  tastingNotes: string[];
  rating: number | null;
  personalNotes: string | null;
  caffeineLevel: string | null;
  bitter: boolean;
  sweet: boolean;
  grassy: boolean;
  floral: boolean;
  earthy: boolean;
  umami: boolean;
}

interface FollowUp {
  field: string;
  question: string;
}

interface AnalyzeResult {
  extracted: ExtractedTea;
  followUps: FollowUp[];
  confidence: "low" | "medium" | "high";
  summary: string;
}

// ── Message type for conversation ──────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Claude API helper ──────────────────────────────────────────────────────

async function callClaudeConversational(
  messages: ChatMessage[],
  imageBase64?: string | null
): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const systemPrompt = `You are a tea cataloging assistant for "Motto Ocha" (もっとお茶 – "more tea"), a tea journal app.

Your job: extract structured tea data from a user's description (and optionally a photo) of a tea they're drinking. You're having a conversation — the user may give you info across multiple messages.

IMPORTANT BEHAVIOR:
1. Parse ALL messages in the conversation to build a complete picture
2. If the user provides an image, analyze it for: brand name, tea type, packaging text (Japanese, Chinese, English), origin info, any visible details
3. After extraction, identify what key information is MISSING and generate follow-up questions
4. Be warm and conversational in your summary — you're a tea-loving friend, not a database form

KEY FOLLOW-UP PRIORITIES (ask about these if missing):
- What type of tea is it? (if unclear)
- How did it taste? What did you think?
- Where did you get it / what brand?
- Would you drink it again? (to infer rating)

Return ONLY valid JSON (no markdown fences):
{
  "extracted": {
    "nameEnglish": string,
    "nameNative": string | null,
    "teaType": string (one of: matcha, sencha, gyokuro, hojicha, genmaicha, bancha, kukicha, oolong, black, white, pu-erh, green, herbal, rooibos, other),
    "vendorName": string | null,
    "region": string | null,
    "country": string | null,
    "prefecture": string | null,
    "tastingNotes": string[],
    "rating": number | null (1-5),
    "personalNotes": string | null,
    "caffeineLevel": string | null ("low" | "medium" | "high" | "decaf" | null),
    "bitter": boolean,
    "sweet": boolean,
    "grassy": boolean,
    "floral": boolean,
    "earthy": boolean,
    "umami": boolean
  },
  "followUps": [
    { "field": "rating", "question": "How would you rate it overall? 1-5?" }
  ],
  "confidence": "low" | "medium" | "high",
  "summary": "Nice! Sounds like a smooth ceremonial matcha from Ippodo..."
}

Rules:
- followUps should have 0-3 questions max, focused on the most important missing info
- If you have enough info (type + at least some taste notes or a rating), set followUps to [] so we can save
- confidence: "high" = all key fields present, "medium" = type + some details, "low" = barely anything
- summary should be 1-2 sentences, conversational, acknowledging what they told you
- For images: read ALL visible text including Japanese/Chinese characters for nameNative`;

  // Build the messages for Claude API
  const apiMessages = messages.map((msg, idx) => {
    if (msg.role === "user" && idx === 0 && imageBase64) {
      // First user message with image
      return {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: "image/jpeg" as const,
              data: imageBase64,
            },
          },
          { type: "text" as const, text: msg.content },
        ],
      };
    }
    return { role: msg.role, content: msg.content };
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text =
    data.content?.[0]?.type === "text" ? data.content[0].text : null;
  if (!text) throw new Error("No text response from Claude");

  const cleaned = text
    .replace(/```json?\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as AnalyzeResult;
}

// ── Slug helper ────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── POST /api/log-tea ──────────────────────────────────────────────────────
// Supports two modes:
//   mode: "analyze" — extract data, return structured result + follow-ups
//   mode: "save"    — persist the extracted data to the database

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mode = body.mode || "analyze";

  // ── ANALYZE MODE ───────────────────────────────────────────────────────
  if (mode === "analyze") {
    const messages: ChatMessage[] = body.messages || [];
    const imageBase64: string | null = body.image || null;

    if (messages.length === 0 || !messages[0]?.content?.trim()) {
      return NextResponse.json(
        { error: "Please describe the tea" },
        { status: 400 }
      );
    }

    try {
      const result = await callClaudeConversational(messages, imageBase64);
      return NextResponse.json({ success: true, ...result });
    } catch (err) {
      console.error("Claude analysis failed:", err);
      return NextResponse.json(
        { error: "Failed to process. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── SAVE MODE ──────────────────────────────────────────────────────────
  if (mode === "save") {
    const extracted: ExtractedTea = body.extracted;
    const imageBase64: string | null = body.image ?? null;
    const rawMessages = body.messages as Array<{ role: string; content: string; imagePreview?: string }> | undefined;
    if (!extracted || !extracted.teaType) {
      return NextResponse.json(
        { error: "Missing tea data" },
        { status: 400 }
      );
    }

    // Normalize chat for storage: role + content only (no base64/image URLs to keep DB small)
    const conversationLog =
      Array.isArray(rawMessages) && rawMessages.length > 0
        ? rawMessages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: typeof m.content === "string" ? m.content : "",
            ...(m.imagePreview ? { hasImage: true } : {}),
          }))
        : null;

    // If user attached a photo, upload to MinIO under captured/{userId}/ so it's isolated from uploads/ and scraped/
    let capturedImageUrl: string | null = null;
    if (imageBase64 && isStorageConfigured()) {
      try {
        const buffer = Buffer.from(imageBase64, "base64");
        capturedImageUrl = await uploadToStorage(
          "CAPTURED",
          user.id,
          buffer,
          "image/jpeg",
          "jpg"
        );
      } catch (err) {
        console.error("Captured image upload failed:", err);
        // Continue without image rather than failing the whole save
      }
    }

    // Find or create vendor
    let vendorId: string | null = null;
    if (extracted.vendorName) {
      const existingVendor = await prisma.vendor.findFirst({
        where: { name: { equals: extracted.vendorName, mode: "insensitive" } },
      });
      if (existingVendor) {
        vendorId = existingVendor.id;
      } else {
        const newVendor = await prisma.vendor.create({
          data: { name: extracted.vendorName },
        });
        vendorId = newVendor.id;
      }
    }

    // Find or create tea category
    let categoryId: string | null = null;
    if (extracted.teaType) {
      const slug = slugify(extracted.teaType);
      const existing = await prisma.teaCategory.findUnique({ where: { slug } });
      if (existing) {
        categoryId = existing.id;
      } else {
        const created = await prisma.teaCategory.create({
          data: {
            slug,
            label:
              extracted.teaType.charAt(0).toUpperCase() +
              extracted.teaType.slice(1),
          },
        });
        categoryId = created.id;
      }
    }

    // Find or create taste tags
    const tasteTagIds: string[] = [];
    for (const note of (extracted.tastingNotes || []).slice(0, 8)) {
      const slug = slugify(note);
      if (!slug) continue;
      let tag = await prisma.tasteTag.findUnique({ where: { slug } });
      if (!tag) {
        tag = await prisma.tasteTag.create({
          data: { slug, label: note.charAt(0).toUpperCase() + note.slice(1) },
        });
      }
      tasteTagIds.push(tag.id);
    }

    // Create the tea
    const teaName =
      extracted.nameEnglish ||
      extracted.nameNative ||
      `${extracted.teaType || "Tea"} from ${extracted.vendorName || "unknown"}`;
    const baseSlug = slugify(teaName);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const tea = await prisma.tea.create({
      data: {
        nameNative: extracted.nameNative || teaName,
        nameEnglish: extracted.nameEnglish || null,
        slug: uniqueSlug,
        description: null, // keep catalog description separate; user notes go in TeaReview.review
        region: extracted.region,
        country: extracted.country,
        prefecture: extracted.prefecture,
        caffeineLevel: extracted.caffeineLevel,
        ...(capturedImageUrl ? { imageUrl: capturedImageUrl } : {}),
        ...(vendorId
          ? { vendorTeas: { create: { vendorId } } }
          : {}),
        ...(categoryId
          ? { categoryAssignments: { create: { teaCategoryId: categoryId } } }
          : {}),
        teaTasteTags: {
          create: tasteTagIds.map((id, i) => ({
            tasteTagId: id,
            rank: i + 1,
          })),
        },
      },
      include: {
        vendorTeas: { include: { vendor: true } },
        categoryAssignments: { include: { teaCategory: true } },
        teaTasteTags: { include: { tasteTag: true } },
      },
    });

    // Map AI 1–5 rating to 0–3 cup scale for storage
    const rating1to5 = extracted.rating ?? null;
    const rating0to3 =
      rating1to5 == null ? null : rating1to5 <= 3 ? rating1to5 : 3;

    // Always create a review when saving from the log so we have a place for conversation history
    await prisma.teaReview.create({
      data: {
        userId: user.id,
        teaId: tea.id,
        rating: rating0to3,
        review: extracted.personalNotes ?? null,
        vendorId,
        conversationLog,
      },
    });

    // Add to tried list
    const { ensureDefaultLists } = await import("@/lib/lists");
    await ensureDefaultLists(user.id);
    const triedList = await prisma.list.findFirst({
      where: { userId: user.id, slug: "tried" },
    });
    if (triedList) {
      await prisma.listTea.upsert({
        where: { listId_teaId: { listId: triedList.id, teaId: tea.id } },
        create: { listId: triedList.id, teaId: tea.id },
        update: {},
      });
    }

    return NextResponse.json({
      success: true,
      tea: {
        id: tea.id,
        slug: tea.slug,
        nameNative: tea.nameNative,
        nameEnglish: tea.nameEnglish,
        description: tea.description,
        region: tea.region,
        country: tea.country,
        prefecture: tea.prefecture,
        vendor: tea.vendorTeas[0]?.vendor?.name ?? null,
        category: tea.categoryAssignments[0]?.teaCategory?.label ?? null,
        tastingNotes: tea.teaTasteTags.map((tt) => tt.tasteTag.label),
        rating: rating0to3,
        createdAt: tea.createdAt,
      },
    });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── GET /api/log-tea — fetch user's tea logs ───────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  // Only user's tea reviews (logs) — no "tried" list merge
  const reviews = await prisma.teaReview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      tea: {
        include: {
          vendorTeas: { include: { vendor: { select: { name: true } } } },
          categoryAssignments: {
            include: { teaCategory: { select: { label: true } } },
          },
          teaTasteTags: {
            orderBy: { rank: "asc" },
            include: { tasteTag: { select: { label: true } } },
          },
        },
      },
    },
  });

  const logs = reviews.map((entry) => ({
    id: entry.id,
    teaId: entry.teaId,
    rating: entry.rating,
    review: entry.review,
    locationName: entry.locationName,
    conversationLog: entry.conversationLog ?? null,
    createdAt: entry.createdAt,
    tea: {
      slug: entry.tea.slug,
      nameNative: entry.tea.nameNative,
      nameEnglish: entry.tea.nameEnglish,
      imageUrl: entry.tea.imageUrl,
      vendor: entry.tea.vendorTeas[0]?.vendor?.name ?? null,
      category:
        entry.tea.categoryAssignments[0]?.teaCategory?.label ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tastingNotes: entry.tea.teaTasteTags.map((tt: any) => tt.tasteTag.label),
    },
  }));

  return NextResponse.json({ logs });
}
