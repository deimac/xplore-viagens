/**
 * ClienteAuthInline – formulário de login/cadastro para ser
 * embutido na Home (coluna central), sem ocupar uma página inteira.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, X } from "lucide-react";

type Mode = "choose" | "login" | "register";

interface ClienteAuthInlineProps {
    onClose: () => void;
}

export default function ClienteAuthInline({ onClose }: ClienteAuthInlineProps) {
    const [, navigate] = useLocation();
    const [mode, setMode] = useState<Mode>("choose");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(false);

    const utils = trpc.useUtils();
    const loginEmail = trpc.clienteAuth.loginEmail.useMutation();
    const registerEmail = trpc.clienteAuth.registerEmail.useMutation();

    const onLoginDone = () => {
        navigate("/xp-club/dashboard");
    };

    const validateLogin = (): boolean => {
        if (!email.trim()) { toast.error("Informe seu email"); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Email inválido"); return false; }
        if (!senha) { toast.error("Informe sua senha"); return false; }
        if (senha.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return false; }
        return true;
    };

    const validateRegister = (): boolean => {
        if (!nome.trim()) { toast.error("Informe seu nome"); return false; }
        if (nome.trim().length < 2) { toast.error("O nome deve ter pelo menos 2 caracteres"); return false; }
        if (!email.trim()) { toast.error("Informe seu email"); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Email inválido"); return false; }
        if (!senha) { toast.error("Informe sua senha"); return false; }
        if (senha.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return false; }
        return true;
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateLogin()) return;
        setLoading(true);
        try {
            await loginEmail.mutateAsync({ email, senha });
            await utils.cliente.me.invalidate();
            toast.success("Login realizado!");
            onLoginDone();
        } catch (err: any) {
            toast.error(err?.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateRegister()) return;
        setLoading(true);
        try {
            await registerEmail.mutateAsync({ nome, email, senha });
            await utils.cliente.me.invalidate();
            toast.success("Conta criada com sucesso!");
            onLoginDone();
        } catch (err: any) {
            toast.error(err?.message || "Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mb-12">
            <div className="max-w-7xl mx-auto px-0 md:px-2 py-8">
                <div className="relative mt-32 mb-2 md:mb-4">
                    {/* Botão de fechar alinhado com o container */}
                    <div className="flex justify-end mx-8 md:mx-16">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex justify-center px-4">
                    <div className="max-w-md w-full">

                        <div
                            className="bg-white rounded-lg p-8 md:p-10 border-2 border-muted/40 min-h-[480px] flex flex-col"
                            style={{ boxShadow: "0 0 0 6px #fff" }}
                        >
                            {/* Header */}
                            <div className="text-center mb-16">
                                <h1 className="text-2xl md:text-3xl font-light text-accent mb-2">
                                    {mode === "register" ? (
                                        <>
                                            Criar <span className="font-semibold">Conta</span>
                                        </>
                                    ) : (
                                        <>
                                            XP <span className="font-semibold">Club</span>
                                        </>
                                    )}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {mode === "register"
                                        ? "Preencha seus dados para criar sua conta"
                                        : "Faça login para acessar sua área exclusiva"}
                                </p>
                            </div>

                            {/* Social Login */}
                            {mode === "choose" && (
                                <div className="space-y-3">
                                    <InlineGoogleButton onLoginDone={onLoginDone} />
                                    <InlineFacebookButton onLoginDone={onLoginDone} />
                                    <div className="flex items-center gap-4 max-w-[300px] mx-auto">
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <span className="text-sm text-muted-foreground">ou</span>
                                        <div className="flex-1 h-px bg-gray-200" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            className="w-full h-[40px] gap-2 rounded border border-gray-300"
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
                                <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                                    <div>
                                        <Label htmlFor="inline-login-email">Email</Label>
                                        <Input
                                            id="inline-login-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="inline-login-senha">Senha</Label>
                                        <Input
                                            id="inline-login-senha"
                                            type="password"
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
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
                                <form onSubmit={handleEmailRegister} className="space-y-4" noValidate>
                                    <div>
                                        <Label htmlFor="inline-reg-nome">Nome</Label>
                                        <Input
                                            id="inline-reg-nome"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="inline-reg-email">Email</Label>
                                        <Input
                                            id="inline-reg-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="inline-reg-senha">Senha</Label>
                                        <Input
                                            id="inline-reg-senha"
                                            type="password"
                                            value={senha}
                                            onChange={(e) => setSenha(e.target.value)}
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
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────

function InlineGoogleButton({ onLoginDone }: { onLoginDone: () => void }) {
    return (
        <div className="w-full">
            <a
                href="/api/auth/google"
                className="w-full h-[40px] flex items-center justify-center gap-2 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-300 transition-colors"
                style={{ fontFamily: "Roboto, Arial, sans-serif", textDecoration: "none" }}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continuar com o Google</span>
            </a>
        </div>
    );
}

function InlineFacebookButton({ onLoginDone }: { onLoginDone: () => void }) {
    return (
        <div className="flex justify-center">
            <a
                href="/api/auth/facebook"
                className="w-full h-[40px] flex items-center justify-center gap-2 px-4 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1565D8] text-white text-sm font-medium rounded border border-[#1877F2] transition-colors"
                style={{ textDecoration: "none" }}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-[13px]">Continuar com o Facebook</span>
            </a>
        </div>
    );
}
