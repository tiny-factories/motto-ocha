# Motto Ocha — Infrastructure Recommendations

## What you have (keep as-is)

| Component | Status | Notes |
|---|---|---|
| **Next.js 16** | Keep | App Router, server components, API routes — all solid |
| **PostgreSQL** | Keep | Your Prisma schema is well-designed. Unused models (Farm, Mocktail, Barcode, BrewGuide) can stay — they cost nothing and you may want them later |
| **Prisma 6** | Keep | ORM layer works well for this use case |
| **NextAuth 4** | Keep | Email/password auth is working. Consider upgrading to Auth.js v5 when you're ready for OAuth providers (Google, GitHub login) |
| **Docker Compose** | Keep | Good for local dev. Your postgres service is straightforward |
| **MinIO / S3** | Keep (dormant) | You'll need this when photo uploads come online. The upload route already exists |
| **Tailwind CSS 4** | Keep | Now using custom CSS variables for the warm palette |

## What you need to add

### 1. Anthropic API Key (required for tea logging)

The new `/api/log-tea` endpoint calls the Claude API to extract structured tea data from natural language descriptions.

```env
# Add to your .env file
ANTHROPIC_API_KEY=sk-ant-...
```

**Cost estimate:** Each tea log uses ~500-800 tokens input + ~300-500 tokens output on Claude Sonnet. At current pricing, that's roughly $0.003-0.005 per tea logged. Very cheap.

**Model used:** `claude-sonnet-4-20250514` — good balance of speed and accuracy for extraction tasks. You could drop to Haiku for even cheaper if quality is sufficient.

### 2. Image storage for photo uploads (when ready)

Your MinIO setup and the existing `/api/admin/upload` route are ready to go. When you add the photo upload feature to the tea logger:

- **Local dev:** MinIO via Docker (already in your docker-compose.yml)
- **Production:** S3, Cloudflare R2, or any S3-compatible storage
- Estimated storage: ~1-3MB per photo, so very manageable

```env
# Already in your setup — just needs real values for production
S3_ENDPOINT=...
S3_BUCKET=motto-ocha
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### 3. Production deployment

For hosting the Next.js app + PostgreSQL in production:

**Option A: Vercel + Supabase (simplest)**
- Vercel for the Next.js app (free tier is generous)
- Supabase for PostgreSQL (free tier: 500MB, more than enough to start)
- Cloudflare R2 for image storage (10GB free)

**Option B: Railway (all-in-one)**
- Deploy both Next.js and PostgreSQL on Railway
- Simple, predictable pricing (~$5-10/mo to start)

**Option C: Fly.io + Neon**
- Fly.io for the app (generous free tier)
- Neon for serverless PostgreSQL (free tier: 0.5GB)

### 4. Rate limiting (recommended before public launch)

The `/api/log-tea` endpoint calls an external API and creates database records. You should add rate limiting before opening this up:

- **Simple option:** Use `next-rate-limit` or a simple in-memory counter
- **Better option:** Upstash Redis for distributed rate limiting
- **Suggested limits:** 20 tea logs per user per hour, 5 per minute

## What you can remove later (but don't need to now)

These are in the codebase but not in the UI anymore. They don't hurt anything:

- `app/admin/farms/*` — Farm admin pages
- `app/admin/mocktails/*` — Mocktail admin pages
- `app/(public)/farms/*` — Public farm pages
- `app/(public)/mocktails/*` — Public mocktail pages
- `app/(public)/vendors/*` — Public vendor pages
- `app/(dashboard)/identify/*` — Barcode scanner
- `components/IdentifyTeaPanel.tsx`
- `components/Viewer3D.tsx`
- `components/TeaBrewProfileForm.tsx`
- `components/FarmCard.tsx`

The Prisma schema models for these features should stay — they're part of the database structure and removing them would require a migration.

## Environment variables summary

```env
# Required
DATABASE_URL=postgresql://motto:motto@localhost:5432/motto_ocha
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for image uploads)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=motto-ocha
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Optional (admin emails)
ADMIN_EMAILS=your@email.com
```
