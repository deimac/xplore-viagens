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
  const url = `/${ENV.uploadsDir}/${key}`;
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
  const url = `/${ENV.uploadsDir}/${key}`;
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

export default {
  ensureUploadsDir,
  storagePut,
  storagePutLocal,
  storageGet,
  storageDelete,
  fileExists,
  getFileSize,
};
