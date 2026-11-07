/**
 * Adapter Cloudflare R2 untuk penyimpanan file.
 *
 * Implementasi S3-compatible client untuk R2. Jika env vars R2 belum diisi,
 * fallback ke penyimpanan lokal (.data/uploads/).
 */
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function createS3Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  });
}

/**
 * Upload file ke R2. Jika R2 belum dikonfigurasi, return null
 * (pemanggil akan fallback ke local storage).
 */
export async function uploadToR2(
  storageKey: string,
  data: Buffer,
  mimeType: string,
): Promise<boolean> {
  const config = getR2Config();
  if (!config) return false;

  try {
    const client = createS3Client(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
        Body: data,
        ContentType: mimeType,
      }),
    );
    return true;
  } catch (error) {
    console.error("[R2] Upload failed:", error);
    return false;
  }
}

/**
 * Download file dari R2. Jika R2 belum dikonfigurasi atau file tidak ada,
 * return null (pemanggil akan fallback ke local storage).
 */
export async function downloadFromR2(storageKey: string): Promise<Buffer | null> {
  const config = getR2Config();
  if (!config) return null;

  try {
    const client = createS3Client(config);
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      }),
    );

    if (!response.Body) return null;

    // Convert stream to buffer
    const stream = sdkStreamMixin(response.Body);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("[R2] Download failed:", error);
    return null;
  }
}

/**
 * Hapus file dari R2. Jika R2 belum dikonfigurasi, return false
 * (pemanggil akan fallback ke local storage).
 */
export async function deleteFromR2(storageKey: string): Promise<boolean> {
  const config = getR2Config();
  if (!config) return false;

  try {
    const client = createS3Client(config);
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      }),
    );
    return true;
  } catch (error) {
    console.error("[R2] Delete failed:", error);
    return false;
  }
}

/**
 * Cek apakah R2 sudah dikonfigurasi.
 */
export function isR2Configured(): boolean {
  return getR2Config() !== null;
}
