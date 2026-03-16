/**
 * S3-compatible storage (MinIO) with isolated path prefixes:
 * - uploads/   — admin uploads (tea images, farm images, GLBs, etc.)
 * - scraped/  — re-hosted scraped product images (when we store them in our bucket)
 * - captured/ — photos taken in the tea log (user's camera when logging tea)
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

export const STORAGE_PREFIX = {
  UPLOADS: "uploads/",
  SCRAPED: "scraped/",
  CAPTURED: "captured/",
} as const;

function getClient(): S3Client | null {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint?.trim() || !accessKey?.trim() || !secretKey?.trim()) {
    return null;
  }
  return new S3Client({
    endpoint: endpoint.replace(/\/$/, ""),
    region: process.env.MINIO_REGION || "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });
}

function getBucket(): string | null {
  const bucket = process.env.MINIO_BUCKET?.trim();
  return bucket || null;
}

/**
 * Returns the public URL for an object key (path-style: endpoint/bucket/key).
 * Caller must ensure the bucket has a policy that allows read access if needed.
 */
export function getPublicUrl(key: string): string {
  const endpoint = (process.env.MINIO_ENDPOINT || "").replace(/\/$/, "");
  const bucket = process.env.MINIO_BUCKET?.trim() || "motto-ocha-assets";
  return `${endpoint}/${bucket}/${key}`;
}

export function isStorageConfigured(): boolean {
  return getClient() !== null && getBucket() !== null;
}

export type UploadPrefix = keyof typeof STORAGE_PREFIX;

/**
 * Upload a buffer to the bucket under a given prefix. Returns the public URL.
 * - prefix: "UPLOADS" | "SCRAPED" | "CAPTURED"
 * - subfolder: e.g. "tea", "farm", or for captured: userId
 * - extension: e.g. "jpg", "png", "glb"
 */
export async function uploadToStorage(
  prefix: UploadPrefix,
  subfolder: string,
  body: Buffer,
  contentType: string,
  extension?: string
): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) {
    throw new Error("Storage (MinIO) is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET.");
  }

  const ext = extension || contentTypeToExt(contentType);
  const basePrefix = STORAGE_PREFIX[prefix];
  const key = `${basePrefix}${subfolder}/${randomUUID()}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return getPublicUrl(key);
}

function contentTypeToExt(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "model/gltf-binary": "glb",
  };
  const base = contentType.split(";")[0].trim().toLowerCase();
  return map[base] || "bin";
}
