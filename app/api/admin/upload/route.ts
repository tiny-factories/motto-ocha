import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminByRole } from "@/lib/auth";
import { uploadBuffer } from "@/lib/minio";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!isAdminByRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const prefix = (formData.get("prefix") as string) || "uploads";

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file or invalid file" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const contentType =
    file.type ||
    (ext === "glb"
      ? "model/gltf-binary"
      : ext === "gltf"
        ? "model/gltf+json"
        : "application/octet-stream");

  try {
    const url = await uploadBuffer(key, buffer, contentType);
    return NextResponse.json({ url, key });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
