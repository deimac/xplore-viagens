import { useMemo, useState } from "react";
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
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  Image,
  MessageSquarePlus,
  Plane,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";

type ReminderPriority = "normal" | "media" | "alta";

type AdminReminder = {
  id: number;
  titulo: string;
  observacoes: string | null;
  origem: string | null;
  prioridade: ReminderPriority;
  prazo: string | null;
  status: "pendente" | "concluida";
  concluida_em: string | null;
  criador_nome?: string | null;
  conclusao_nome?: string | null;
};

type ReminderFormState = {
  titulo: string;
  observacoes: string;
  origem: string;
  prioridade: ReminderPriority;
  prazo: string;
};

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
  if (!parsed) return "Sem data-alvo";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [formState, setFormState] = useState<ReminderFormState>(createInitialFormState());
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

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

  const invalidateReminders = async () => {
    await utils.adminLembretes.list.invalidate();
  };

  const resetForm = () => {
    setFormState(createInitialFormState());
    setEditingReminderId(null);
    setShowAdvancedFields(false);
  };

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

  const reviews: any[] = (reviewsQuery.data as any)?.json || reviewsQuery.data || [];
  const pendingReviewsCount = reviews.filter((r: any) => r.status === "pending").length;
  const reminders = (remindersQuery.data as AdminReminder[] | undefined) ?? [];

  const { pendingReminders, completedReminders, overdueRemindersCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = reminders.filter((reminder) => reminder.status === "pendente");
    const completed = reminders.filter((reminder) => reminder.status === "concluida").slice(0, 6);
    const overdue = pending.filter((reminder) => {
      const dueDate = parseDateOnly(reminder.prazo);
      return dueDate ? dueDate < today : false;
    }).length;

    return {
      pendingReminders: pending,
      completedReminders: completed,
      overdueRemindersCount: overdue,
    };
  }, [reminders]);

  const isSaving = createReminderMutation.isPending || updateReminderMutation.isPending;
  const isEditing = editingReminderId !== null;

  const handleSelectReminderForEdit = (reminder: AdminReminder) => {
    setFormState({
      titulo: reminder.titulo,
      observacoes: reminder.observacoes || "",
      origem: reminder.origem || "whatsapp",
      prioridade: reminder.prioridade || "normal",
      prazo: normalizeDateOnly(reminder.prazo) || "",
    });
    setEditingReminderId(reminder.id);
    setShowAdvancedFields(true);
  };

  const handleCreateOrUpdateReminder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const titulo = formState.titulo.trim();
    if (titulo.length < 3) {
      toast.error("Descreva a demanda com pelo menos 3 caracteres");
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
      await updateReminderMutation.mutateAsync({
        id: editingReminderId,
        ...payload,
      });
      return;
    }

    await createReminderMutation.mutateAsync(payload);
  };

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
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquarePlus className="h-5 w-5 text-orange-600" />
                    {isEditing ? "Editar lembrete" : "Lembretes rápidos do admin"}
                  </CardTitle>
                  <CardDescription>
                    Cole uma cotação completa ou registre uma tarefa. Selecione um item da lista para atualizar quando quiser.
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

              <form onSubmit={handleCreateOrUpdateReminder} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lembreteTitulo">Resumo da demanda</Label>
                  <Textarea
                    id="lembreteTitulo"
                    value={formState.titulo}
                    onChange={(event) => setFormState((prev) => ({ ...prev, titulo: event.target.value }))}
                    placeholder="Ex.: Cliente João pediu cotação para Cancún com saída em agosto..."
                    className="min-h-[120px]"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-slate-500">Dica: use Ctrl+Enter (ou Cmd+Enter no Mac) para salvar rapidamente.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar lembrete"}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                      <X className="mr-1 h-4 w-4" />
                      Cancelar edição
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-slate-700"
                    onClick={() => setShowAdvancedFields((prev) => !prev)}
                  >
                    {showAdvancedFields ? (
                      <>
                        <ChevronUp className="mr-1 h-4 w-4" />
                        Ocultar detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-4 w-4" />
                        Mostrar detalhes
                      </>
                    )}
                  </Button>
                </div>

                {showAdvancedFields && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="lembreteOrigem">Origem</Label>
                      <Select
                        value={formState.origem}
                        onValueChange={(value) => setFormState((prev) => ({ ...prev, origem: value }))}
                      >
                        <SelectTrigger id="lembreteOrigem">
                          <SelectValue placeholder="Origem" />
                        </SelectTrigger>
                        <SelectContent>
                          {reminderOriginOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lembretePrioridade">Prioridade</Label>
                      <Select
                        value={formState.prioridade}
                        onValueChange={(value: ReminderPriority) => setFormState((prev) => ({ ...prev, prioridade: value }))}
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

                    <div className="space-y-2">
                      <Label htmlFor="lembreteDataAlvo">Data-alvo</Label>
                      <Input
                        id="lembreteDataAlvo"
                        type="date"
                        value={formState.prazo}
                        onChange={(event) => setFormState((prev) => ({ ...prev, prazo: event.target.value }))}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-slate-500">Quando agir, responder ou executar.</p>
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="lembreteObservacoes">Observações</Label>
                      <Textarea
                        id="lembreteObservacoes"
                        value={formState.observacoes}
                        onChange={(event) => setFormState((prev) => ({ ...prev, observacoes: event.target.value }))}
                        placeholder="Complementos da negociação, histórico de retorno ou detalhes do pedido"
                        className="min-h-[96px]"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </form>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {pendingReminders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-orange-900">
                    Nenhuma pendência registrada. Cole uma demanda acima para iniciar seu fluxo.
                  </div>
                ) : (
                  pendingReminders.map((reminder) => {
                    const dueDate = parseDateOnly(reminder.prazo);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isOverdue = dueDate ? dueDate < today : false;

                    return (
                      <div
                        key={reminder.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors hover:border-orange-200"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{reminder.titulo}</p>
                              <Badge variant="outline" className="border-slate-200 text-slate-600">
                                {getReminderOriginLabel(reminder.origem)}
                              </Badge>
                              <Badge variant="secondary" className={priorityClasses[reminder.prioridade || "normal"]}>
                                {priorityLabels[reminder.prioridade || "normal"]}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={isOverdue ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}
                              >
                                {formatTargetDate(reminder.prazo)}
                              </Badge>
                            </div>
                            {!!reminder.observacoes && (
                              <p className="whitespace-pre-wrap text-xs text-slate-600">{reminder.observacoes}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>Criado por {reminder.criador_nome || "admin"}</span>
                              {isOverdue && <span className="font-medium text-rose-600">Data-alvo vencida</span>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectReminderForEdit(reminder)}
                            >
                              <Edit3 className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => concludeReminderMutation.mutate({ id: reminder.id })}
                              disabled={concludeReminderMutation.isPending}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Concluir
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => deleteReminderMutation.mutate({ id: reminder.id })}
                              disabled={deleteReminderMutation.isPending}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {completedReminders.length > 0 && (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Últimas concluídas</h3>
                      <p className="text-xs text-slate-500">Reabra rapidamente se algo voltou para a fila.</p>
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
                          <p className="text-sm font-medium text-slate-800">{reminder.titulo}</p>
                          <p className="text-xs text-slate-500">
                            Concluída por {reminder.conclusao_nome || "admin"}{" "}
                            {reminder.concluida_em
                              ? `• ${new Intl.DateTimeFormat("pt-BR", {
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
                          onClick={() => reopenReminderMutation.mutate({ id: reminder.id })}
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
                        {pendingReviewsCount === 1 ? "avaliação pendente" : "avaliações pendentes"} para aprovar.
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
                  Use os lembretes para registrar demandas, priorizar a fila e manter o acompanhamento operacional sem perder contexto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">Fluxo sugerido</p>
                  <p className="mt-1">1. Recebeu demanda. 2. Registra com prioridade. 3. Atualiza sempre que avançar. 4. Conclui quando executar.</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4 text-orange-900">
                  <p className="font-medium">Prioridade imediata</p>
                  <p className="mt-1">
                    {overdueRemindersCount > 0
                      ? `${overdueRemindersCount} lembrete(s) com data-alvo vencida pedem ação agora.`
                      : "Sem alertas de data vencida no momento."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
                <CardDescription>Use o menu lateral para navegar pelas diferentes seções do sistema.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
