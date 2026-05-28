import { Search, Bell, Plus, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useMemo } from "react";

// ── Reminder helpers ──────────────────────────────────────────────────────

type ReminderPriority = "normal" | "media" | "alta";

type HeaderReminder = {
    id: number;
    titulo: string;
    prioridade: ReminderPriority;
    prazo: string | null;
    prazo_horario: string | null;
    status: "pendente" | "concluida";
};

const priorityLabels: Record<ReminderPriority, string> = {
    normal: "Normal",
    media: "Média",
    alta: "Alta",
};

const priorityClasses: Record<ReminderPriority, string> = {
    normal: "bg-slate-100 text-slate-600",
    media: "bg-amber-100 text-amber-800",
    alta: "bg-rose-100 text-rose-800",
};

function parsePrazo(dateValue?: string | null, timeValue?: string | null): Date | null {
    if (!dateValue) return null;
    const match = String(dateValue).match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match) return null;
    const normalizedTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeValue || "") ? timeValue : null;
    const d = new Date(`${match[1]}T${normalizedTime || "23:59"}:00`);
    return isNaN(d.getTime()) ? null : d;
}

function formatPrazo(prazo?: string | null, prazoHorario?: string | null): string {
    const d = parsePrazo(prazo, prazoHorario);
    if (!d) return "";
    const dateText = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
    return prazoHorario ? `${dateText} ${prazoHorario}` : dateText;
}

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const [, navigate] = useLocation();
    const userQuery = trpc.auth.me.useQuery();
    const logoutMutation = trpc.auth.logout.useMutation();

    // @ts-expect-error - tRPC types are generated when server is running
    const remindersQuery = trpc.adminLembretes.list.useQuery({ limit: 40 });

    const { dateReminders, overdueCount } = useMemo(() => {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        const all = ((remindersQuery.data as HeaderReminder[] | undefined) ?? [])
            .filter((r) => r.status === "pendente" && r.prazo)
            .filter((r) => {
                const due = parsePrazo(r.prazo, r.prazo_horario);
                if (!due) return false;
                return due.getTime() <= oneHourFromNow.getTime();
            });

        all.sort((a, b) => {
            const dA = parsePrazo(a.prazo, a.prazo_horario);
            const dB = parsePrazo(b.prazo, b.prazo_horario);
            if (!dA && !dB) return 0;
            if (!dA) return 1;
            if (!dB) return -1;
            return dA.getTime() - dB.getTime();
        });

        const overdue = all.filter((r) => {
            const d = parsePrazo(r.prazo, r.prazo_horario);
            return d ? d.getTime() < now.getTime() : false;
        }).length;

        return { dateReminders: all, overdueCount: overdue };
    }, [remindersQuery.data]);

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            toast.success("Logout realizado");
            window.location.href = "/";
        } catch (e) {
            toast.error("Erro ao deslogar");
        }
    };

    const getInitials = (name?: string | null, email?: string | null) => {
        if (name) {
            const parts = name.split(" ");
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return "AD";
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onMenuClick}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
                        disabled
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                {/* New Button */}
                <Button size="sm" className="hidden sm:flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo
                </Button>

                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {dateReminders.length > 0 && (
                                <span
                                    className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white ${overdueCount > 0 ? "bg-rose-500" : "bg-orange-400"}`}
                                >
                                    {dateReminders.length}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 shadow-lg">
                        {/* Header */}
                        <div className="border-b px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">Lembretes com data-alvo</p>
                            <p className="text-xs text-slate-500">
                                {dateReminders.length === 0
                                    ? "Nenhum lembrete em alerta no momento"
                                    : overdueCount > 0
                                        ? `${overdueCount} atrasado${overdueCount > 1 ? "s" : ""} · ${dateReminders.length - overdueCount} próximo${dateReminders.length - overdueCount === 1 ? "" : "s"}`
                                        : `${dateReminders.length} para os próximos 60 min`}
                            </p>
                        </div>

                        {/* List */}
                        {dateReminders.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-slate-400">
                                Nenhum lembrete atrasado ou previsto para os próximos 60 minutos.
                            </div>
                        ) : (
                            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                                {dateReminders.map((r) => {
                                    const d = parsePrazo(r.prazo, r.prazo_horario);
                                    const now = new Date();
                                    const isOverdue = d ? d.getTime() < now.getTime() : false;

                                    return (
                                        <div key={r.id} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium leading-tight text-slate-900 flex-1">
                                                    {r.titulo}
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className={`shrink-0 text-[10px] px-1.5 py-0 ${priorityClasses[r.prioridade ?? "normal"]}`}
                                                >
                                                    {priorityLabels[r.prioridade ?? "normal"]}
                                                </Badge>
                                            </div>
                                            <p
                                                className={`mt-0.5 text-xs font-medium ${isOverdue ? "text-rose-600" : "text-slate-500"}`}
                                            >
                                                {isOverdue ? "⚠ Atrasado — " : ""}
                                                {formatPrazo(r.prazo, r.prazo_horario)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t px-4 py-2">
                            <button
                                type="button"
                                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                onClick={() => navigate("/admin/dashboard")}
                            >
                                Ver todos os lembretes →
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {getInitials(userQuery.data?.name, userQuery.data?.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-medium leading-none">
                                    {userQuery.data?.name || "Admin"}
                                </div>
                                <div className="text-xs text-gray-500 leading-none mt-1">
                                    {userQuery.data?.email}
                                </div>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                            <User className="mr-2 h-4 w-4" />
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
