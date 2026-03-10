/**
 * Login da Minha Conta – Google / Facebook / Email+Senha
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { FacebookLoginButton } from "@/components/FacebookLoginButton";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

type Mode = "choose" | "login" | "register";

export default function ClienteLogin() {
    const [, navigate] = useLocation();
    const [mode, setMode] = useState<Mode>("choose");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(false);

    const utils = trpc.useUtils();
    const loginEmail = trpc.clienteAuth.loginEmail.useMutation();
    const registerEmail = trpc.clienteAuth.registerEmail.useMutation();
    const loginGoogle = trpc.clienteAuth.loginGoogle.useMutation();
    const loginFacebook = trpc.clienteAuth.loginFacebook.useMutation();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginEmail.mutateAsync({ email, senha });
            await utils.cliente.me.invalidate();
            toast.success("Login realizado!");
            navigate("/xp-club/dashboard");
        } catch (err: any) {
            toast.error(err?.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await registerEmail.mutateAsync({ nome, email, senha });
            await utils.cliente.me.invalidate();
            toast.success("Conta criada com sucesso!");
            navigate("/xp-club/dashboard");
        } catch (err: any) {
            toast.error(err?.message || "Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (_authorId: number, info: { name: string; email: string }) => {
        // O GoogleLoginButton chama o endpoint de reviews – vamos ignorar e usar nosso endpoint
        // Precisamos do token cru (credential). Vamos usar fetch direto.
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
            style={{ background: "#1A2B4C" }}
        >
            <div className="max-w-md w-full">
                {/* Logo */}
                {APP_LOGO && (
                    <div className="text-center mb-10">
                        <img src={APP_LOGO} alt={APP_TITLE} className="h-20 md:h-24 mx-auto" />
                    </div>
                )}

                <div
                    className="bg-white rounded-lg p-8 md:p-10 border-2 border-muted/40"
                    style={{ boxShadow: "0 0 0 6px #fff" }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-light text-accent mb-2">
                            {mode === "register" ? (
                                <>
                                    Criar <span className="font-semibold">Conta</span>
                                </>
                            ) : (
                                <>
                                    Minha <span className="font-semibold">Conta</span>
                                </>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {mode === "register"
                                ? "Preencha seus dados para criar sua conta"
                                : "Faça login para acessar sua área exclusiva"}
                        </p>
                    </div>

                    {/* Social Login - always shown in choose mode */}
                    {mode === "choose" && (
                        <div className="space-y-5">
                            <ClienteGoogleButton
                                onLoginDone={() => navigate("/xp-club/dashboard")}
                            />
                            <div className="flex items-center gap-4 max-w-[300px] mx-auto">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-sm text-muted-foreground">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <ClienteFacebookButton
                                onLoginDone={() => navigate("/xp-club/dashboard")}
                            />
                            <div className="flex items-center gap-4 max-w-[300px] mx-auto">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-sm text-muted-foreground">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => setMode("login")}
                                >
                                    <Mail className="w-4 h-4" />
                                    Entrar com Email
                                </Button>
                                <button
                                    onClick={() => setMode("register")}
                                    className="text-sm text-accent underline hover:text-accent/80 transition-colors"
                                >
                                    Não tem conta? Cadastre-se
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Email Login form */}
                    {mode === "login" && (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="login-senha">Senha</Label>
                                <Input
                                    id="login-senha"
                                    type="password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="••••••"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Entrar
                            </Button>
                            <div className="flex justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setMode("choose")}
                                    className="text-accent underline hover:text-accent/80"
                                >
                                    ← Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("register")}
                                    className="text-accent underline hover:text-accent/80"
                                >
                                    Criar conta
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Email Register form */}
                    {mode === "register" && (
                        <form onSubmit={handleEmailRegister} className="space-y-4">
                            <div>
                                <Label htmlFor="reg-nome">Nome</Label>
                                <Input
                                    id="reg-nome"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required
                                    minLength={2}
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div>
                                <Label htmlFor="reg-email">Email</Label>
                                <Input
                                    id="reg-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="reg-senha">Senha</Label>
                                <Input
                                    id="reg-senha"
                                    type="password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Criar Conta
                            </Button>
                            <div className="flex justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setMode("choose")}
                                    className="text-accent underline hover:text-accent/80"
                                >
                                    ← Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("login")}
                                    className="text-accent underline hover:text-accent/80"
                                >
                                    Já tem conta? Entrar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Back to site */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate("/")}
                        className="text-white/70 hover:text-white text-sm flex items-center gap-1 mx-auto transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao site
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Sub-components: Google / Facebook buttons que chamam clienteAuth
// ──────────────────────────────────────────────────────────────────

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

function isInAppBrowser() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /FBAN|FBAV|Instagram|Line\//i.test(ua) || /; wv\)|\bwv\b|WebView/i.test(ua);
}

function ClienteGoogleButton({ onLoginDone }: { onLoginDone: () => void }) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const utils = trpc.useUtils();
    const loginGoogle = trpc.clienteAuth.loginGoogle.useMutation();

    if (!clientId) {
        return null;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        if (credentialResponse.credential) {
                            try {
                                await loginGoogle.mutateAsync({ token: credentialResponse.credential });
                                await utils.cliente.me.invalidate();
                                toast.success("Login realizado!");
                                onLoginDone();
                            } catch (err: any) {
                                toast.error(err?.message || "Falha ao fazer login com Google");
                            }
                        }
                    }}
                    onError={() => {
                        if (isInAppBrowser()) {
                            toast.error("Google bloqueia login no navegador interno. Abra este link no Safari/Chrome e tente novamente.");
                            return;
                        }
                        toast.error("Falha ao fazer login com Google");
                    }}
                    theme="outline"
                    size="large"
                    text="continue_with"
                />
            </div>
            {isInAppBrowser() && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                    Se estiver no Instagram/Facebook, use "Abrir no navegador" para entrar com Google.
                </p>
            )}
        </GoogleOAuthProvider>
    );
}

function ClienteFacebookButton({ onLoginDone }: { onLoginDone: () => void }) {
    const utils = trpc.useUtils();
    const loginFb = trpc.clienteAuth.loginFacebook.useMutation();
    const [isLoading, setIsLoading] = useState(false);
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || "2368392583585442";

    const ensureFacebookSdk = async () => {
        if (typeof window === "undefined") return false;
        if ((window as any).FB) return true;

        await new Promise<void>((resolve, reject) => {
            const existing = document.getElementById("facebook-jssdk") as HTMLScriptElement | null;

            (window as any).fbAsyncInit = () => {
                try {
                    (window as any).FB.init({
                        appId: fbAppId,
                        cookie: true,
                        xfbml: false,
                        version: "v18.0",
                    });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            if (!existing) {
                const script = document.createElement("script");
                script.id = "facebook-jssdk";
                script.src = "https://connect.facebook.net/pt_BR/sdk.js";
                script.async = true;
                script.defer = true;
                script.onerror = () => reject(new Error("failed-to-load-facebook-sdk"));
                document.head.appendChild(script);
            }

            let attempts = 0;
            const wait = setInterval(() => {
                if ((window as any).FB) {
                    clearInterval(wait);
                    resolve();
                    return;
                }
                attempts += 1;
                if (attempts >= 80) {
                    clearInterval(wait);
                    reject(new Error("facebook-sdk-timeout"));
                }
            }, 100);
        }).catch(() => false);

        return !!(window as any).FB;
    };

    const handleClick = async () => {
        setIsLoading(true);
        const sdkReady = await ensureFacebookSdk();
        if (!sdkReady) {
            setIsLoading(false);
            toast.error("Não foi possível carregar o Facebook. Tente novamente ou abra no Safari/Chrome.");
            return;
        }

        let finished = false;
        const watchdog = window.setTimeout(() => {
            if (!finished) {
                setIsLoading(false);
                toast.error("O Facebook não respondeu. Tente novamente ou abra no Safari/Chrome.");
            }
        }, 15000);

        window.FB.login(
            async (response: any) => {
                finished = true;
                window.clearTimeout(watchdog);
                if (response.status === "connected" && response.authResponse) {
                    try {
                        await loginFb.mutateAsync({ accessToken: response.authResponse.accessToken });
                        await utils.cliente.me.invalidate();
                        toast.success("Login realizado!");
                        onLoginDone();
                    } catch (err: any) {
                        toast.error(err?.message || "Falha ao fazer login com Facebook");
                    }
                } else {
                    toast.error("Login com Facebook cancelado ou bloqueado.");
                }
                setIsLoading(false);
            },
            { scope: "public_profile,email" }
        );
    };

    return (
        <div className="flex justify-center">
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1565D8] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Helvetica, Arial, sans-serif", height: "40px", minWidth: "230px" }}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                )}
                <span className="text-[13px]">{isLoading ? "Conectando..." : "Continuar com o Facebook"}</span>
            </button>
        </div>
    );
}
