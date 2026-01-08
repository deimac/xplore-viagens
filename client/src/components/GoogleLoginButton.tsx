import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (authorId: number, authorInfo: { name: string; email: string; avatarUrl: string | null }) => void;
  onError: () => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID not configured');
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">
          Google OAuth não está configurado. Configure VITE_GOOGLE_CLIENT_ID nas variáveis de ambiente.
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              // Send token to backend for verification
              fetch('/api/trpc/reviews.verifyGoogle', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: credentialResponse.credential,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
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
                })
                .catch(() => {
                  onError();
                });
            }
          }}
          onError={() => {
            onError();
          }}
          theme="outline"
          size="large"
          text="continue_with"
          locale="pt-BR"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
