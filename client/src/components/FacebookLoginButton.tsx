import { useEffect, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Extend Window to include FB SDK globals
declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: {
            init: (params: {
                appId: string;
                cookie: boolean;
                xfbml: boolean;
                version: string;
            }) => void;
            getLoginStatus: (callback: (response: FacebookLoginStatusResponse) => void) => void;
            login: (callback: (response: FacebookLoginStatusResponse) => void, options?: { scope: string }) => void;
            api: (path: string, params: Record<string, string>, callback: (response: any) => void) => void;
        };
    }
}

interface FacebookLoginStatusResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
        accessToken: string;
        expiresIn: number;
        signedRequest: string;
        userID: string;
    };
}

interface FacebookLoginButtonProps {
    onSuccess: (authorId: number, authorInfo: { name: string; email: string; avatarUrl: string | null }) => void;
    onError: () => void;
}

const FB_APP_ID = '2368392583585442';
const FB_SDK_VERSION = 'v18.0';

let sdkLoaded = false;
let sdkLoading = false;

function loadFacebookSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (sdkLoaded && window.FB) {
            resolve();
            return;
        }

        if (sdkLoading) {
            // Wait for SDK to finish loading
            const check = setInterval(() => {
                if (sdkLoaded && window.FB) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            return;
        }

        sdkLoading = true;

        window.fbAsyncInit = () => {
            window.FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: false,
                version: FB_SDK_VERSION,
            });
            sdkLoaded = true;
            sdkLoading = false;
            resolve();
        };

        // Load SDK script
        if (!document.getElementById('facebook-jssdk')) {
            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
            script.async = true;
            script.defer = true;
            script.onerror = () => {
                sdkLoading = false;
                reject(new Error('Failed to load Facebook SDK'));
            };
            document.head.appendChild(script);
        }
    });
}

export function FacebookLoginButton({ onSuccess, onError }: FacebookLoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    useEffect(() => {
        loadFacebookSDK()
            .then(() => {
                setSdkReady(true);
                // Check existing login status
                window.FB.getLoginStatus((response) => {
                    if (response.status === 'connected' && response.authResponse) {
                        handleFBResponse(response);
                    }
                });
            })
            .catch((err) => {
                console.error('[Facebook SDK] Failed to load:', err);
            });
    }, []);

    const sendTokenToBackend = useCallback(
        async (accessToken: string, profile: { name: string; email: string; pictureUrl: string }) => {
            try {
                const res = await fetch('/api/trpc/reviews.verifyFacebook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken }),
                });
                const data = await res.json();

                if (data.result?.data?.success && data.result?.data?.author) {
                    const author = data.result.data.author;
                    onSuccess(author.id, {
                        name: author.name,
                        email: author.email,
                        avatarUrl: author.avatarUrl,
                    });
                } else {
                    onError();
                }
            } catch {
                onError();
            }
        },
        [onSuccess, onError],
    );

    const handleFBResponse = useCallback(
        (response: FacebookLoginStatusResponse) => {
            if (response.status === 'connected' && response.authResponse) {
                const { accessToken } = response.authResponse;

                // Fetch profile info from Graph API
                window.FB.api(
                    '/me',
                    { fields: 'id,name,email,picture.type(large)' },
                    (profile: any) => {
                        if (profile && !profile.error) {
                            sendTokenToBackend(accessToken, {
                                name: profile.name || '',
                                email: profile.email || '',
                                pictureUrl: profile.picture?.data?.url || '',
                            });
                        } else {
                            onError();
                        }
                    },
                );
            } else {
                setIsLoading(false);
            }
        },
        [sendTokenToBackend, onError],
    );

    const handleClick = () => {
        if (!sdkReady || !window.FB) {
            console.error('[Facebook] SDK not ready');
            onError();
            return;
        }

        setIsLoading(true);

        window.FB.login(
            (response) => {
                if (response.status === 'connected') {
                    handleFBResponse(response);
                } else {
                    setIsLoading(false);
                    // User cancelled or didn't authorize
                }
            },
            { scope: 'public_profile,email' },
        );
    };

    return (
        <div className="flex justify-center">
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading || !sdkReady}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1565D8] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif', height: '40px', minWidth: '230px' }}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                )}
                <span className="text-[13px]">{isLoading ? 'Conectando...' : 'Continuar com o Facebook'}</span>
            </button>
        </div>
    );
}
