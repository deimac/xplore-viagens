/**
 * CustomerLayout – Layout 3 colunas da Minha Conta
 * Espelha a Home: sidebar esquerda (menu), conteúdo central, sidebar direita (resumo/atalhos)
 */
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Receipt,
    UserCheck,
    LogOut,
    ArrowLeft,
    Gift,
    AlertTriangle,
    Trophy,
    Coins,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const [location, navigate] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* ── Sidebar Esquerda (Desktop) ── */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-40 bg-background border-r border-muted flex-col items-end py-8 px-6 z-50">
                {/* Logo */}
                <div className="mb-8 w-full flex justify-end">
                    <Link href="/">
                        <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-auto cursor-pointer" />
                    </Link>
                </div>

                {/* Menu */}
                <div className="flex-1 flex items-center justify-end w-full">
                    <div className="flex flex-col gap-2 bg-muted/15 rounded-lg p-2 border border-muted/40">
                        <nav className="flex flex-col gap-1 w-full">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link key={item.id} href={item.href}>
                                        <button
                                            className={cn(
                                                "w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ml-auto relative group",
                                                active ? "bg-accent" : "hover:bg-muted/40"
                                            )}
                                        >
                                            <Icon
                                                className={cn("w-5 h-5", active ? "text-accent-foreground" : "text-accent")}
                                                strokeWidth={1.5}
                                            />
                                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
                                                {item.label}
                                            </div>
                                        </button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Ações inferiores */}
                <div className="flex flex-col gap-2 w-fit">
                    <div className="bg-muted/15 rounded-lg p-2 border border-muted/40">
                        <Link href="/">
                            <button className="w-10 h-10 rounded-md flex items-center justify-center text-accent hover:bg-muted/40 transition-all duration-300 relative group">
                                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
                                    Voltar ao Site
                                </div>
                            </button>
                        </Link>
                    </div>
                    <div className="bg-muted/15 rounded-lg p-2 border border-muted/40">
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all duration-300 relative group"
                        >
                            <LogOut className="w-5 h-5" strokeWidth={1.5} />
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-destructive shadow-lg">
                                Sair
                            </div>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Sidebar Direita (Desktop) ── */}
            <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-40 bg-background border-l border-muted flex-col items-start justify-center py-8 px-6 z-50">
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
                        <div className="bg-muted/15 rounded-lg p-2 border border-muted/40">
                            <Link href="/minha-conta/dashboard">
                                <button className="w-10 h-10 rounded-md flex items-center justify-center text-accent hover:bg-muted/40 transition-all duration-300 relative group">
                                    <Gift className="w-5 h-5" strokeWidth={1.5} />
                                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
                                        Aplicar Código
                                    </div>
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Mobile Header ── */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-accent text-accent-foreground px-4 py-3 flex items-center justify-between">
                <Link href="/">
                    <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-auto" />
                </Link>

                <div className="flex items-center gap-2">
                    {cliente && (
                        <span className="text-sm font-medium truncate max-w-[120px]">
                            {cliente.nome || cliente.email}
                        </span>
                    )}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-10 h-10 rounded-lg border border-accent-foreground/30 flex items-center justify-center"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-muted shadow-lg p-4 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link key={item.id} href={item.href}>
                                        <button
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "border-2 rounded-lg px-3 py-3 flex items-center gap-2 transition-all font-medium text-xs w-full",
                                                active
                                                    ? "border-accent bg-accent text-accent-foreground"
                                                    : "border-muted/40 bg-muted/15 text-accent"
                                            )}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    </Link>
                                );
                            })}
                            <Link href="/">
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="border-2 border-muted/40 bg-muted/15 text-accent rounded-lg px-3 py-3 flex items-center gap-2 font-medium text-xs w-full"
                                >
                                    <ArrowLeft className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                                    <span>Voltar ao Site</span>
                                </button>
                            </Link>
                            <button
                                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                className="border-2 border-destructive/40 bg-destructive/5 text-destructive rounded-lg px-3 py-3 flex items-center gap-2 font-medium text-xs w-full"
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                                <span>Sair</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Conteúdo Central ── */}
            <main className="lg:ml-40 lg:mr-40 flex-1 overflow-y-auto relative pt-16 lg:pt-0">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
