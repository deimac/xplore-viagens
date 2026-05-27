import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Building2,
    CalendarClock,
    Check,
    ChevronDown,
    Clock3,
    Edit3,
    GripVertical,
    Image,
    MessageSquarePlus,
    Plane,
    RotateCcw,
    Star,
    Trash2,
    X,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReminderPriority = "normal" | "media" | "alta";

type AdminReminder = {
    id: number;
    titulo: string;
    observacoes: string | null;
    origem: string | null;
    prioridade: ReminderPriority;
    prazo: string | null;
    created_at: string | null;
    status: "pendente" | "concluida";
    concluida_em: string | null;
    criador_nome?: string | null;
    conclusao_nome?: string | null;
};

type ReminderSortMode = "manual" | "criacao_recente" | "criacao_antiga";

type ReminderFormState = {
    titulo: string;
    observacoes: string;
    origem: string;
    prioridade: ReminderPriority;
    prazo: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const reminderOriginOptions = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "ligacao", label: "Ligação" },
    { value: "cotacao", label: "Cotação" },
    { value: "operacional", label: "Operacional" },
];

const priorityLabels: Record<ReminderPriority, string> = {
    normal: "Normal",
    media: "Média",
    alta: "Alta",
};

const priorityClasses: Record<ReminderPriority, string> = {
    normal: "bg-slate-100 text-slate-700",
    media: "bg-amber-100 text-amber-800",
    alta: "bg-rose-100 text-rose-800",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeDateOnly(dateValue?: string | null) {
    if (!dateValue) return null;
    const trimmed = String(dateValue).trim();

    const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) return dateOnlyMatch[1];

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDateOnly(dateValue?: string | null) {
    const normalized = normalizeDateOnly(dateValue);
    if (!normalized) return null;

    const parsed = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTargetDate(dateValue?: string | null) {
    const parsed = parseDateOnly(dateValue);
    if (!parsed) return null;

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
    }).format(parsed);
}

function formatDateTime(dateValue?: string | null) {
    if (!dateValue) return "—";

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsed);
}

function getReminderOriginLabel(origin?: string | null) {
    return reminderOriginOptions.find((option) => option.value === origin)?.label ?? "Geral";
}

function createInitialFormState(): ReminderFormState {
    return {
        titulo: "",
        observacoes: "",
        origem: "whatsapp",
        prioridade: "normal",
        prazo: "",
    };
}

// ---------------------------------------------------------------------------
// SortableReminderCard
// ---------------------------------------------------------------------------

type SortableReminderCardProps = {
    reminder: AdminReminder;
    isExpanded: boolean;
    isFirst: boolean;
    isLast: boolean;
    isConcluding: boolean;
    isDeleting: boolean;
    onToggleExpand: () => void;
    onEdit: (reminder: AdminReminder) => void;
    onConclude: (id: number) => void;
    onDelete: (id: number) => void;
    onMoveUp: (id: number) => void;
    onMoveDown: (id: number) => void;
};

function SortableReminderCard({
    reminder,
    isExpanded,
    isFirst,
    isLast,
    isConcluding,
    isDeleting,
    onToggleExpand,
    onEdit,
    onConclude,
    onDelete,
    onMoveUp,
    onMoveDown,
}: SortableReminderCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: reminder.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const dueDate = parseDateOnly(reminder.prazo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate ? dueDate < today : false;
    const formattedDue = formatTargetDate(reminder.prazo);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-xl border bg-white shadow-sm transition-colors ${isDragging ? "z-50 border-orange-400 shadow-lg opacity-90" : "border-slate-200 hover:border-orange-200"}`}
        >
            {/* Compact row (always visible) */}
            <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                onClick={onToggleExpand}
            >
                {/* Drag handle */}
                <button
                    type="button"
                    className="cursor-grab touch-none shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-500"
                    onClick={(e) => e.stopPropagation()}
                    {...attributes}
                    {...listeners}
                    title="Arrastar para reordenar"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {/* Title + badges */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-none">
                        {reminder.titulo}
                    </p>
                    {reminder.origem && (
                        <Badge variant="outline" className="shrink-0 border-slate-200 text-slate-500 text-[11px] px-1.5 py-0">
                            {getReminderOriginLabel(reminder.origem)}
                        </Badge>
                    )}
                    <Badge
                        variant="secondary"
                        className={`${priorityClasses[reminder.prioridade ?? "normal"]} shrink-0 text-[11px] px-1.5 py-0`}
                    >
                        {priorityLabels[reminder.prioridade ?? "normal"]}
                    </Badge>
                    {formattedDue && (
                        <Badge
                            variant="secondary"
                            className={`shrink-0 text-[11px] px-1.5 py-0 ${isOverdue ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}
                        >
                            {formattedDue}
                        </Badge>
                    )}
                </div>

                {/* Right: datetime + direction arrows + chevron */}
                <div className="flex shrink-0 items-center gap-0.5">
                    <span className="hidden sm:block mr-2 text-[11px] text-slate-400">
                        {formatDateTime(reminder.created_at)}
                    </span>
                    <button
                        type="button"
                        className="rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-25"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp(reminder.id);
                        }}
                        disabled={isFirst}
                        title="Mover para cima"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        className="rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-25"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown(reminder.id);
                        }}
                        disabled={isLast}
                        title="Mover para baixo"
                    >
                        <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            {/* Expanded section */}
            {isExpanded && (
                <div className="border-t border-slate-100 px-3 pb-3 pt-2 space-y-2">
                    <p className="block text-[11px] text-slate-400 sm:hidden">
                        {formatDateTime(reminder.created_at)}
                    </p>

                    {isOverdue && (
                        <p className="text-xs font-medium text-rose-600">⚠ Data-alvo vencida</p>
                    )}

                    {!!reminder.observacoes && (
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Detalhes
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{reminder.observacoes}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(reminder)}
                        >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Editar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => onConclude(reminder.id)}
                            disabled={isConcluding}
                        >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Concluir
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:border-rose-200 hover:text-rose-700"
                            onClick={() => onDelete(reminder.id)}
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Excluir
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
    const [, navigate] = useLocation();
    const utils = trpc.useUtils();

    const [formState, setFormState] = useState<ReminderFormState>(createInitialFormState());
    const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
    const [sortMode, setSortMode] = useState<ReminderSortMode>("manual");
    const [expandedReminderIds, setExpandedReminderIds] = useState<number[]>([]);
    const [localPendingReminders, setLocalPendingReminders] = useState<AdminReminder[] | null>(null);

    // Queries
    // @ts-expect-error - tRPC types are generated when server is running
    const propertiesQuery = trpc.properties.listAll.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const travelsQuery = trpc.viagens.list.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const reviewsQuery = trpc.reviews.list.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const slidesQuery = trpc.heroSlides.list.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const remindersQuery = trpc.adminLembretes.list.useQuery({ limit: 40 });

    // Clear optimistic state whenever server data updates
    useEffect(() => {
        setLocalPendingReminders(null);
    }, [remindersQuery.data]);

    const invalidateReminders = useCallback(async () => {
        await utils.adminLembretes.list.invalidate();
    }, [utils]);

    const resetForm = useCallback(() => {
        setFormState(createInitialFormState());
        setEditingReminderId(null);
    }, []);

    // Mutations
    // @ts-expect-error - tRPC types are generated when server is running
    const createReminderMutation = trpc.adminLembretes.create.useMutation({
        onSuccess: async () => {
            resetForm();
            await invalidateReminders();
            toast.success("Lembrete criado com sucesso");
        },
        onError: () => {
            toast.error("Não foi possível salvar o lembrete");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const updateReminderMutation = trpc.adminLembretes.update.useMutation({
        onSuccess: async () => {
            resetForm();
            await invalidateReminders();
            toast.success("Lembrete atualizado com sucesso");
        },
        onError: () => {
            toast.error("Não foi possível atualizar o lembrete");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const concludeReminderMutation = trpc.adminLembretes.concluir.useMutation({
        onSuccess: async () => {
            await invalidateReminders();
            toast.success("Tarefa concluída");
        },
        onError: () => {
            toast.error("Não foi possível concluir a tarefa");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const reopenReminderMutation = trpc.adminLembretes.reabrir.useMutation({
        onSuccess: async () => {
            await invalidateReminders();
            toast.success("Tarefa reaberta");
        },
        onError: () => {
            toast.error("Não foi possível reabrir a tarefa");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteReminderMutation = trpc.adminLembretes.delete.useMutation({
        onSuccess: async () => {
            await invalidateReminders();
            toast.success("Lembrete removido");
        },
        onError: () => {
            toast.error("Não foi possível remover o lembrete");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const reorderMutation = trpc.adminLembretes.reorder.useMutation({
        onSuccess: async () => {
            setLocalPendingReminders(null);
            await invalidateReminders();
        },
        onError: () => {
            setLocalPendingReminders(null);
            toast.error("Não foi possível salvar a nova ordem");
        },
    });

    // Derived data
    const reviews: any[] = (reviewsQuery.data as any)?.json || reviewsQuery.data || [];
    const pendingReviewsCount = reviews.filter((r: any) => r.status === "pending").length;
    const reminders = (remindersQuery.data as AdminReminder[] | undefined) ?? [];

    const { pendingReminders, completedReminders, overdueRemindersCount } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pending = reminders.filter((r) => r.status === "pendente");
        const completed = reminders.filter((r) => r.status === "concluida").slice(0, 6);
        const overdue = pending.filter((r) => {
            const d = parseDateOnly(r.prazo);
            return d ? d < today : false;
        }).length;

        return { pendingReminders: pending, completedReminders: completed, overdueRemindersCount: overdue };
    }, [reminders]);

    // Apply sort on top of server order; local optimistic state takes precedence
    const displayedPendingReminders = useMemo((): AdminReminder[] => {
        if (localPendingReminders !== null) return localPendingReminders;

        if (sortMode === "criacao_recente") {
            return [...pendingReminders].sort((a, b) => {
                const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return tB - tA;
            });
        }
        if (sortMode === "criacao_antiga") {
            return [...pendingReminders].sort((a, b) => {
                const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return tA - tB;
            });
        }
        return pendingReminders; // manual: server sort_order
    }, [pendingReminders, sortMode, localPendingReminders]);

    const isSaving = createReminderMutation.isPending || updateReminderMutation.isPending;
    const isEditing = editingReminderId !== null;

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const list = localPendingReminders ?? pendingReminders;
            const oldIndex = list.findIndex((r) => r.id === active.id);
            const newIndex = list.findIndex((r) => r.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newList = arrayMove(list, oldIndex, newIndex);
            setLocalPendingReminders(newList);
            reorderMutation.mutate({ ids: newList.map((r) => r.id) });
        },
        [localPendingReminders, pendingReminders, reorderMutation],
    );

    const handleMoveUp = useCallback(
        (id: number) => {
            const list = localPendingReminders ?? pendingReminders;
            const index = list.findIndex((r) => r.id === id);
            if (index <= 0) return;
            const newList = arrayMove(list, index, index - 1);
            setLocalPendingReminders(newList);
            reorderMutation.mutate({ ids: newList.map((r) => r.id) });
        },
        [localPendingReminders, pendingReminders, reorderMutation],
    );

    const handleMoveDown = useCallback(
        (id: number) => {
            const list = localPendingReminders ?? pendingReminders;
            const index = list.findIndex((r) => r.id === id);
            if (index === -1 || index >= list.length - 1) return;
            const newList = arrayMove(list, index, index + 1);
            setLocalPendingReminders(newList);
            reorderMutation.mutate({ ids: newList.map((r) => r.id) });
        },
        [localPendingReminders, pendingReminders, reorderMutation],
    );

    const handleSelectReminderForEdit = useCallback((reminder: AdminReminder) => {
        setFormState({
            titulo: reminder.titulo,
            observacoes: reminder.observacoes || "",
            origem: reminder.origem || "whatsapp",
            prioridade: reminder.prioridade ?? "normal",
            prazo: normalizeDateOnly(reminder.prazo) || "",
        });
        setEditingReminderId(reminder.id);
        setTimeout(() => {
            const el = document.getElementById("lembreteTitulo");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.focus();
        }, 50);
    }, []);

    const handleCreateOrUpdateReminder = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const titulo = formState.titulo.trim();
            if (titulo.length < 3) {
                toast.error("Descreva o lembrete com pelo menos 3 caracteres");
                return;
            }

            const payload = {
                titulo,
                observacoes: formState.observacoes.trim() || null,
                origem: formState.origem || null,
                prioridade: formState.prioridade,
                prazo: formState.prazo || null,
            } as const;

            if (editingReminderId) {
                await updateReminderMutation.mutateAsync({ id: editingReminderId, ...payload });
            } else {
                await createReminderMutation.mutateAsync(payload);
            }
        },
        [formState, editingReminderId, updateReminderMutation, createReminderMutation],
    );

    const toggleReminderExpand = useCallback((id: number) => {
        setExpandedReminderIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const stats = [
        {
            title: "Total Hospedagens",
            value: propertiesQuery.data?.length || 0,
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Viagens Ativas",
            value: travelsQuery.data?.length || 0,
            icon: Plane,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Avaliações Pendentes",
            value: pendingReviewsCount,
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Slides Hero",
            value: slidesQuery.data?.filter((s: any) => s.isActive === 1).length || 0,
            icon: Image,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Lembretes Pendentes",
            value: pendingReminders.length,
            icon: CalendarClock,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Visão geral do sistema</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6 items-start">
                    {/* Reminders card */}
                    <Card className="border-orange-100 shadow-sm">
                        <CardHeader className="space-y-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <MessageSquarePlus className="h-5 w-5 text-orange-600" />
                                        {isEditing ? "Editar lembrete" : "Lembretes rápidos do admin"}
                                    </CardTitle>
                                    <CardDescription>
                                        Registre demandas e priorize a fila. Selecione um item para editar.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                                        {pendingReminders.length} pendentes
                                    </Badge>
                                    {overdueRemindersCount > 0 && (
                                        <Badge variant="secondary" className="bg-rose-50 text-rose-700">
                                            {overdueRemindersCount} atrasados
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Form — always visible, all fields */}
                            <form onSubmit={handleCreateOrUpdateReminder} className="space-y-3">
                                {/* Row 1: Lembrete + Origem + Prioridade + Data-alvo */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_140px_148px]">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lembreteTitulo">Lembrete</Label>
                                        <Input
                                            id="lembreteTitulo"
                                            value={formState.titulo}
                                            onChange={(e) =>
                                                setFormState((prev) => ({ ...prev, titulo: e.target.value }))
                                            }
                                            placeholder="Ex.: Ligar para fulano às 14h"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lembreteOrigem">Origem</Label>
                                        <Select
                                            value={formState.origem}
                                            onValueChange={(value) =>
                                                setFormState((prev) => ({ ...prev, origem: value }))
                                            }
                                        >
                                            <SelectTrigger id="lembreteOrigem">
                                                <SelectValue placeholder="Origem" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reminderOriginOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lembretePrioridade">Prioridade</Label>
                                        <Select
                                            value={formState.prioridade}
                                            onValueChange={(value: ReminderPriority) =>
                                                setFormState((prev) => ({ ...prev, prioridade: value }))
                                            }
                                        >
                                            <SelectTrigger id="lembretePrioridade">
                                                <SelectValue placeholder="Prioridade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="media">Média</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lembreteDataAlvo">Data-alvo</Label>
                                        <Input
                                            id="lembreteDataAlvo"
                                            type="date"
                                            value={formState.prazo}
                                            onChange={(e) =>
                                                setFormState((prev) => ({ ...prev, prazo: e.target.value }))
                                            }
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Detalhes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="lembreteDetalhes">Detalhes (opcional)</Label>
                                    <Textarea
                                        id="lembreteDetalhes"
                                        value={formState.observacoes}
                                        onChange={(e) =>
                                            setFormState((prev) => ({ ...prev, observacoes: e.target.value }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault();
                                                e.currentTarget.form?.requestSubmit();
                                            }
                                        }}
                                        placeholder="Cole uma cotação, contexto ou qualquer detalhe relevante…"
                                        className="min-h-[80px]"
                                        disabled={isSaving}
                                    />
                                </div>

                                {/* Row 3: Buttons + sort select */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving
                                            ? "Salvando…"
                                            : isEditing
                                              ? "Salvar alterações"
                                              : "Adicionar lembrete"}
                                    </Button>
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            disabled={isSaving}
                                        >
                                            <X className="mr-1 h-4 w-4" />
                                            Cancelar edição
                                        </Button>
                                    )}
                                    <div className="ml-auto min-w-[200px]">
                                        <Select
                                            value={sortMode}
                                            onValueChange={(value: ReminderSortMode) => setSortMode(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Classificação" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manual">Ordem manual</SelectItem>
                                                <SelectItem value="criacao_recente">Criação: mais recentes</SelectItem>
                                                <SelectItem value="criacao_antiga">Criação: mais antigas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </form>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Pending reminders list */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {displayedPendingReminders.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-orange-900">
                                        Nenhuma pendência registrada. Use o formulário acima para iniciar seu fluxo.
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={displayedPendingReminders.map((r) => r.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {displayedPendingReminders.map((reminder, index) => (
                                                <SortableReminderCard
                                                    key={reminder.id}
                                                    reminder={reminder}
                                                    isExpanded={expandedReminderIds.includes(reminder.id)}
                                                    isFirst={index === 0}
                                                    isLast={index === displayedPendingReminders.length - 1}
                                                    isConcluding={concludeReminderMutation.isPending}
                                                    isDeleting={deleteReminderMutation.isPending}
                                                    onToggleExpand={() => toggleReminderExpand(reminder.id)}
                                                    onEdit={handleSelectReminderForEdit}
                                                    onConclude={(id) => concludeReminderMutation.mutate({ id })}
                                                    onDelete={(id) => deleteReminderMutation.mutate({ id })}
                                                    onMoveUp={handleMoveUp}
                                                    onMoveDown={handleMoveDown}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>

                            {/* Completed reminders */}
                            {completedReminders.length > 0 && (
                                <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Últimas concluídas</h3>
                                            <p className="text-xs text-slate-500">
                                                Reabra rapidamente se algo voltou para a fila.
                                            </p>
                                        </div>
                                        <Clock3 className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div className="space-y-2">
                                        {completedReminders.map((reminder) => (
                                            <div
                                                key={reminder.id}
                                                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {reminder.titulo}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Concluída por {reminder.conclusao_nome || "admin"}
                                                        {reminder.concluida_em
                                                            ? ` • ${new Intl.DateTimeFormat("pt-BR", {
                                                                  day: "2-digit",
                                                                  month: "2-digit",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              }).format(new Date(reminder.concluida_em))}`
                                                            : ""}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="justify-start md:justify-center"
                                                    onClick={() =>
                                                        reopenReminderMutation.mutate({ id: reminder.id })
                                                    }
                                                    disabled={reopenReminderMutation.isPending}
                                                >
                                                    <RotateCcw className="mr-1 h-4 w-4" />
                                                    Reabrir
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right column */}
                    <div className="space-y-6">
                        {pendingReviewsCount > 0 && (
                            <Card className="border-amber-200 bg-amber-50">
                                <CardContent className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-amber-100 text-amber-700 rounded-lg p-2">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-amber-900">
                                                Atenção: você tem {pendingReviewsCount}{" "}
                                                {pendingReviewsCount === 1
                                                    ? "avaliação pendente"
                                                    : "avaliações pendentes"}{" "}
                                                para aprovar.
                                            </p>
                                            <p className="text-sm text-amber-800 mt-1">
                                                Revise as avaliações para manter os depoimentos da home atualizados.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/admin/avaliacoes")}
                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        Ir para avaliações
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Ritmo do dia</CardTitle>
                                <CardDescription>
                                    Use os lembretes para registrar demandas, priorizar a fila e manter o
                                    acompanhamento operacional sem perder contexto.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-slate-600">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="font-medium text-slate-900">Fluxo sugerido</p>
                                    <p className="mt-1">
                                        1. Recebeu demanda. 2. Registra com prioridade. 3. Atualiza sempre que
                                        avançar. 4. Conclui quando executar.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-orange-50 p-4 text-orange-900">
                                    <p className="font-medium">Prioridade imediata</p>
                                    <p className="mt-1">
                                        {overdueRemindersCount > 0
                                            ? `${overdueRemindersCount} lembrete(s) com data-alvo vencida pedem ação agora.`
                                            : "Tudo em dia. Continue assim!"}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="font-medium text-slate-900">Reordenar</p>
                                    <p className="mt-1">
                                        Arraste pelo ícone <GripVertical className="inline h-3.5 w-3.5" /> ou use as setas ↑↓ para ajustar a ordem conforme sua prioridade do momento.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
