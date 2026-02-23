/**
 * Facebook OAuth verification module.
 *
 * Validates an access token received from the Facebook JS SDK
 * by calling the Graph API server-side, then fetches the user profile.
 */

export interface FacebookUserInfo {
    providerId: string;
    email: string;
    name: string;
    picture: string;
}

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '2368392583585442';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Debug / validate an access token using the Facebook Graph API.
 * Uses an App Token (app_id|app_secret) for server-side validation.
 * Returns the validated Facebook user info.
 */
export async function verifyFacebookToken(accessToken: string): Promise<FacebookUserInfo> {
    try {
        // 1. Validate the token with Facebook's debug endpoint
        const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
        const debugUrl = `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`;

        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json() as any;

        if (!debugData.data || !debugData.data.is_valid) {
            throw new Error('Invalid Facebook access token');
        }

        // Verify the token was issued for our app
        if (debugData.data.app_id !== FACEBOOK_APP_ID) {
            throw new Error('Token was not issued for this application');
        }

        const userId = debugData.data.user_id;
        if (!userId) {
            throw new Error('No user_id in token debug response');
        }

        // 2. Fetch user profile using the validated access token
        const profileUrl = `${GRAPH_BASE}/${userId}?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
        const profileRes = await fetch(profileUrl);
        const profile = await profileRes.json() as any;

        if (!profile.id || !profile.name) {
            throw new Error('Missing required user information from Facebook');
        }

        return {
            providerId: profile.id,
            email: profile.email || '',
            name: profile.name,
            picture: profile.picture?.data?.url || '',
        };
    } catch (error) {
        console.error('[FacebookAuth] Token verification failed:', error);
        throw new Error('Failed to verify Facebook token');
    }
}
