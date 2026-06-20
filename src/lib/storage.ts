import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2/S3 compatible storage client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  s3Client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "genesisai-images";

/**
 * Upload an image buffer to S3/R2 storage
 * 注意：必须配置 S3_PUBLIC_URL 才能获得永久访问 URL
 *       未配置时会回退到 7 天预签名 URL（不推荐生产使用）
 */
export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType: string = "image/png"
): Promise<string | null> {
  const client = getS3Client();
  if (!client) {
    console.warn("S3 not configured, skipping upload");
    return null;
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // 生产环境推荐：设置 Cache-Control 减少重复下载费用
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // 优先使用配置的公开域名（永久 URL，推荐生产环境配置）
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }

    // 警告：未配置 S3_PUBLIC_URL，回退到预签名 URL（7 天后过期）
    console.warn(
      "⚠️  S3_PUBLIC_URL 未配置，使用预签名 URL（7 天后过期）。" +
      "生产环境请配置 S3_PUBLIC_URL 以获得永久访问 URL。"
    );
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn: 604800 });
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    return null;
  }
}

/**
 * Delete an image from S3/R2 storage
 */
export async function deleteImage(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    return false;
  }
}

/**
 * Generate a unique storage key for an image
 */
export function generateImageKey(userId: string, imageId: string, ext: string = "png"): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `images/${userId}/${year}/${month}/${imageId}.${ext}`;
}

/**
 * Check if S3/R2 storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  );
}
