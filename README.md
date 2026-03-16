# Motto Ocha

Tea index: vendors, farms, and teas. Native-language names with English labels. User accounts can track “tried” and “want to try”; admin can add and edit teas (with image and 3D GLB uploads to MinIO).

New tracking features:
- **Tea identification** (`/identify`): scan barcodes live, detect barcode from uploaded/taken photos, or search by label text (including native-language aliases) and match to catalog teas.
- **Personal tea notes** (on each tea page): save your rating, review notes, vendor/brand, and where you drank or bought that tea (e.g. specific cafe/shop).
- **Brew guidance + personal brew profile** (on each tea page): each tea can have default multi-infusion instructions (leaf/water/temp/steep sequence), and each user can save their own preferred overrides.
- **Tea mocktails** (`/mocktails`): tea-based mocktail recipes with ingredients and steps.

Access model:
- Vendor data and mocktail pages are restricted to users with role `admin`, `reviewer`, or `expert`.

## Teas, farms, and vendors

| Concept   | Meaning                | Link to tea                    |
| --------- | ---------------------- | ------------------------------ |
| **Tea**   | The product            | —                              |
| **Farm**  | Where it's grown       | Optional: one farm per tea     |
| **Vendor**| Where you can buy it   | Many-to-many (vendors ↔ teas)  |

- **Tea** — A specific tea (e.g. Gyokuro, Da Hong Pao). Has native + English name, description, location (country/prefecture/region), optional image and 3D models, plus optional: harvest year, single-origin flag, scale (commercial/independent), taste tags, and tea type categories (e.g. Green, Matcha). Can be linked to one farm and many vendors. Users track "tried" / "want to try", add teas to lists, and save personal brew preferences.
- **Farm** — Where the tea is grown (grower / estate). One farm can have many teas. Shown as "Farm: 山本園 (Yamamoto-en)" on a tea's page.
- **Vendor** — A place you can buy tea (shop or website; can also be the brand/importer). Many-to-many with teas: one tea can be sold by many vendors, one vendor can sell many teas. Shown as "Imported by: …" on a tea's page and listed on `/vendors`.

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind
- **PostgreSQL** + Prisma
- **MinIO** (S3-compatible) for images and 3D assets
- **NextAuth** (email/password; admin via `ADMIN_EMAILS` or DB `role`)

## Run with Docker

```bash
cp .env.example .env
# Set NEXTAUTH_SECRET and optionally ADMIN_EMAILS in .env
docker compose up --build
```

- App: http://localhost:3000
- MinIO: http://localhost:9000 (optional console on 9001)

The `minio-init` service creates the `motto-ocha-assets` bucket. The app runs Prisma migrations on startup.

**Bucket layout (MinIO):** Images are isolated by source. `uploads/` = admin uploads (tea, farm, vendor images/GLBs). `captured/` = photos taken in the tea log. `scraped/` = re-hosted scraped product images (when scripts upload into our bucket instead of using external URLs).

## Run locally (no Docker)

1. **Start PostgreSQL** (and optionally MinIO) so the app can connect:
   ```bash
   docker compose up -d postgres
   # optional: docker compose up -d minio minio-init
   ```
2. Copy `.env.example` to `.env` and set:
   - **`DATABASE_URL="postgresql://motto:motto@localhost:5432/motto_ocha"`** (use `localhost`, not `postgres`, when running Next.js on your machine)
   - `MINIO_*` if using uploads
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, optionally `ADMIN_EMAILS`
3. Apply migrations and seed, then start the app:
   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma db seed
   npm run dev
   ```
   If the app shows “Database is not connected”, check that Postgres is running and `DATABASE_URL` in `.env` uses `localhost:5432`.

## Build

Set `DATABASE_URL` (can be a dummy URL) when building, e.g.:

```bash
DATABASE_URL="postgresql://u:p@localhost:5432/db" npm run build
npm run start
```

## Admin

- Sign up at /signup, then sign in at /login. Add your email to `ADMIN_EMAILS` (or set `role = 'admin'` in the `User` table) to access `/admin`.
- In admin you can create/edit **Teas** (with image and 3D tea/packaging GLB uploads, taste tags, tea categories, year, single-origin, scale, location, **alternative native-language names**, **barcodes**, and **default brew instructions**), **Farms**, **Vendors**, **Mocktails**, **Tea categories** (e.g. Green, Matcha), and **Taste tags** (e.g. mellow, nutty). Location fields support a searchable autocomplete (tea-growing regions). Run `npx prisma db seed` to seed default taste tags and tea categories.

## 3D models

Use GLB/GLTF. Upload via admin tea form. Phone LiDAR (e.g. iPhone) often exports USDZ; convert to GLB (e.g. [Reality Converter](https://developer.apple.com/augmented-reality/tools/)) then upload.
