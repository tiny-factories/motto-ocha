import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { uploadToStorage, isStorageConfigured } from "@/lib/storage";

const UPLOAD_FOLDERS = ["tea", "farm", "vendor", "general"] as const;

/**
 * POST /api/admin/upload
 * Multipart form: "file" (required), optional "folder" (tea | farm | vendor | general).
 * Uploads to bucket prefix: uploads/{folder}/ so admin uploads are isolated from
 * scraped/ and captured/ images.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!isAdminByRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Uploads are not configured. Set MINIO_* environment variables." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing or invalid file" },
      { status: 400 }
    );
  }

  const folderRaw = (formData.get("folder") as string)?.toLowerCase()?.trim();
  const folder = UPLOAD_FOLDERS.includes(folderRaw as (typeof UPLOAD_FOLDERS)[number])
    ? folderRaw
    : "general";

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  try {
    const url = await uploadToStorage(
      "UPLOADS",
      folder,
      buffer,
      contentType
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Admin upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Check MinIO is running and bucket exists." },
      { status: 500 }
    );
  }
}
