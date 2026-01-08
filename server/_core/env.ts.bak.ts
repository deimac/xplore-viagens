/**
 * VPS Environment Configuration
 * =============================
 * 
 * This file handles environment variables for standalone VPS deployment.
 * Does NOT depend on Manus platform.
 * 
 * Usage:
 * - Import this instead of env.ts when running on VPS
 * - All values come from .env file
 * - Validates on startup
 * 
 * Environment: VPS, Docker, Railway, Render, Hostinger, etc
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

/**
 * Environment configuration object
 * All values are read from process.env
 * No Manus dependencies
 */
export const ENV_VPS = {
  // ============================================
  // SERVER CONFIGURATION
  // ============================================
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // ============================================
  // DATABASE
  // ============================================
  databaseUrl: process.env.DATABASE_URL,

  // ============================================
  // AUTHENTICATION & JWT
  // ============================================
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // ============================================
  // GOOGLE OAUTH
  // ============================================
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/oauth/callback',

  // ============================================
  // FRONTEND
  // ============================================
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // ============================================
  // FILE STORAGE
  // ============================================
  storageType: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads',

  // AWS S3 (optional)
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsBucket: process.env.AWS_BUCKET,

  // ============================================
  // EMAIL (SMTP)
  // ============================================
  smtpEnabled: process.env.SMTP_ENABLED === 'true',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'noreply@xploreviagens.com',
  ownerEmail: process.env.OWNER_EMAIL,

  // ============================================
  // APP CONFIGURATION
  // ============================================
  appName: process.env.APP_NAME || 'Xplore Viagens',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};

/**
 * Validate required environment variables on startup
 * Throws error if any required variable is missing
 * 
 * @throws Error if validation fails
 */
export function validateEnvVps(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('');
    console.error('❌ ERROR: Missing required environment variables:');
    console.error('');
    missing.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.error('');
    console.error('📝 Please set these variables in your .env file');
    console.error('📖 See .env.vps.example for reference');
    console.error('');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Log environment configuration (safe, no secrets)
 */
export function logEnvVpsConfig(): void {
  console.log('');
  console.log('📋 VPS Environment Configuration:');
  console.log(`   NODE_ENV: ${ENV_VPS.nodeEnv}`);
  console.log(`   PORT: ${ENV_VPS.port}`);
  console.log(`   DATABASE: ${ENV_VPS.databaseUrl?.split('@')[1] || 'unknown'}`);
  console.log(`   STORAGE: ${ENV_VPS.storageType}`);
  console.log(`   FRONTEND: ${ENV_VPS.frontendUrl}`);
  console.log(`   SMTP: ${ENV_VPS.smtpEnabled ? 'enabled' : 'disabled'}`);
  console.log('');
}

/**
 * Get OAuth redirect URI based on request
 * Handles both HTTP (development) and HTTPS (production)
 * 
 * @param req - Express request object
 * @returns Full callback URL
 */
export function getOAuthRedirectUri(req: any): string {
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}/api/oauth/callback`;
}

export default ENV_VPS;
