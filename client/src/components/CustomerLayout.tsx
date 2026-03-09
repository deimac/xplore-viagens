/**
 * CustomerLayout – Layout da Minha Conta
 * Header azul com logo + boas-vindas, sidebar desktop, tab bar mobile
 */
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Receipt,
    LogOut,
    ArrowLeft,
    Gift,
    AlertTriangle,
    Trophy,
    Coins,
    Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const [location, navigate] = useLocation();

    const clienteQuery = trpc.cliente.me.useQuery();
    const logoutMutation = trpc.clienteAuth.logout.useMutation();
    const dashboardQuery = trpc.xp.dashboard.useQuery(undefined, {
        enabled: !!clienteQuery.data?.cadastroCompleto,
    });

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            toast.success("Logout realizado com sucesso");
            window.location.href = "/";
        } catch {
            toast.error("Erro ao deslogar");
        }
    };

    const menuItems = [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/minha-conta/dashboard" },
        { id: "extrato", icon: Receipt, label: "Extrato", href: "/minha-conta/extrato" },
    ];

    const isActive = (href: string) => location === href;

    const cliente = clienteQuery.data;
    const dashboard = dashboardQuery.data;

    const clienteNome = (cliente as any)?.nome || (cliente as any)?.email || "";

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* ── Header Azul (Desktop + Mobile) ── */}
            <header
                className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between"
                style={{ background: "#1A2B4C" }}
            >
                {/* Logo */}
                <Link href="/">
                    <img src={APP_LOGO} alt={APP_TITLE} className="h-10 md:h-14 w-auto cursor-pointer" />
                </Link>

                {/* Boas-vindas + nav desktop */}
                <div className="flex items-center gap-4">
                    {clienteNome && (
                        <span className="hidden sm:block text-white/90 text-sm">
                            Bem-vindo(a), <span className="font-semibold text-white">{clienteNome}</span>
                        </span>
                    )}

                    {/* Nav links desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link key={item.id} href={item.href}>
                                    <button
                                        className={cn(
                                            "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                            active
                                                ? "bg-white/20 text-white"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                                        {item.label}
                                    </button>
                                </Link>
                            );
                        })}
                        <Link href="/">
                            <button className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                <Home className="w-4 h-4" strokeWidth={1.5} />
                                Site
                            </button>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 text-red-300 hover:text-red-200 hover:bg-white/10 transition-all ml-1"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.5} />
                            Sair
                        </button>
                    </nav>
                </div>
            </header>

            {/* ── Welcome banner (mobile only, below header) ── */}
            {clienteNome && (
                <div className="sm:hidden fixed top-[58px] left-0 right-0 z-40 px-4 py-2 text-center text-white/90 text-xs" style={{ background: "#243758" }}>
                    Bem-vindo(a), <span className="font-semibold text-white">{clienteNome}</span>
                </div>
            )}

            {/* ── Sidebar Direita (Desktop) ── */}
            <aside className="hidden lg:flex fixed right-0 top-[68px] bottom-0 w-48 bg-background border-l border-muted flex-col items-start justify-start py-6 px-4 z-40 overflow-y-auto">
                {/* Resumo rápido XP */}
                {dashboard && (
                    <div className="flex flex-col gap-3 w-full">
                        {/* Saldo */}
                        <div className="bg-muted/15 rounded-lg p-3 border border-muted/40">
                            <div className="flex items-center gap-2 mb-1">
                                <Coins className="w-4 h-4 text-accent" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-muted-foreground">Disponível</span>
                            </div>
                            <p className="text-lg font-semibold text-accent">{dashboard.saldoDisponivel.toLocaleString()} XP</p>
                            <p className="text-xs text-muted-foreground">R$ {dashboard.valorEmReais.toFixed(2)}</p>
                        </div>

                        {/* Status resgate */}
                        <div className="bg-muted/15 rounded-lg p-3 border border-muted/40">
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-4 h-4 text-accent" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-muted-foreground">Resgate</span>
                            </div>
                            {dashboard.podeResgatar ? (
                                <p className="text-sm font-medium text-green-600">Liberado!</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Faltam {Math.max(0, dashboard.xpMinimoResgate - dashboard.saldoQualificavel).toLocaleString()} XP qualif.
                                </p>
                            )}
                        </div>

                        {/* Alerta expiração */}
                        {dashboard.pontosExpirar.length > 0 && (
                            <div className="bg-muted/15 rounded-lg p-3 border border-muted/40">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                    <span className="text-xs font-medium text-amber-600">Expirando</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {dashboard.pontosExpirar.reduce((s: number, p: any) => s + p.xp, 0).toLocaleString()} XP próximos de expirar
                                </p>
                            </div>
                        )}

                        {/* Aplicar código (atalho) */}
                        <Link href="/minha-conta/dashboard">
                            <div className="bg-muted/15 rounded-lg p-3 border border-muted/40 flex items-center gap-2 hover:bg-muted/25 transition-colors cursor-pointer">
                                <Gift className="w-4 h-4 text-accent" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-accent">Aplicar Código</span>
                            </div>
                        </Link>
                    </div>
                )}
            </aside>

            {/* ── Conteúdo Central ── */}
            <main
                className={cn(
                    "flex-1 overflow-y-auto relative",
                    "pt-[58px] md:pt-[68px]",
                    clienteNome ? "pt-[82px] sm:pt-[58px] md:pt-[68px]" : "",
                    "pb-20 md:pb-8",
                    "lg:mr-48"
                )}
            >
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>

            {/* ── Tab Bar Mobile (fixo no rodapé) ── */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="flex items-center justify-around py-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link key={item.id} href={item.href}>
                                <button className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px]">
                                    <Icon
                                        className={cn("w-5 h-5", active ? "text-accent" : "text-muted-foreground")}
                                        strokeWidth={active ? 2 : 1.5}
                                    />
                                    <span
                                        className={cn(
                                            "text-[10px] leading-tight",
                                            active ? "text-accent font-semibold" : "text-muted-foreground"
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            </Link>
                        );
                    })}
                    <Link href="/">
                        <button className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px]">
                            <Home className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                            <span className="text-[10px] leading-tight text-muted-foreground">Site</span>
                        </button>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px]"
                    >
                        <LogOut className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[10px] leading-tight text-muted-foreground">Sair</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
