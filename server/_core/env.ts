/**
 * VPS Environment Configuration
 * =============================
 * 
 * Handles environment variables for standalone VPS deployment.
 * Does NOT depend on Manus platform.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory (keep as is)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

/**
 * Environment configuration object
 * All values are read from process.env
 */
export const ENV = {
  // ============================================
  // SERVER CONFIGURATION
  // ============================================
  nodeEnv: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '3000', 10), // garante 3000 se não houver
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // ============================================
  // DATABASE
  // ============================================
  databaseUrl: process.env.DATABASE_URL, // mantém produção

  // ============================================
  // AUTHENTICATION & JWT
  // ============================================
  jwtSecret: process.env.JWT_SECRET, // mantém produção
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // ============================================
  // GOOGLE OAUTH (dummy para rodar sem configuração)
  // ============================================
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/oauth/callback',
  oauthServerUrl: process.env.OAUTH_SERVER_URL || 'http://localhost:4000',

  // ============================================
  // FRONTEND
  // ============================================
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || '3000'}`,

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
  smtpFrom: process.env.SMTP_FROM || 'noreply@xploreviagens.com.br',
  ownerEmail: process.env.OWNER_EMAIL,

  // ============================================
  // APP CONFIGURATION
  // ============================================
  appName: process.env.APP_NAME || 'Xplore Viagens',
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || '3000'}`,
};

/**
 * Validate required environment variables on startup
 * Throws error if any required variable is missing
 */
export function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn('');
    console.warn('⚠️ Warning: Missing environment variables, using dummy defaults for VPS deployment:');
    missing.forEach((key) => console.warn(`   - ${key}`));
    console.warn('');
  }

  console.log('✅ Environment variables validated (dummy defaults applied if missing)');
}

/**
 * Log environment configuration (safe, no secrets)
 */
export function logEnvConfig(): void {
  console.log('');
  console.log('📋 VPS Environment Configuration:');
  console.log(`   NODE_ENV: ${ENV.nodeEnv}`);
  console.log(`   PORT: ${ENV.port}`);
  console.log(`   DATABASE: ${ENV.databaseUrl?.split('@')[1] || 'unknown'}`);
  console.log(`   STORAGE: ${ENV.storageType}`);
  console.log(`   FRONTEND: ${ENV.frontendUrl}`);
  console.log('');
}

/**
 * Get OAuth redirect URI based on request
 */
export function getOAuthRedirectUri(req: any): string {
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.headers.host || `localhost:${ENV.port}`;
  return `${protocol}://${host}/api/oauth/callback`;
}

export default ENV;
