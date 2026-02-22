import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      audience: process.env.GOOGLE_CLIENT_ID,
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
