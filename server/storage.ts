/**
 * VPS Storage Configuration
 * =========================
 * 
 * File storage implementation for standalone VPS deployment.
 * Supports local storage (default) and optional S3.
 * Does NOT depend on Manus platform.
 * 
 * Usage:
 * - Use this instead of storage.ts when running on VPS
 * - Local storage by default (no configuration needed)
 * - Optional S3 support via environment variables
 * 
 * Environment: VPS, Docker, Railway, Render, Hostinger, etc
 */

import fs from 'fs';
import path from 'path';
import { ENV } from './_core/env';

const UPLOADS_DIR = path.join(process.cwd(), ENV.uploadsDir);

/**
 * Initialize uploads directory
 * Creates directory if it doesn't exist
 */
export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`✅ Created uploads directory: ${UPLOADS_DIR}`);
  }
}

/**
 * Store file locally
 * 
 * @param key - File path (e.g., 'hero-slides/abc123.jpg')
 * @param data - File content (Buffer or string)
 * @returns { url, key }
 */
export async function storagePutLocal(
  key: string,
  data: Buffer | string
): Promise<{ url: string; key: string }> {
  ensureUploadsDir();

  const filePath = path.join(UPLOADS_DIR, key);
  const dirPath = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Write file
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;
  fs.writeFileSync(filePath, buffer);

  console.log(`✅ File stored locally: ${key}`);

  // Return URL (relative path)
  const baseUrl = ENV.publicUrl?.replace(/\/$/, "") || "";
  const url = `${baseUrl}/${ENV.uploadsDir}/${key}`;

  return { url, key };
}

/**
 * Store file (local or S3)
 * 
 * @param key - File path (e.g., 'hero-slides/abc123.jpg')
 * @param data - File content (Buffer or string)
 * @param contentType - MIME type (e.g., 'image/jpeg')
 * @returns { url, key }
 */
export async function storagePut(
  key: string,
  data: Buffer | string,
  contentType?: string
): Promise<{ url: string; key: string }> {
  // Use local storage by default
  if (ENV.storageType === 'local') {
    return await storagePutLocal(key, data);
  }

  // S3 support (optional, not implemented in this version)
  console.warn('⚠️  S3 storage not configured, falling back to local storage');
  return await storagePutLocal(key, data);
}

/**
 * Get file URL
 * 
 * @param key - File path
 * @returns { url, key }
 */
export async function storageGet(key: string): Promise<{ url: string; key: string }> {
  const baseUrl = ENV.publicUrl?.replace(/\/$/, "") || "";
  const url = `${baseUrl}/${ENV.uploadsDir}/${key}`;
  return { url, key };
}

/**
 * Delete file
 * 
 * @param key - File path
 */
export async function storageDelete(key: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, key);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ File deleted: ${key}`);
  } else {
    console.warn(`⚠️  File not found: ${key}`);
  }
}

/**
 * Check if file exists
 * 
 * @param key - File path
 * @returns true if file exists
 */
export function fileExists(key: string): boolean {
  const filePath = path.join(UPLOADS_DIR, key);
  return fs.existsSync(filePath);
}

/**
 * Get file size
 * 
 * @param key - File path
 * @returns File size in bytes
 */
export function getFileSize(key: string): number {
  const filePath = path.join(UPLOADS_DIR, key);
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Create property images directory
 * 
 * @param propertyId - Property ID
 */
export function ensurePropertyDir(propertyId: number): string {
  const propertyDir = path.join(UPLOADS_DIR, 'properties', propertyId.toString());
  if (!fs.existsSync(propertyDir)) {
    fs.mkdirSync(propertyDir, { recursive: true });
    console.log(`✅ Created property directory: ${propertyDir}`);
  }
  return propertyDir;
}

/**
 * Store property image as webp
 * 
 * @param propertyId - Property ID
 * @param filename - Filename (e.g., 'cover', '01', '02')
 * @param imageData - Image buffer
 * @returns { url, key }
 */
export async function storePropertyImage(
  propertyId: number,
  filename: string,
  imageData: Buffer
): Promise<{ url: string; key: string }> {
  const sharp = await import('sharp');

  ensurePropertyDir(propertyId);

  // Convert to webp
  const webpData = await sharp.default(imageData)
    .webp({ quality: 85 })
    .toBuffer();

  const key = `properties/${propertyId}/${filename}.webp`;
  return await storagePut(key, webpData, 'image/webp');
}

/**
 * Process and store multiple property images
 * 
 * @param propertyId - Property ID
 * @param images - Array of { name: string, data: Buffer, isPrimary: boolean }
 * @returns Array of { url, filename, isPrimary, sortOrder }
 */
export async function storePropertyImages(
  propertyId: number,
  images: Array<{ name: string; data: Buffer; isPrimary: boolean }>
): Promise<Array<{ url: string; filename: string; isPrimary: boolean; sortOrder: number }>> {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    let filename: string;

    if (image.isPrimary) {
      filename = 'cover';
    } else {
      filename = String(i + 1).padStart(2, '0');
    }

    const result = await storePropertyImage(propertyId, filename, image.data);

    results.push({
      url: result.url,
      filename: filename + '.webp',
      isPrimary: image.isPrimary,
      sortOrder: image.isPrimary ? 0 : i + 1,
    });
  }

  return results;
}

/**
 * Create room images directory
 * 
 * @param propertyId - Property ID
 */
export function ensureRoomsDir(propertyId: number): string {
  const roomsDir = path.join(UPLOADS_DIR, 'properties', propertyId.toString(), 'rooms');
  if (!fs.existsSync(roomsDir)) {
    fs.mkdirSync(roomsDir, { recursive: true });
    console.log(`✅ Created rooms directory: ${roomsDir}`);
  }
  return roomsDir;
}

/**
 * Store room sleeping photo
 * 
 * @param propertyId - Property ID
 * @param roomId - Property Room ID
 * @param imageData - Image buffer
 * @returns { url, key }
 */
export async function storeRoomPhoto(
  propertyId: number,
  roomId: number,
  imageData: Buffer
): Promise<{ url: string; key: string }> {
  const sharp = await import('sharp');

  ensureRoomsDir(propertyId);

  // Convert to webp
  const webpData = await sharp.default(imageData)
    .webp({ quality: 85 })
    .toBuffer();

  const timestamp = Date.now();
  const key = `properties/${propertyId}/rooms/room-${roomId}-${timestamp}.webp`;
  return await storagePut(key, webpData, 'image/webp');
}

/**
 * Delete room sleeping photo
 * 
 * @param photoPath - Photo path (e.g., '/uploads/properties/1/rooms/room-1-123456.webp')
 */
export async function deleteRoomPhoto(photoPath: string): Promise<void> {
  if (!photoPath) return;

  // Extract key from path (remove /uploads/ prefix)
  const key = photoPath.replace(/^\/uploads\//, '');
  await storageDelete(key);
}

export default {
  ensureUploadsDir,
  storagePut,
  storagePutLocal,
  storageGet,
  storageDelete,
  fileExists,
  getFileSize,
  ensurePropertyDir,
  storePropertyImage,
  storePropertyImages,
  ensureRoomsDir,
  storeRoomPhoto,
  deleteRoomPhoto,
};
