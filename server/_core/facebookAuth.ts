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

// Log env vars status on module load
console.log('[FacebookAuth] Module loaded');
console.log('[FacebookAuth] FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? `OK (${FACEBOOK_APP_ID})` : 'MISSING');
console.log('[FacebookAuth] FACEBOOK_APP_SECRET:', FACEBOOK_APP_SECRET ? `OK (${FACEBOOK_APP_SECRET.length} chars)` : 'MISSING');
console.log('[FacebookAuth] Graph API Base:', GRAPH_BASE);

/**
 * Debug / validate an access token using the Facebook Graph API.
 * Uses an App Token (app_id|app_secret) for server-side validation.
 * Returns the validated Facebook user info.
 */
export async function verifyFacebookToken(accessToken: string): Promise<FacebookUserInfo> {
    console.log('=== FACEBOOK TOKEN VERIFICATION START ===');
    console.log('[FacebookAuth] accessToken received:', accessToken ? `YES (${accessToken.substring(0, 20)}...)` : 'EMPTY');

    try {
        // 1. Validate the token with Facebook's debug endpoint
        const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
        console.log('[FacebookAuth] App token constructed:', appToken ? `YES (${FACEBOOK_APP_ID}|***${FACEBOOK_APP_SECRET.slice(-4)})` : 'EMPTY');

        const debugUrl = `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`;
        console.log('[FacebookAuth] Step 1: Calling debug_token endpoint...');

        const debugRes = await fetch(debugUrl);
        console.log('[FacebookAuth] debug_token HTTP status:', debugRes.status);

        const debugData = await debugRes.json() as any;
        console.log('[FacebookAuth] debug_token response:', JSON.stringify(debugData, null, 2));

        if (!debugData.data || !debugData.data.is_valid) {
            console.error('[FacebookAuth] Token validation FAILED - is_valid:', debugData.data?.is_valid);
            console.error('[FacebookAuth] Error info:', debugData.data?.error);
            throw new Error('Invalid Facebook access token');
        }
        console.log('[FacebookAuth] Token is VALID');

        // Verify the token was issued for our app
        if (debugData.data.app_id !== FACEBOOK_APP_ID) {
            console.error('[FacebookAuth] App ID MISMATCH:', debugData.data.app_id, '!==', FACEBOOK_APP_ID);
            throw new Error('Token was not issued for this application');
        }
        console.log('[FacebookAuth] App ID matches');

        const userId = debugData.data.user_id;
        if (!userId) {
            console.error('[FacebookAuth] No user_id in debug response');
            throw new Error('No user_id in token debug response');
        }
        console.log('[FacebookAuth] Facebook user_id:', userId);

        // 2. Fetch user profile using the validated access token
        const profileUrl = `${GRAPH_BASE}/${userId}?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
        console.log('[FacebookAuth] Step 2: Fetching user profile...');

        const profileRes = await fetch(profileUrl);
        console.log('[FacebookAuth] Profile HTTP status:', profileRes.status);

        const profile = await profileRes.json() as any;
        console.log('[FacebookAuth] Profile response:', JSON.stringify(profile, null, 2));

        if (!profile.id || !profile.name) {
            console.error('[FacebookAuth] Missing required profile fields - id:', profile.id, 'name:', profile.name);
            throw new Error('Missing required user information from Facebook');
        }

        const result: FacebookUserInfo = {
            providerId: profile.id,
            email: profile.email || '',
            name: profile.name,
            picture: profile.picture?.data?.url || '',
        };
        console.log('[FacebookAuth] Final result:', JSON.stringify(result, null, 2));
        console.log('=== FACEBOOK TOKEN VERIFICATION SUCCESS ===');

        return result;
    } catch (error: any) {
        console.error('=== FACEBOOK TOKEN VERIFICATION FAILED ===');
        console.error('[FacebookAuth] Error type:', error?.constructor?.name);
        console.error('[FacebookAuth] Error message:', error?.message);
        console.error('[FacebookAuth] Error response status:', error?.response?.status);
        console.error('[FacebookAuth] Error response data:', error?.response?.data);
        console.error('[FacebookAuth] Stack:', error?.stack);
        throw new Error(`Failed to verify Facebook token: ${error?.message}`);
    }
}
