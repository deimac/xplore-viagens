/**
 * CustomerLayout – Layout 3 colunas da Minha Conta
 * Espelha a Home: sidebar esquerda (menu), conteúdo central, sidebar direita (resumo/atalhos)
 * Header azul gradiente idêntico ao da Home, com mensagem de boas-vindas..
 */
import { ReactNode, useState, useRef, useEffect } from "react";
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
    Menu,
    X,
    Home as HomeIcon,
    Mail,
    Phone,
    MessageCircle,
    Instagram,
    Facebook,
    Linkedin,
    Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CustomerLayoutProps {
    children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
    const [location, navigate] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const clienteQuery = trpc.cliente.me.useQuery();
    const logoutMutation = trpc.clienteAuth.logout.useMutation();
    const dashboardQuery = trpc.xp.dashboard.useQuery(undefined, {
        enabled: !!clienteQuery.data?.cadastroCompleto,
    });
    const { data: companySettings } = trpc.companySettings.get.useQuery();

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
        { id: "home", icon: HomeIcon, label: "Home", href: "/" },
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/xp-club/dashboard" },
        { id: "extrato", icon: Receipt, label: "Extrato", href: "/xp-club/extrato" },
    ];

    const isActive = (href: string) => location === href;

    const cliente = clienteQuery.data;
    const dashboard = dashboardQuery.data;

    // Fechar menu mobile ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        if (mobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [mobileMenuOpen]);

    // Nome de exibição do cliente
    const clienteNome = (cliente as any)?.nome || (cliente as any)?.email || "Cliente";
    const clienteEmail = (cliente as any)?.email || "Sem email";

    const getInitials = (name?: string | null, email?: string | null) => {
        if (name?.trim()) {
            const parts = name.trim().split(" ").filter(Boolean);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        if (email?.trim()) {
            return email.substring(0, 2).toUpperCase();
        }
        return "CL";
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* ── Sidebar Esquerda (Desktop) – igual à Home ── */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-40 bg-background border-r border-muted flex-col items-end py-8 px-6 z-50">
                {/* Flex-1 para centralizar o menu */}
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
                                            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
                            <Link href="/xp-club/dashboard">
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

            {/* ── Conteúdo Central ── */}
            <main className="lg:ml-40 lg:mr-40 flex-1 overflow-y-auto relative">

                {/* ── Top Bar Azul (Desktop) ── */}
                <header
                    className="hidden lg:flex absolute top-0 left-0 right-0 z-40 px-6 md:px-16 py-4 items-center justify-between"
                    style={{ background: "rgb(26, 43, 76)" }}
                >
                    <Link href="/">
                        <img src={APP_LOGO} alt={APP_TITLE} className="h-16 md:h-20 w-auto cursor-pointer" />
                    </Link>

                    {/* Perfil do cliente */}
                    {cliente && (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/30">
                                {(cliente as any)?.avatarUrl ? (
                                    <AvatarImage src={(cliente as any).avatarUrl} alt={clienteNome} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                                    {getInitials((cliente as any)?.nome, (cliente as any)?.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-right">
                                <p className="text-white text-sm font-semibold leading-none">{clienteNome}</p>
                                <p className="text-white/80 text-xs leading-none mt-1">{clienteEmail}</p>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Mobile Header – mesmo estilo da Home ── */}
                <header
                    ref={menuRef}
                    className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
                    style={{ background: "rgba(26, 43, 76, 1)" }}
                >
                    <Link href="/">
                        <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-auto" />
                    </Link>

                    <div className="flex items-center gap-2">
                        {cliente && (
                            <div className="flex items-center gap-2 mr-1">
                                <Avatar className="h-9 w-9 border border-white/30">
                                    {(cliente as any)?.avatarUrl ? (
                                        <AvatarImage src={(cliente as any).avatarUrl} alt={clienteNome} className="object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                                        {getInitials((cliente as any)?.nome, (cliente as any)?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-right max-w-[110px]">
                                    <p className="text-white text-xs font-semibold truncate leading-none">{clienteNome}</p>
                                    <p className="text-white/70 text-[10px] truncate leading-none mt-1">{clienteEmail}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="w-12 h-12 rounded-lg border-2 border-muted bg-card text-accent flex items-center justify-center hover:opacity-90 transition-all"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Dropdown Menu - Grid 2 Colunas (mesmo padrão da Home) */}
                    {mobileMenuOpen && (
                        <div className="absolute top-full right-4 mt-2 bg-card border-2 border-muted rounded-2xl shadow-lg animate-fade-in z-50 p-4 w-[340px]">
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
                                <button
                                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                                    className="border-2 border-destructive/40 bg-destructive/5 text-destructive rounded-lg px-3 py-3 flex items-center gap-2 font-medium text-xs w-full col-span-2"
                                >
                                    <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                                    <span>Sair</span>
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                {/* Conteúdo com padding para o header */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 lg:pt-32">
                    {children}
                </div>

                <footer className="bg-accent text-accent-foreground py-12 px-6 md:px-16 w-full">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold mb-4">Xplore Milhas e Viagens Ltda</h4>
                                <p className="text-sm opacity-80">Cnpj: 57.874.236/0001-74</p>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold mb-4">Onde estamos localizados</h4>
                                <div className="text-sm opacity-80 space-y-1">
                                    <p>Ironberg Bodybuilder Training Center</p>
                                    <p>Av. Colombo, 3234 - Zona 7, Maringa - PR</p>
                                </div>
                            </div>
                            <div className="md:ml-auto">
                                <h4 className="text-lg font-semibold mb-4">Contato</h4>
                                <div className="text-sm space-y-1 opacity-80">
                                    {companySettings?.email && (
                                        <p className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 flex-shrink-0" />
                                            <a href={`mailto:${companySettings.email}`} className="hover:opacity-100 transition-opacity">
                                                {companySettings.email}
                                            </a>
                                        </p>
                                    )}
                                    {companySettings?.phone && (
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                            <a href={`tel:${companySettings.phone.replace(/\D/g, "")}`} className="hover:opacity-100 transition-opacity">
                                                {companySettings.phone}
                                            </a>
                                        </p>
                                    )}
                                    {companySettings?.whatsapp && (
                                        <p className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                            <a
                                                href={`https://wa.me/${companySettings.whatsapp.replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:opacity-100 transition-opacity"
                                            >
                                                WhatsApp: {companySettings.whatsapp}
                                            </a>
                                        </p>
                                    )}
                                    {companySettings?.instagram && (
                                        <p className="flex items-center gap-2">
                                            <Instagram className="w-4 h-4 flex-shrink-0" />
                                            <a
                                                href={companySettings.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:opacity-100 transition-opacity"
                                            >
                                                @xploreviagens
                                            </a>
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        {companySettings?.facebook && (
                                            <a href={companySettings.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                                                <Facebook className="w-4 h-4" />
                                            </a>
                                        )}
                                        {companySettings?.linkedin && (
                                            <a href={companySettings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {companySettings?.twitter && (
                                            <a href={companySettings.twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-accent-foreground/20 pt-8 text-center text-sm opacity-80">
                            <p>&copy; {new Date().getFullYear()} {companySettings?.companyName || "Xplore Viagens"}. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
