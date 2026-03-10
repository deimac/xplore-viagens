import { OAuth2Client } from 'google-auth-library';

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(googleClientId);

export interface GoogleUserInfo {
  providerId: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Verify Google OAuth token and extract user information
 * @param token - The credential token from Google OAuth
 * @returns User information from Google
 */
export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid token payload');
    }

    if (!payload.sub || !payload.email || !payload.name) {
      throw new Error('Missing required user information');
    }

    return {
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture || '',
    };
  } catch (error) {
    console.error('[GoogleAuth] Token verification failed:', error);
    throw new Error('Failed to verify Google token');
  }
}
