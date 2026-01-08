/**
 * VPS OAuth Configuration
 * =======================
 * 
 * Google OAuth implementation for standalone VPS deployment.
 * Does NOT depend on Manus platform.
 * 
 * Usage:
 * - Use this instead of oauth.ts when running on VPS
 * - Implements standard Google OAuth 2.0 flow
 * - Works with any environment (localhost, VPS, Docker, etc)
 * 
 * Environment: VPS, Docker, Railway, Render, Hostinger, etc
 */

import { ENV } from './env';
import crypto from 'crypto';

/**
 * OAuth configuration
 * Reads from environment variables
 */
export const oauthConfig = {
  clientId: ENV.googleClientId,
  clientSecret: ENV.googleClientSecret,
  redirectUri: ENV.googleRedirectUri,
};

/**
 * Validate OAuth credentials
 * Throws error if credentials are missing
 * 
 * @throws Error if credentials are not configured
 */
export function validateOAuthConfig(): void {
  if (!oauthConfig.clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in .env');
  }
  if (!oauthConfig.clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not configured in .env');
  }
  console.log('✅ Google OAuth configuration validated');
}

/**
 * Generate random state for CSRF protection
 * 
 * @returns Random state string
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get Google OAuth authorization URL
 * 
 * @param redirectUri - Where Google should redirect after auth
 * @param state - Random state for CSRF protection
 * @returns Google OAuth authorization URL
 */
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams();
  params.append('client_id', oauthConfig.clientId || '');
  params.append('redirect_uri', redirectUri);
  params.append('response_type', 'code');
  params.append('scope', 'openid email profile');
  params.append('state', state);
  params.append('access_type', 'offline');
  params.append('prompt', 'consent');

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 * 
 * @param code - Authorization code from Google
 * @param redirectUri - Must match the redirect URI used in getGoogleAuthUrl
 * @returns { accessToken, idToken, refreshToken }
 */
export async function exchangeOAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams();
  params.append('client_id', oauthConfig.clientId || '');
  params.append('client_secret', oauthConfig.clientSecret || '');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
    };
  } catch (error) {
    console.error('❌ OAuth token exchange error:', error);
    throw error;
  }
}

/**
 * Verify and decode Google ID token
 * 
 * @param idToken - JWT token from Google
 * @returns Decoded token payload
 */
export async function verifyIdToken(idToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to verify ID token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ ID token verification error:', error);
    throw error;
  }
}

/**
 * Get user info from access token
 * 
 * @param accessToken - Access token from Google
 * @returns User info { sub, email, name, picture }
 */
export async function getUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Get user info error:', error);
    throw error;
  }
}

/**
 * Parse ID token without verification (for development only)
 * WARNING: Only use for development! Always verify in production!
 * 
 * @param idToken - JWT token
 * @returns Decoded payload
 */
export function parseIdToken(idToken: string): any {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('❌ Token parsing error:', error);
    throw error;
  }
}

export default {
  validateOAuthConfig,
  generateOAuthState,
  getGoogleAuthUrl,
  exchangeOAuthCode,
  verifyIdToken,
  getUserInfo,
  parseIdToken,
};
