import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import SearchableSelect from "@/components/SearchableSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Coins, Clock3, Search, Users, Plus, Pencil, Trash2, Tag, ArrowUpDown, CheckCircle2, XCircle, Calendar, CircleHelp, Award, TrendingDown, DollarSign, ClipboardList, ShoppingCart, Ban, Eye, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyInput(value: string): number | null {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return null;
    return Number(digitsOnly) / 100;
}

function maskCurrencyInput(rawValue: string): string {
    const parsed = parseCurrencyInput(rawValue);
    if (!parsed || Number.isNaN(parsed)) return "";
    return parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export default function XpClubPage() {
    const [days, setDays] = useState("30");
    const [movSearch, setMovSearch] = useState("");
    const [movTipoOperacao, setMovTipoOperacao] = useState<"all" | "credito" | "debito">("all");
    const [movDataInicio, setMovDataInicio] = useState("");
    const [movDataFim, setMovDataFim] = useState("");

    const [clienteSearch, setClienteSearch] = useState("");
    const [compraClienteId, setCompraClienteId] = useState<number | null>(null);
    const [compraTipoMovimentacaoId, setCompraTipoMovimentacaoId] = useState("none");
    const [compraXpInput, setCompraXpInput] = useState("");
    const [compraValorInput, setCompraValorInput] = useState("");
    const [compraDataCompra, setCompraDataCompra] = useState("");
    const [compraCodigoRef, setCompraCodigoRef] = useState("");
    const [compraDescricao, setCompraDescricao] = useState("");

    const [codigoForm, setCodigoForm] = useState({
        idParceiro: "none",
        codigo: "",
        xpBonus: "",
        quantidadeMaxUso: "",
        dataExpiracao: "",
        diasExpiracao: "",
    });

    const [parceiroForm, setParceiroForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        observacoes: "",
    });

    const [cfgForm, setCfgForm] = useState({
        chave: "",
        valor: "",
        descricao: "",
    });

    // ── Pendentes state ──
    const [pendentesStatusFilter, setPendentesStatusFilter] = useState<"all" | "pendente" | "concluida" | "cancelada">("pendente");
    const [pendentesSearch, setPendentesSearch] = useState("");
    const [concluirDialogOpen, setConcluirDialogOpen] = useState(false);
    const [pendenteSelecionada, setPendenteSelecionada] = useState<any | null>(null);
    const [cancelarPendenteId, setCancelarPendenteId] = useState<number | null>(null);
    const [concluirForm, setConcluirForm] = useState({
        tipoMovimentacaoId: "none",
        xpCompra: "",
        valorCompra: "",
        descricao: "",
    });

    const [tipoModalOpen, setTipoModalOpen] = useState(false);
    const [tipoEditando, setTipoEditando] = useState<any | null>(null);
    const [tipoDeleteId, setTipoDeleteId] = useState<number | null>(null);
    const [tipoForm, setTipoForm] = useState({
        nome: "",
        tipoOperacao: "credito" as "credito" | "debito",
        qualificavel: false,
        exibirNoLancamentoManual: true,
        descricao: "",
        diasExpiracao: "",
    });

    const movTipoOperacaoParam: "credito" | "debito" | undefined =
        movTipoOperacao === "all" ? undefined : movTipoOperacao;

    const dashboardResumoQuery = trpc.xpAdmin.dashboardResumo.useQuery(undefined, {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
    const dashboardPeriodoQuery = trpc.xpAdmin.dashboardPeriodo.useQuery({ days: Number(days) || 30 });

    const clientesAptosQuery = trpc.xpAdmin.clientesAptosResgatar.useQuery(undefined, {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
    const topQualificaveisQuery = trpc.xpAdmin.topQualificaveis.useQuery(undefined, {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
    const codigosAVencerQuery = trpc.xpAdmin.codigosAVencer.useQuery(undefined, {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const clientesQuery = trpc.xpAdmin.clientes.list.useQuery({
        search: clienteSearch,
        page: 1,
        pageSize: 100,
    });

    const movQuery = trpc.xpAdmin.movimentacoes.list.useQuery({
        search: movSearch || undefined,
        tipoOperacao: movTipoOperacaoParam,
        dataInicio: movDataInicio || undefined,
        dataFim: movDataFim || undefined,
        page: 1,
        pageSize: 50,
    });

    const tiposMovQuery = trpc.xpAdmin.tiposMovimentacao.list.useQuery();

    const parceirosQuery = trpc.xpAdmin.parceiros.list.useQuery();

    const codigosQuery = trpc.xpAdmin.codigos.list.useQuery();

    const configQuery = trpc.xpAdmin.config.list.useQuery();

    const tipoExibicaoMutation = trpc.xpAdmin.tiposMovimentacao.updateExibicao.useMutation({
        onSuccess: () => {
            void tiposMovQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao atualizar tipo"),
    });

    const tipoCreateMutation = trpc.xpAdmin.tiposMovimentacao.create.useMutation({
        onSuccess: () => {
            toast.success("Tipo criado com sucesso");
            setTipoModalOpen(false);
            resetTipoForm();
            void tiposMovQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao criar tipo"),
    });

    const tipoUpdateMutation = trpc.xpAdmin.tiposMovimentacao.update.useMutation({
        onSuccess: () => {
            toast.success("Tipo atualizado com sucesso");
            setTipoModalOpen(false);
            resetTipoForm();
            void tiposMovQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao atualizar tipo"),
    });

    const tipoDeleteMutation = trpc.xpAdmin.tiposMovimentacao.delete.useMutation({
        onSuccess: (data: any) => {
            const result = data?.json || data;
            if (result?.inativado) {
                toast.success(`Tipo inativado (${result.registros} movimentação(ões) vinculada(s))`);
            } else {
                toast.success("Tipo removido com sucesso");
            }
            setTipoDeleteId(null);
            void tiposMovQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao remover tipo"),
    });

    const reativarTipoMutation = trpc.xpAdmin.tiposMovimentacao.reativar.useMutation({
        onSuccess: () => {
            toast.success("Tipo reativado com sucesso");
            void tiposMovQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao reativar tipo"),
    });

    const compraMutation = trpc.xpAdmin.compras.registrarManual.useMutation({
        onSuccess: () => {
            toast.success("Compra registrada e XP creditado");
            setCompraValorInput("");
            setCompraDescricao("");
            void Promise.all([
                dashboardResumoQuery.refetch(),
                dashboardPeriodoQuery.refetch(),
                movQuery.refetch(),
                clientesQuery.refetch(),
                clientesAptosQuery.refetch(),
                topQualificaveisQuery.refetch(),
            ]);
        },
        onError: (err: any) => {
            toast.error(err?.message || "Erro ao registrar compra");
        },
    });

    const codigoCreateMutation = trpc.xpAdmin.codigos.create.useMutation({
        onSuccess: () => {
            toast.success("Código criado com sucesso");
            setCodigoForm({ idParceiro: "none", codigo: "", xpBonus: "", quantidadeMaxUso: "", dataExpiracao: "", diasExpiracao: "" });
            void codigosQuery.refetch();
            void dashboardResumoQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao criar código"),
    });

    const codigoToggleMutation = trpc.xpAdmin.codigos.toggle.useMutation({
        onSuccess: () => {
            void codigosQuery.refetch();
            void dashboardResumoQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao atualizar código"),
    });

    const parceiroCreateMutation = trpc.xpAdmin.parceiros.create.useMutation({
        onSuccess: () => {
            toast.success("Parceiro criado com sucesso");
            setParceiroForm({ nome: "", email: "", telefone: "", observacoes: "" });
            void parceirosQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao criar parceiro"),
    });

    const parceiroDeleteMutation = trpc.xpAdmin.parceiros.delete.useMutation({
        onSuccess: () => {
            toast.success("Parceiro removido");
            void parceirosQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao remover parceiro"),
    });

    const cfgUpsertMutation = trpc.xpAdmin.config.upsert.useMutation({
        onSuccess: () => {
            toast.success("Configuração salva");
            setCfgForm({ chave: "", valor: "", descricao: "" });
            void configQuery.refetch();
            void dashboardResumoQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao salvar configuração"),
    });

    // ── Pendentes queries / mutations ──
    const pendentesQuery = trpc.xpAdmin.pendentes.list.useQuery({
        status: pendentesStatusFilter === "all" ? undefined : pendentesStatusFilter,
        search: pendentesSearch || undefined,
        page: 1,
        pageSize: 50,
    });

    const pendentesCountQuery = trpc.xpAdmin.pendentes.count.useQuery(undefined, {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    const concluirPendenteMutation = trpc.xpAdmin.pendentes.concluir.useMutation({
        onSuccess: (data: any) => {
            const result = data?.json || data;
            toast.success(`Compra concluída! +${result?.xpGerado || 0} XP creditados`);
            setConcluirDialogOpen(false);
            setPendenteSelecionada(null);
            void Promise.all([
                pendentesQuery.refetch(),
                pendentesCountQuery.refetch(),
                dashboardResumoQuery.refetch(),
                movQuery.refetch(),
            ]);
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao concluir compra pendente"),
    });

    const cancelarPendenteMutation = trpc.xpAdmin.pendentes.cancelar.useMutation({
        onSuccess: () => {
            toast.success("Compra pendente cancelada");
            setCancelarPendenteId(null);
            void Promise.all([
                pendentesQuery.refetch(),
                pendentesCountQuery.refetch(),
            ]);
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao cancelar compra pendente"),
    });

    const clientesData = (clientesQuery.data as any)?.json || clientesQuery.data || {};
    const movData = (movQuery.data as any)?.json || movQuery.data || {};
    const parceirosData = (parceirosQuery.data as any)?.json || parceirosQuery.data || [];
    const codigosData = (codigosQuery.data as any)?.json || codigosQuery.data || [];
    const configData = (configQuery.data as any)?.json || configQuery.data || [];
    const resumo = (dashboardResumoQuery.data as any)?.json || dashboardResumoQuery.data || {};
    const periodo = (dashboardPeriodoQuery.data as any)?.json || dashboardPeriodoQuery.data || {};
    const clientesAptos = (clientesAptosQuery.data as any)?.json || clientesAptosQuery.data || [];
    const topQualificaveis = (topQualificaveisQuery.data as any)?.json || topQualificaveisQuery.data || [];
    const codigosAVencer = (codigosAVencerQuery.data as any)?.json || codigosAVencerQuery.data || [];
    const tiposMovimentacao = (tiposMovQuery.data as any)?.json || tiposMovQuery.data || [];
    const tiposMovimentacaoManual = tiposMovimentacao.filter((tipo: any) => {
        const flag = tipo.exibir_no_lancamento_manual ?? tipo.exibirNoLancamentoManual;
        const ativo = tipo.ativo ?? true;
        return (flag !== 0 && flag !== false) && (ativo !== 0 && ativo !== false);
    });

    const clientes = (clientesData as any)?.items || [];
    const clientesLimitados = clientes.slice(0, 50);
    const movItems = (movData as any)?.items || [];
    const parceiros = (parceirosData as any) || [];
    const parceirosLimitados = parceiros.slice(0, 50);
    const codigos = (codigosData as any) || [];
    const configs = (configData as any) || [];

    const pendentesData = (pendentesQuery.data as any)?.json || pendentesQuery.data || {};
    const pendentesItems = (pendentesData as any)?.items || [];
    const pendentesCount = (pendentesCountQuery.data as any)?.json ?? pendentesCountQuery.data ?? 0;

    const tiposCreditoManual = tiposMovimentacao.filter((t: any) => {
        const ativo = t.ativo ?? true;
        return t.tipo_operacao === 'credito' && (ativo !== 0 && ativo !== false);
    });

    const parceiroSelecionado =
        codigoForm.idParceiro === "none"
            ? null
            : parceiros.find((partner: any) => String(partner.id) === String(codigoForm.idParceiro)) || null;

    const clienteSelecionado = useMemo(() => {
        if (!compraClienteId) return null;
        return clientes.find((c: any) => Number(c.id) === compraClienteId) || null;
    }, [clientes, compraClienteId]);

    const tipoSelecionado = tiposMovimentacao.find((t: any) => String(t.id) === compraTipoMovimentacaoId) || null;
    const saldoResgatavelSelecionado = Number(clienteSelecionado?.saldo_resgatavel || 0);
    const xpManualNumber = Number(compraXpInput.replace(/\D/g, "")) || 0;
    const debitoPercent = saldoResgatavelSelecionado > 0
        ? Math.min(100, Math.round((xpManualNumber / saldoResgatavelSelecionado) * 100))
        : 0;

    const handleRegistrarCompra = () => {
        const valor = parseCurrencyInput(compraValorInput);
        const xpManual = Number(compraXpInput.replace(/\D/g, ""));

        if (!compraClienteId) {
            toast.error("Selecione um cliente");
            return;
        }
        if (compraTipoMovimentacaoId === "none") {
            toast.error("Selecione o tipo de movimentação");
            return;
        }
        if (!Number.isFinite(xpManual) || xpManual <= 0) {
            toast.error("Informe a quantidade de XP");
            return;
        }
        if (tipoSelecionado?.tipo_operacao === "debito" && xpManual > saldoResgatavelSelecionado) {
            toast.error("XP informado excede o saldo resgatável do cliente");
            return;
        }
        if (compraCodigoRef.trim().length > 30) {
            toast.error("Código de referência deve ter no máximo 30 caracteres");
            return;
        }

        compraMutation.mutate({
            clienteId: compraClienteId,
            tipoMovimentacaoId: Number(compraTipoMovimentacaoId),
            xpManual,
            valorReais: valor || undefined,
            dataCompra: compraDataCompra || undefined,
            codigoRef: compraCodigoRef.trim() || undefined,
            descricao: compraDescricao.trim() || undefined,
        });
    };

    const handleCriarCodigo = () => {
        const xpBonus = Number(codigoForm.xpBonus || 0);
        if (!codigoForm.codigo.trim() || codigoForm.codigo.trim().length < 3) {
            toast.error("Código deve ter ao menos 3 caracteres");
            return;
        }
        if (!Number.isFinite(xpBonus) || xpBonus <= 0) {
            toast.error("XP bônus deve ser maior que zero");
            return;
        }

        const quantidadeMaxUso = codigoForm.quantidadeMaxUso ? Number(codigoForm.quantidadeMaxUso) : null;
        if (quantidadeMaxUso !== null && (!Number.isFinite(quantidadeMaxUso) || quantidadeMaxUso <= 0)) {
            toast.error("Quantidade máxima de uso inválida");
            return;
        }

        const diasExpiracao = codigoForm.diasExpiracao ? Number(codigoForm.diasExpiracao) : null;
        if (diasExpiracao !== null && (!Number.isFinite(diasExpiracao) || diasExpiracao <= 0)) {
            toast.error("Dias de vencimento inválidos");
            return;
        }

        if (codigoForm.dataExpiracao && diasExpiracao !== null) {
            toast.error("Informe apenas uma regra: validade do codigo OU dias de vencimento do XP");
            return;
        }

        codigoCreateMutation.mutate({
            idParceiro: codigoForm.idParceiro === "none" ? null : Number(codigoForm.idParceiro),
            codigo: codigoForm.codigo.trim().toUpperCase(),
            xpBonus,
            quantidadeMaxUso,
            dataExpiracao: codigoForm.dataExpiracao || null,
            diasExpiracao,
            ativo: true,
        });
    };

    const handleCriarParceiro = () => {
        if (!parceiroForm.nome.trim() || parceiroForm.nome.trim().length < 2) {
            toast.error("Informe o nome do parceiro");
            return;
        }
        if (parceiroForm.email && !/^\S+@\S+\.\S+$/.test(parceiroForm.email)) {
            toast.error("Email inválido");
            return;
        }

        parceiroCreateMutation.mutate({
            nome: parceiroForm.nome.trim(),
            email: parceiroForm.email.trim() || null,
            telefone: parceiroForm.telefone.replace(/\D/g, "") || null,
            observacoes: parceiroForm.observacoes.trim() || null,
        });
    };

    const openConcluirDialog = (pendente: any) => {
        setPendenteSelecionada(pendente);
        setConcluirForm({
            tipoMovimentacaoId: pendente.id_tipo_movimentacao_credito ? String(pendente.id_tipo_movimentacao_credito) : "none",
            xpCompra: pendente.xp_sugerido ? String(pendente.xp_sugerido) : "",
            valorCompra: pendente.valor_sugerido ? maskCurrencyInput(String(Math.round(Number(pendente.valor_sugerido) * 100))) : "",
            descricao: pendente.descricao_sugerida || "",
        });
        setConcluirDialogOpen(true);
    };

    const handleConcluirPendente = () => {
        if (!pendenteSelecionada) return;
        if (concluirForm.tipoMovimentacaoId === "none") {
            toast.error("Selecione o tipo de crédito");
            return;
        }
        const xp = Number(concluirForm.xpCompra.replace(/\D/g, ""));
        if (!Number.isFinite(xp) || xp <= 0) {
            toast.error("XP da compra deve ser maior que zero");
            return;
        }
        const valor = parseCurrencyInput(concluirForm.valorCompra);
        concluirPendenteMutation.mutate({
            id: pendenteSelecionada.id,
            tipoMovimentacaoId: Number(concluirForm.tipoMovimentacaoId),
            xpCompra: xp,
            valorCompra: valor || undefined,
            descricao: concluirForm.descricao.trim() || undefined,
        });
    };

    const handleSalvarConfig = () => {
        if (!cfgForm.chave.trim() || !cfgForm.valor.trim()) {
            toast.error("Chave e valor são obrigatórios");
            return;
        }
        cfgUpsertMutation.mutate({
            chave: cfgForm.chave.trim(),
            valor: cfgForm.valor.trim(),
            descricao: cfgForm.descricao.trim() || null,
        });
    };

    const resetTipoForm = () => {
        setTipoEditando(null);
        setTipoForm({
            nome: "",
            tipoOperacao: "credito",
            qualificavel: false,
            exibirNoLancamentoManual: true,
            descricao: "",
            diasExpiracao: "",
        });
    };

    const openTipoModal = (tipo?: any) => {
        if (tipo) {
            setTipoEditando(tipo);
            setTipoForm({
                nome: tipo.nome || "",
                tipoOperacao: tipo.tipo_operacao || "credito",
                qualificavel: !!(tipo.qualificavel),
                exibirNoLancamentoManual: !!(tipo.exibir_no_lancamento_manual ?? tipo.exibirNoLancamentoManual),
                descricao: tipo.descricao || "",
                diasExpiracao: tipo.dias_expiracao ? String(tipo.dias_expiracao) : "",
            });
        } else {
            resetTipoForm();
        }
        setTipoModalOpen(true);
    };

    const handleSalvarTipo = () => {
        if (!tipoForm.nome.trim()) {
            toast.error("Informe o nome do tipo");
            return;
        }
        const diasExp = tipoForm.diasExpiracao ? Number(tipoForm.diasExpiracao) : null;
        if (diasExp !== null && (!Number.isFinite(diasExp) || diasExp <= 0)) {
            toast.error("Dias de vencimento inválido");
            return;
        }
        const payload = {
            nome: tipoForm.nome.trim(),
            tipoOperacao: tipoForm.tipoOperacao,
            qualificavel: tipoForm.qualificavel,
            exibirNoLancamentoManual: tipoForm.exibirNoLancamentoManual,
            descricao: tipoForm.descricao.trim() || null,
            diasExpiracao: diasExp,
        };
        if (tipoEditando) {
            tipoUpdateMutation.mutate({ id: Number(tipoEditando.id), ...payload });
        } else {
            tipoCreateMutation.mutate(payload);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">XP Club</h1>
                        <p className="text-muted-foreground text-sm">Programa de fidelidade</p>
                    </div>
                </div>

                {/* Resumo operacional — sem dependência de período */}
                <div className="grid gap-2 grid-cols-4">
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                        <div className="rounded-md bg-blue-500/10 p-2"><Coins className="h-4 w-4 text-blue-600" /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-muted-foreground">Saldo do programa</p>
                                <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Soma de todos os créditos e débitos de XP. Representa o saldo total em circulação no programa.</TooltipContent></Tooltip>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-tight">{Number(resumo.saldoPrograma || 0).toLocaleString("pt-BR")} <span className="text-xs font-normal text-muted-foreground">XP</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                        <div className="rounded-md bg-emerald-500/10 p-2"><Award className="h-4 w-4 text-emerald-600" /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-muted-foreground">Pontos qualificáveis</p>
                                <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Pontos que podem ser usados em resgate, conforme as regras de elegibilidade do tipo de movimentação.</TooltipContent></Tooltip>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-tight">{Number(resumo.pontosQualificaveis || 0).toLocaleString("pt-BR")} <span className="text-xs font-normal text-muted-foreground">XP</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                        <div className="rounded-md bg-amber-500/10 p-2"><Clock3 className="h-4 w-4 text-amber-600" /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-muted-foreground">XP vencendo em breve</p>
                                <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Soma dos créditos que entram na janela de alerta de vencimento configurada no sistema.</TooltipContent></Tooltip>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-tight">{Number(resumo.xpVencendo || 0).toLocaleString("pt-BR")} <span className="text-xs font-normal text-muted-foreground">XP</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                        <div className="rounded-md bg-purple-500/10 p-2"><Users className="h-4 w-4 text-purple-600" /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <p className="text-xs text-muted-foreground">Clientes aptos a resgatar</p>
                                <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Clientes com saldo qualificável ≥ mínimo exigido ({Number(resumo.xpMinimoResgate || 0).toLocaleString("pt-BR")} XP).</TooltipContent></Tooltip>
                            </div>
                            <p className="text-lg font-semibold tabular-nums leading-tight">{Number(resumo.clientesAptosResgatar || 0).toLocaleString("pt-BR")}</p>
                        </div>
                    </div>
                </div>

                {/* Faixa analítica — dependente de período */}
                <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-2">
                    <div className="flex items-center gap-1.5 mr-1">
                        {[
                            { label: "7d", value: "7" },
                            { label: "30d", value: "30" },
                            { label: "90d", value: "90" },
                            { label: "1a", value: "365" },
                        ].map((preset) => (
                            <Button
                                key={preset.value}
                                variant={days === preset.value ? "default" : "ghost"}
                                size="sm"
                                className={`h-6 px-2 text-[11px] ${days === preset.value ? "" : "text-muted-foreground"}`}
                                onClick={() => setDays(preset.value)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-5 text-sm flex-1">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground text-xs">Qualificáveis</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Créditos qualificáveis emitidos no período.</TooltipContent></Tooltip>
                            <span className="font-semibold tabular-nums text-emerald-600">{Number(periodo.pontosQualificaveis || 0).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-orange-400" />
                            <span className="text-muted-foreground text-xs">Não qualif.</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Créditos não qualificáveis (bônus, campanhas) emitidos no período.</TooltipContent></Tooltip>
                            <span className="font-semibold tabular-nums text-orange-600">{Number(periodo.pontosNaoQualificaveis || 0).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-muted-foreground text-xs">Resgates</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Total de XP resgatados pelos clientes no período.</TooltipContent></Tooltip>
                            <span className="font-semibold tabular-nums text-red-600">{Number(periodo.resgatesXp || 0).toLocaleString("pt-BR")} <span className="text-[10px] font-normal text-muted-foreground">XP</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-cyan-500" />
                            <span className="text-muted-foreground text-xs">em R$</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Valor monetário equivalente dos resgates do período (XP × valor por ponto).</TooltipContent></Tooltip>
                            <span className="font-semibold tabular-nums text-cyan-600">{formatCurrency(Number(periodo.resgatesReais || 0))}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            <div className={`h-2 w-2 rounded-full ${Number(periodo.saldoLiquidoPeriodo || 0) >= 0 ? "bg-blue-500" : "bg-red-500"}`} />
                            <span className="text-muted-foreground text-xs">Saldo período</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs">Diferença entre créditos e débitos no período selecionado.</TooltipContent></Tooltip>
                            <span className={`font-semibold tabular-nums ${Number(periodo.saldoLiquidoPeriodo || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>{Number(periodo.saldoLiquidoPeriodo || 0).toLocaleString("pt-BR")}</span>
                        </div>
                    </div>
                </div>

                {/* Listas operacionais */}
                <div className="grid gap-3 grid-cols-3">
                    {/* Clientes aptos a resgatar */}
                    <div className="rounded-lg border bg-card">
                        <div className="flex items-center gap-2 px-4 py-2 border-b">
                            <Users className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-medium">Clientes aptos a resgatar</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Clientes com saldo XP suficiente para solicitar resgate.</TooltipContent></Tooltip>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto">
                            {(clientesAptos as any[]).length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">Nenhum cliente apto no momento</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-card">
                                        <tr className="text-left text-muted-foreground">
                                            <th className="px-3 py-1.5 font-medium">Cliente</th>
                                            <th className="px-3 py-1.5 font-medium text-right">Resgatável</th>
                                            <th className="px-3 py-1.5 font-medium text-right">Valor est.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(clientesAptos as any[]).slice(0, 10).map((c: any) => (
                                            <tr key={c.id} className="border-t border-dashed">
                                                <td className="px-3 py-1.5 truncate max-w-[120px]">{c.nome || c.email}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{Number(c.saldo_resgatavel).toLocaleString("pt-BR")}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{formatCurrency(c.valor_estimado)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Maiores saldos resgatáveis */}
                    <div className="rounded-lg border bg-card">
                        <div className="flex items-center gap-2 px-4 py-2 border-b">
                            <Award className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-medium">Maiores saldos resgatáveis</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Top clientes com os maiores saldos resgatáveis de XP.</TooltipContent></Tooltip>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto">
                            {(topQualificaveis as any[]).length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-card">
                                        <tr className="text-left text-muted-foreground">
                                            <th className="px-3 py-1.5 font-medium">Cliente</th>
                                            <th className="px-3 py-1.5 font-medium text-right">Resgatável</th>
                                            <th className="px-3 py-1.5 font-medium text-right">Valor est.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(topQualificaveis as any[]).map((c: any) => (
                                            <tr key={c.id} className="border-t border-dashed">
                                                <td className="px-3 py-1.5 truncate max-w-[120px]">{c.nome || c.email}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums font-medium">{Number(c.saldo_resgatavel).toLocaleString("pt-BR")}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{formatCurrency(c.valor_estimado)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Códigos a vencer */}
                    <div className="rounded-lg border bg-card">
                        <div className="flex items-center gap-2 px-4 py-2 border-b">
                            <Tag className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs font-medium">Códigos a vencer</span>
                            <Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Códigos promocionais ativos com data de expiração próxima.</TooltipContent></Tooltip>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto">
                            {(codigosAVencer as any[]).length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">Nenhum código vencendo em breve</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-card">
                                        <tr className="text-left text-muted-foreground">
                                            <th className="px-3 py-1.5 font-medium">Código</th>
                                            <th className="px-3 py-1.5 font-medium text-right">XP</th>
                                            <th className="px-3 py-1.5 font-medium text-right">Dias rest.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(codigosAVencer as any[]).map((c: any) => (
                                            <tr key={c.id} className="border-t border-dashed">
                                                <td className="px-3 py-1.5 font-mono">{c.codigo}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums">{Number(c.xp_bonus).toLocaleString("pt-BR")}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums">
                                                    <Badge variant={Number(c.dias_restantes) <= 7 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                                                        {c.dias_restantes}d
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="movimentacoes" className="space-y-3">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                        <TabsTrigger value="compras">Lançar pontos</TabsTrigger>
                        <TabsTrigger value="pendentes" className="relative">
                            Pendentes
                            {Number(pendentesCount) > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                                    {pendentesCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="tipos">Tipos</TabsTrigger>
                        <TabsTrigger value="codigos">Códigos</TabsTrigger>
                        <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
                        <TabsTrigger value="config">Config</TabsTrigger>
                    </TabsList>

                    <TabsContent value="movimentacoes" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Acompanhar movimentações</CardTitle>
                                <CardDescription>Filtros práticos para auditoria operacional.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <Label htmlFor="movSearch">Busca</Label>
                                        <div className="relative">
                                            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                                            <Input id="movSearch" className="pl-9" value={movSearch} onChange={(e) => setMovSearch(e.target.value)} placeholder="Cliente, email, CPF, descrição" title="Buscar movimentações" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Operação</Label>
                                        <Select
                                            value={movTipoOperacao}
                                            onValueChange={(value) => {
                                                if (value === "all" || value === "credito" || value === "debito") {
                                                    setMovTipoOperacao(value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger title="Filtrar por operação">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="credito">Crédito</SelectItem>
                                                <SelectItem value="debito">Débito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="movDataInicio">Data início</Label>
                                        <Input id="movDataInicio" type="date" value={movDataInicio} onChange={(e) => setMovDataInicio(e.target.value)} title="Data inicial" />
                                    </div>
                                    <div>
                                        <Label htmlFor="movDataFim">Data fim</Label>
                                        <Input id="movDataFim" type="date" value={movDataFim} onChange={(e) => setMovDataFim(e.target.value)} title="Data final" />
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full min-w-[1180px] text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Data</th>
                                                <th className="text-left px-3 py-2">Cliente</th>
                                                <th className="text-left px-3 py-2">Tipo</th>
                                                <th className="text-left px-3 py-2">Descrição</th>
                                                <th className="text-left px-3 py-2">Código CRM</th>
                                                <th className="text-left px-3 py-2">Data Compra</th>
                                                <th className="text-right px-3 py-2">Valor Compra</th>
                                                <th className="text-right px-3 py-2">XP</th>
                                                <th className="text-right px-3 py-2">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movQuery.isLoading ? (
                                                <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td></tr>
                                            ) : movItems.length === 0 ? (
                                                <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Sem movimentações para os filtros.</td></tr>
                                            ) : (
                                                movItems.map((row: any) => (
                                                    <tr key={row.id} className="border-t">
                                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(row.data_movimentacao).toLocaleString("pt-BR")}</td>
                                                        <td className="px-3 py-2">{row.cliente_nome}</td>
                                                        <td className="px-3 py-2">
                                                            <Badge variant={row.tipo_operacao === "credito" ? "default" : row.tipo_operacao === "debito" ? "destructive" : "secondary"}>{row.tipo_nome}</Badge>
                                                        </td>
                                                        <td className="px-3 py-2">{row.descricao || "-"}</td>
                                                        <td className="px-3 py-2">{row.codigo_ref || "-"}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{row.data_compra ? new Date(row.data_compra).toLocaleDateString("pt-BR") : "-"}</td>
                                                        <td className="px-3 py-2 text-right">{row.valor_referencia ? formatCurrency(Number(row.valor_referencia)) : "-"}</td>
                                                        <td className={`px-3 py-2 text-right font-medium ${Number(row.xp) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{Number(row.xp) >= 0 ? "+" : ""}{Number(row.xp)}</td>
                                                        <td className="px-3 py-2 text-right">{Number(row.saldo_apos || 0)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="compras" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Lançar pontos manualmente</CardTitle>
                                <CardDescription>Selecione o cliente, o tipo e a quantidade de XP. O valor da compra fica como referência opcional.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <Label>Cliente</Label>
                                        <SearchableSelect
                                            options={clientesLimitados.map((c: any) => ({
                                                id: c.id,
                                                nome: c.nome || "",
                                                detail: `${c.email || "sem email"} • CPF: ${c.cpf || "-"} • Saldo: ${Number(c.saldo_xp || 0)} XP • Resgatável: ${Number(c.saldo_resgatavel || 0)} XP`,
                                            }))}
                                            value={compraClienteId ? String(compraClienteId) : ""}
                                            onChange={(id) => setCompraClienteId(Number(id))}
                                            onSearchChange={setClienteSearch}
                                            placeholder="Selecionar cliente"
                                            searchPlaceholder="Buscar cliente por nome, email ou CPF..."
                                            emptyMessage="Nenhum cliente encontrado."
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label>Tipo de movimentação</Label>
                                            <Select
                                                value={compraTipoMovimentacaoId}
                                                onValueChange={(value) => setCompraTipoMovimentacaoId(value)}
                                            >
                                                <SelectTrigger title="Selecionar tipo de movimentação">
                                                    <SelectValue placeholder="Selecionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Selecione</SelectItem>
                                                    {tiposMovimentacaoManual.map((tipo: any) => (
                                                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                                                            {tipo.nome} ({tipo.tipo_operacao})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {tipoSelecionado?.tipo_operacao === "debito" && (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-2">
                                                <p>Atencao: este tipo debita XP do cliente. O valor informado sera subtraido do saldo.</p>
                                                <p>Disponível para débito (resgatável): {saldoResgatavelSelecionado.toLocaleString("pt-BR")} XP</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px] text-amber-900">
                                                        <span>0%</span>
                                                        <span>{debitoPercent}%</span>
                                                        <span>100%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={debitoPercent}
                                                        onChange={(e) => {
                                                            const percent = Number(e.target.value);
                                                            const xpValue = Math.round((saldoResgatavelSelecionado * percent) / 100);
                                                            setCompraXpInput(String(xpValue));
                                                        }}
                                                        className="w-full"
                                                        disabled={saldoResgatavelSelecionado <= 0}
                                                        title="Percentual do saldo resgatável para débito"
                                                        aria-label="Percentual do saldo resgatável para débito"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <Label htmlFor="xpCompra">Quantidade de XP</Label>
                                            <Input
                                                id="xpCompra"
                                                value={compraXpInput}
                                                onChange={(e) => {
                                                    const next = e.target.value.replace(/\D/g, "");
                                                    if (tipoSelecionado?.tipo_operacao === "debito") {
                                                        const max = saldoResgatavelSelecionado;
                                                        const nextNumber = Number(next || 0);
                                                        setCompraXpInput(String(Math.min(max, nextNumber)));
                                                        return;
                                                    }
                                                    setCompraXpInput(next);
                                                }}
                                                placeholder={
                                                    tipoSelecionado?.tipo_operacao === "debito"
                                                        ? `Max: ${saldoResgatavelSelecionado.toLocaleString("pt-BR")} XP`
                                                        : "Ex: 1500"
                                                }
                                                title="Quantidade de XP"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="valorCompra">Valor da compra (R$) - opcional</Label>
                                            <Input
                                                id="valorCompra"
                                                value={compraValorInput}
                                                onChange={(e) => setCompraValorInput(maskCurrencyInput(e.target.value))}
                                                placeholder="R$ 0,00"
                                                title="Valor da compra"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dataCompra">Data da compra (opcional)</Label>
                                            <Input
                                                id="dataCompra"
                                                type="date"
                                                value={compraDataCompra}
                                                onChange={(e) => setCompraDataCompra(e.target.value)}
                                                title="Data da compra"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="codigoRef">Código de referência (opcional)</Label>
                                            <Input
                                                id="codigoRef"
                                                value={compraCodigoRef}
                                                onChange={(e) => setCompraCodigoRef(e.target.value)}
                                                placeholder="Ex: CRM-12345"
                                                maxLength={30}
                                                title="Código de referência"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="descricaoCompra">Descrição (opcional)</Label>
                                            <Textarea
                                                id="descricaoCompra"
                                                value={compraDescricao}
                                                onChange={(e) => setCompraDescricao(e.target.value)}
                                                placeholder="Ex: Compra presencial em parceiro"
                                                title="Descrição da compra"
                                            />
                                        </div>
                                        <div className="rounded-lg border p-3 text-sm">
                                            <p><span className="text-muted-foreground">Cliente selecionado:</span> {clienteSelecionado ? clienteSelecionado.nome : "nenhum"}</p>
                                            <p><span className="text-muted-foreground">Tipo:</span> {compraTipoMovimentacaoId === "none" ? "-" : tiposMovimentacao.find((t: any) => String(t.id) === compraTipoMovimentacaoId)?.nome || "-"}</p>
                                            <p><span className="text-muted-foreground">XP:</span> {compraXpInput || "0"}</p>
                                            <p><span className="text-muted-foreground">Valor:</span> {compraValorInput || "R$ 0,00"}</p>
                                            <p><span className="text-muted-foreground">Data compra:</span> {compraDataCompra || "-"}</p>
                                            <p><span className="text-muted-foreground">Código ref:</span> {compraCodigoRef || "-"}</p>
                                        </div>
                                        <Button onClick={handleRegistrarCompra} disabled={compraMutation.isPending} className="w-full" title="Registrar compra manual">
                                            {compraMutation.isPending ? "Registrando..." : "Registrar compra e creditar XP"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Compras Pendentes ── */}
                    <TabsContent value="pendentes" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-amber-600" />
                                    Compras Pendentes
                                </CardTitle>
                                <CardDescription>
                                    Quando um resgate é registrado, uma compra pendente é criada automaticamente para que o crédito correspondente seja lançado depois.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <Label>Status</Label>
                                        <Select value={pendentesStatusFilter} onValueChange={(v: any) => setPendentesStatusFilter(v)}>
                                            <SelectTrigger title="Filtrar por status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="pendente">Pendentes</SelectItem>
                                                <SelectItem value="concluida">Concluídas</SelectItem>
                                                <SelectItem value="cancelada">Canceladas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Busca</Label>
                                        <div className="relative">
                                            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                                            <Input className="pl-9" value={pendentesSearch} onChange={(e) => setPendentesSearch(e.target.value)} placeholder="Nome ou email do cliente" title="Buscar pendentes" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full min-w-[900px] text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Status</th>
                                                <th className="text-left px-3 py-2">Cliente</th>
                                                <th className="text-left px-3 py-2">Resgate (XP)</th>
                                                <th className="text-left px-3 py-2">Tipo crédito sugerido</th>
                                                <th className="text-right px-3 py-2">XP sugerido</th>
                                                <th className="text-right px-3 py-2">XP final</th>
                                                <th className="text-left px-3 py-2">Criado em</th>
                                                <th className="text-right px-3 py-2">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendentesQuery.isLoading ? (
                                                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Carregando...
                                                </td></tr>
                                            ) : pendentesQuery.error ? (
                                                <tr><td colSpan={8} className="px-3 py-8 text-center text-red-600">
                                                    Erro ao carregar pendentes: {pendentesQuery.error.message}
                                                </td></tr>
                                            ) : pendentesItems.length === 0 ? (
                                                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                                                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                    <p>Nenhuma compra pendente encontrada.</p>
                                                </td></tr>
                                            ) : (
                                                pendentesItems.map((p: any) => (
                                                    <tr key={p.id} className="border-t">
                                                        <td className="px-3 py-2">
                                                            {p.status === 'pendente' && (
                                                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                                                    <Clock3 className="h-3 w-3 mr-1" />Pendente
                                                                </Badge>
                                                            )}
                                                            {p.status === 'concluida' && (
                                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />Concluída
                                                                </Badge>
                                                            )}
                                                            {p.status === 'cancelada' && (
                                                                <Badge className="bg-red-100 text-red-800 border-red-300">
                                                                    <XCircle className="h-3 w-3 mr-1" />Cancelada
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium">{p.cliente_nome || `Cliente #${p.id_cliente}`}</div>
                                                            <div className="text-xs text-muted-foreground">{p.cliente_email || 'Email não encontrado'}</div>
                                                        </td>
                                                        <td className="px-3 py-2 text-red-600 font-medium">
                                                            -{Math.abs(Number(p.xp_resgate || 0))} XP
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {p.tipo_credito_nome || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-muted-foreground">
                                                            {p.xp_sugerido ? Number(p.xp_sugerido).toLocaleString('pt-BR') : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium text-emerald-600">
                                                            {p.xp_compra ? `+${Number(p.xp_compra).toLocaleString('pt-BR')}` : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">
                                                            {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            {p.status === 'pendente' ? (
                                                                <div className="flex gap-1 justify-end">
                                                                    <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => openConcluirDialog(p)} title="Concluir compra">
                                                                        <ShoppingCart className="h-3 w-3 mr-1" />Concluir
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs" onClick={() => setCancelarPendenteId(p.id)} title="Cancelar pendente">
                                                                        <Ban className="h-3 w-3 mr-1" />Cancelar
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {p.status === 'concluida' && p.concluida_em ? new Date(p.concluida_em).toLocaleDateString('pt-BR') : ''}
                                                                    {p.status === 'cancelada' && p.cancelada_em ? new Date(p.cancelada_em).toLocaleDateString('pt-BR') : ''}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Dialog: Concluir Compra Pendente ── */}
                    <Dialog open={concluirDialogOpen} onOpenChange={(open) => { if (!open) { setConcluirDialogOpen(false); setPendenteSelecionada(null); } }}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                    Concluir compra pendente
                                </DialogTitle>
                                <DialogDescription>
                                    Registrar o crédito de XP correspondente à compra que deu origem ao resgate.
                                </DialogDescription>
                            </DialogHeader>
                            {pendenteSelecionada && (
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                                        <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{pendenteSelecionada.cliente_nome || `Cliente #${pendenteSelecionada.id_cliente}`}</span></p>
                                        <p><span className="text-muted-foreground">Resgate:</span> <span className="text-red-600 font-medium">-{Math.abs(Number(pendenteSelecionada.xp_resgate || 0))} XP</span></p>
                                        <p><span className="text-muted-foreground">Mov. resgate:</span> #{pendenteSelecionada.id_movimentacao_resgate}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <Label>Tipo de crédito</Label>
                                            <Select value={concluirForm.tipoMovimentacaoId} onValueChange={(v) => setConcluirForm(f => ({ ...f, tipoMovimentacaoId: v }))}>
                                                <SelectTrigger title="Selecionar tipo de crédito">
                                                    <SelectValue placeholder="Selecionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Selecione</SelectItem>
                                                    {tiposCreditoManual.map((t: any) => (
                                                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="concluirXp">XP da compra</Label>
                                            <Input id="concluirXp" value={concluirForm.xpCompra} onChange={(e) => setConcluirForm(f => ({ ...f, xpCompra: e.target.value.replace(/\D/g, '') }))} placeholder="Ex: 1500" title="XP da compra" />
                                        </div>
                                        <div>
                                            <Label htmlFor="concluirValor">Valor da compra (R$) - opcional</Label>
                                            <Input id="concluirValor" value={concluirForm.valorCompra} onChange={(e) => setConcluirForm(f => ({ ...f, valorCompra: maskCurrencyInput(e.target.value) }))} placeholder="R$ 0,00" title="Valor da compra" />
                                        </div>
                                        <div>
                                            <Label htmlFor="concluirDesc">Descrição (opcional)</Label>
                                            <Input id="concluirDesc" value={concluirForm.descricao} onChange={(e) => setConcluirForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Pacote Cancún" title="Descrição" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setConcluirDialogOpen(false); setPendenteSelecionada(null); }}>Cancelar</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConcluirPendente} disabled={concluirPendenteMutation.isPending}>
                                    {concluirPendenteMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Processando...</> : <><CheckCircle2 className="h-4 w-4 mr-1" />Concluir e creditar XP</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ── Dialog: Cancelar Pendente ── */}
                    <Dialog open={cancelarPendenteId !== null} onOpenChange={(open) => { if (!open) setCancelarPendenteId(null); }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    <Ban className="h-5 w-5" />
                                    Cancelar compra pendente
                                </DialogTitle>
                                <DialogDescription>
                                    Essa ação não pode ser desfeita. A pendência será marcada como cancelada e nenhum crédito será gerado.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCancelarPendenteId(null)}>Voltar</Button>
                                <Button variant="destructive" onClick={() => { if (cancelarPendenteId) cancelarPendenteMutation.mutate({ id: cancelarPendenteId }); }} disabled={cancelarPendenteMutation.isPending}>
                                    {cancelarPendenteMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Cancelando...</> : 'Confirmar cancelamento'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ── Tipos de Movimentação ── */}
                    <TabsContent value="tipos" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-blue-600" />
                                        Tipos de Movimentação
                                    </CardTitle>
                                    <CardDescription className="mt-1">Gerencie os tipos disponíveis para lançamento de XP.</CardDescription>
                                </div>
                                <Button onClick={() => openTipoModal()} size="sm" title="Novo tipo">
                                    <Plus className="h-4 w-4 mr-1" /> Novo tipo
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {tiposMovimentacao.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p>Nenhum tipo de movimentação cadastrado.</p>
                                        <Button variant="outline" className="mt-3" onClick={() => openTipoModal()} title="Criar primeiro tipo">
                                            <Plus className="h-4 w-4 mr-1" /> Criar primeiro tipo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/40">
                                                <tr>
                                                    <th className="text-left px-3 py-2">Nome</th>
                                                    <th className="text-left px-3 py-2">Operação</th>
                                                    <th className="text-center px-3 py-2">Qualificável</th>
                                                    <th className="text-center px-3 py-2">Manual</th>
                                                    <th className="text-center px-3 py-2">Dias exp.</th>
                                                    <th className="text-left px-3 py-2">Descrição</th>
                                                    <th className="text-right px-3 py-2">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tiposMovimentacao.map((tipo: any) => (
                                                    <tr key={tipo.id} className={`border-t hover:bg-muted/20 transition-colors ${!(tipo.ativo ?? true) || tipo.ativo === 0 ? 'opacity-50' : ''}`}>
                                                        <td className="px-3 py-2 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                {tipo.nome}
                                                                {(!(tipo.ativo ?? true) || tipo.ativo === 0) && (
                                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">Inativo</Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Badge variant={
                                                                tipo.tipo_operacao === "credito" ? "default" : "destructive"
                                                            } className="text-xs">
                                                                {tipo.tipo_operacao === "credito" ? "Crédito" : "Débito"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {tipo.qualificavel ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <Switch
                                                                checked={!!(tipo.exibir_no_lancamento_manual ?? tipo.exibirNoLancamentoManual)}
                                                                onCheckedChange={(checked) =>
                                                                    tipoExibicaoMutation.mutate({
                                                                        id: Number(tipo.id),
                                                                        exibirNoLancamentoManual: checked,
                                                                    })
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-muted-foreground">
                                                            {tipo.dias_expiracao ?? "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                                                            {tipo.descricao || "-"}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" onClick={() => openTipoModal(tipo)} title="Editar tipo">
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                {(!(tipo.ativo ?? true) || tipo.ativo === 0) ? (
                                                                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => {
                                                                        reativarTipoMutation.mutate({ id: Number(tipo.id) });
                                                                    }} title="Reativar tipo">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setTipoDeleteId(Number(tipo.id))} title="Remover tipo">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Modal criar/editar tipo */}
                        <Dialog open={tipoModalOpen} onOpenChange={(open) => { if (!open) { setTipoModalOpen(false); resetTipoForm(); } }}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-blue-600" />
                                        {tipoEditando ? "Editar tipo" : "Novo tipo de movimentação"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {tipoEditando ? "Altere as informações do tipo de movimentação." : "Preencha os dados para criar um novo tipo."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div>
                                        <Label htmlFor="tipoNome">Nome *</Label>
                                        <Input
                                            id="tipoNome"
                                            value={tipoForm.nome}
                                            onChange={(e) => setTipoForm((f) => ({ ...f, nome: e.target.value }))}
                                            placeholder="Ex: Compra de viagem"
                                            maxLength={50}
                                            title="Nome do tipo"
                                        />
                                    </div>
                                    <div>
                                        <Label>Operação *</Label>
                                        <Select
                                            value={tipoForm.tipoOperacao}
                                            onValueChange={(v) => setTipoForm((f) => ({ ...f, tipoOperacao: v as any }))}
                                        >
                                            <SelectTrigger title="Tipo de operação">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credito">Crédito</SelectItem>
                                                <SelectItem value="debito">Débito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="tipoDescricao">Descrição</Label>
                                        <Input
                                            id="tipoDescricao"
                                            value={tipoForm.descricao}
                                            onChange={(e) => setTipoForm((f) => ({ ...f, descricao: e.target.value }))}
                                            placeholder="Descrição opcional do tipo"
                                            maxLength={255}
                                            title="Descrição"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tipoDiasExp">Dias para vencimento</Label>
                                        <Input
                                            id="tipoDiasExp"
                                            value={tipoForm.diasExpiracao}
                                            onChange={(e) => setTipoForm((f) => ({ ...f, diasExpiracao: e.target.value.replace(/\D/g, "") }))}
                                            placeholder="Ex: 365 (vazio = não expira)"
                                            title="Dias para vencimento"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Qualificável</p>
                                            <p className="text-xs text-muted-foreground">XP conta para o saldo qualificável do cliente</p>
                                        </div>
                                        <Switch
                                            checked={tipoForm.qualificavel}
                                            onCheckedChange={(v) => setTipoForm((f) => ({ ...f, qualificavel: v }))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Exibir no lançamento manual</p>
                                            <p className="text-xs text-muted-foreground">Aparece na lista ao lançar XP manualmente</p>
                                        </div>
                                        <Switch
                                            checked={tipoForm.exibirNoLancamentoManual}
                                            onCheckedChange={(v) => setTipoForm((f) => ({ ...f, exibirNoLancamentoManual: v }))}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => { setTipoModalOpen(false); resetTipoForm(); }} title="Cancelar">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSalvarTipo}
                                        disabled={tipoCreateMutation.isPending || tipoUpdateMutation.isPending}
                                        title="Salvar tipo"
                                    >
                                        {(tipoCreateMutation.isPending || tipoUpdateMutation.isPending) ? "Salvando..." : tipoEditando ? "Salvar alterações" : "Criar tipo"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Dialog confirmar exclusão */}
                        <Dialog open={tipoDeleteId !== null} onOpenChange={(open) => { if (!open) setTipoDeleteId(null); }}>
                            <DialogContent className="sm:max-w-sm">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-red-600">
                                        <Trash2 className="h-5 w-5" />
                                        Remover tipo
                                    </DialogTitle>
                                    <DialogDescription>
                                        {(() => {
                                            const tipoParaDeletar = tiposMovimentacao.find((t: any) => Number(t.id) === tipoDeleteId);
                                            return tipoParaDeletar ? (
                                                <>Deseja remover o tipo <strong>"{tipoParaDeletar.nome}"</strong>? Se houver movimentações vinculadas, o tipo será <strong>inativado</strong> em vez de excluído.</>
                                            ) : null;
                                        })()}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setTipoDeleteId(null)} title="Cancelar">
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => tipoDeleteId && tipoDeleteMutation.mutate({ id: tipoDeleteId })}
                                        disabled={tipoDeleteMutation.isPending}
                                        title="Confirmar exclusão"
                                    >
                                        {tipoDeleteMutation.isPending ? "Processando..." : "Remover / Inativar"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="codigos" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Criar código promocional</CardTitle>
                                <CardDescription>Cadastro com validações básicas e vínculo com parceiro.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-3">
                                <div>
                                    <Label>Código</Label>
                                    <Input value={codigoForm.codigo} onChange={(e) => setCodigoForm((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))} placeholder="EX: VERAO2026" title="Código promocional" />
                                </div>
                                <div>
                                    <Label>XP bônus</Label>
                                    <Input value={codigoForm.xpBonus} onChange={(e) => setCodigoForm((p) => ({ ...p, xpBonus: e.target.value.replace(/\D/g, "") }))} placeholder="100" title="XP bônus" />
                                </div>
                                <div>
                                    <Label>Parceiro</Label>
                                    <SearchableSelect
                                        options={[
                                            { id: "none", nome: "Sem parceiro" },
                                            ...parceirosLimitados.map((p: any) => ({
                                                id: p.id,
                                                nome: p.nome || "",
                                                detail: p.email || undefined,
                                            })),
                                        ]}
                                        value={codigoForm.idParceiro}
                                        onChange={(id) => setCodigoForm((prev) => ({ ...prev, idParceiro: id }))}
                                        placeholder="Sem parceiro"
                                        searchPlaceholder="Buscar parceiro..."
                                        emptyMessage="Nenhum parceiro encontrado."
                                    />
                                </div>
                                <div>
                                    <Label>Uso máximo (opcional)</Label>
                                    <Input value={codigoForm.quantidadeMaxUso} onChange={(e) => setCodigoForm((p) => ({ ...p, quantidadeMaxUso: e.target.value.replace(/\D/g, "") }))} placeholder="Ex: 500" title="Quantidade máxima de uso" />
                                </div>
                                <div>
                                    <Label>Validade do codigo (opcional)</Label>
                                    <Input type="date" value={codigoForm.dataExpiracao} onChange={(e) => setCodigoForm((p) => ({ ...p, dataExpiracao: e.target.value }))} title="Data limite para uso do codigo" />
                                </div>
                                <div>
                                    <Label>Dias vencimento XP (opcional)</Label>
                                    <Input value={codigoForm.diasExpiracao} onChange={(e) => setCodigoForm((p) => ({ ...p, diasExpiracao: e.target.value.replace(/\D/g, "") }))} placeholder="Ex: 90" title="Dias de vencimento do XP desse código" />
                                </div>
                                <div className="md:col-span-3">
                                    <Button onClick={handleCriarCodigo} disabled={codigoCreateMutation.isPending} title="Criar código">
                                        {codigoCreateMutation.isPending ? "Salvando..." : "Criar código"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Códigos cadastrados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full min-w-[860px] text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Código</th>
                                                <th className="text-left px-3 py-2">Parceiro</th>
                                                <th className="text-right px-3 py-2">XP</th>
                                                <th className="text-right px-3 py-2">Uso</th>
                                                <th className="text-left px-3 py-2">Vencimento</th>
                                                <th className="text-left px-3 py-2">Status</th>
                                                <th className="text-right px-3 py-2">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {codigos.map((c: any) => (
                                                <tr key={c.id} className="border-t">
                                                    <td className="px-3 py-2 font-medium">{c.codigo}</td>
                                                    <td className="px-3 py-2">{c.parceiro_nome || "-"}</td>
                                                    <td className="px-3 py-2 text-right">{Number(c.xp_bonus || 0)}</td>
                                                    <td className="px-3 py-2 text-right">{Number(c.quantidade_usada || 0)} / {c.quantidade_max_uso ?? "∞"}</td>
                                                    <td className="px-3 py-2">{c.data_expiracao ? new Date(c.data_expiracao).toLocaleDateString("pt-BR") : "-"}</td>
                                                    <td className="px-3 py-2">
                                                        <Badge variant={Number(c.ativo) === 1 ? "default" : "secondary"}>{Number(c.ativo) === 1 ? "Ativo" : "Inativo"}</Badge>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => codigoToggleMutation.mutate({ id: Number(c.id), ativo: Number(c.ativo) !== 1 })}
                                                            disabled={codigoToggleMutation.isPending}
                                                            title="Alternar status do código"
                                                        >
                                                            {Number(c.ativo) === 1 ? "Desativar" : "Ativar"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="parceiros" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Cadastrar parceiro</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <Label>Nome</Label>
                                    <Input value={parceiroForm.nome} onChange={(e) => setParceiroForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome do parceiro" title="Nome do parceiro" />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input value={parceiroForm.email} onChange={(e) => setParceiroForm((p) => ({ ...p, email: e.target.value }))} placeholder="contato@parceiro.com" title="Email do parceiro" />
                                </div>
                                <div>
                                    <Label>Telefone</Label>
                                    <Input value={parceiroForm.telefone} onChange={(e) => setParceiroForm((p) => ({ ...p, telefone: formatPhone(e.target.value) }))} placeholder="(00) 00000-0000" title="Telefone do parceiro" />
                                </div>
                                <div>
                                    <Label>Observações</Label>
                                    <Textarea value={parceiroForm.observacoes} onChange={(e) => setParceiroForm((p) => ({ ...p, observacoes: e.target.value }))} placeholder="Informações extras" title="Observações" />
                                </div>
                                <div className="md:col-span-2">
                                    <Button onClick={handleCriarParceiro} disabled={parceiroCreateMutation.isPending} title="Salvar parceiro">
                                        {parceiroCreateMutation.isPending ? "Salvando..." : "Salvar parceiro"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Parceiros cadastrados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Nome</th>
                                                <th className="text-left px-3 py-2">Email</th>
                                                <th className="text-left px-3 py-2">Telefone</th>
                                                <th className="text-right px-3 py-2">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parceiros.map((p: any) => (
                                                <tr key={p.id} className="border-t">
                                                    <td className="px-3 py-2 font-medium">{p.nome}</td>
                                                    <td className="px-3 py-2">{p.email || "-"}</td>
                                                    <td className="px-3 py-2">{p.telefone || "-"}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        <Button variant="destructive" size="sm" onClick={() => parceiroDeleteMutation.mutate({ id: Number(p.id) })} disabled={parceiroDeleteMutation.isPending} title="Remover parceiro">
                                                            Remover
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="config" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Salvar configuração XP</CardTitle>
                                <CardDescription>Ex.: `xp_por_real_compra`, `xp_valor_reais`, `xp_minimo_resgate`, `xp_alerta_vencimento_dias`.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-3">
                                <div>
                                    <Label>Chave</Label>
                                    <Input value={cfgForm.chave} onChange={(e) => setCfgForm((p) => ({ ...p, chave: e.target.value }))} placeholder="xp_por_real_compra" title="Chave da configuração" />
                                </div>
                                <div>
                                    <Label>Valor</Label>
                                    <Input value={cfgForm.valor} onChange={(e) => setCfgForm((p) => ({ ...p, valor: e.target.value }))} placeholder="1" title="Valor da configuração" />
                                </div>
                                <div>
                                    <Label>Descrição</Label>
                                    <Input value={cfgForm.descricao} onChange={(e) => setCfgForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="XP por real em compra manual" title="Descrição da configuração" />
                                </div>
                                <div className="md:col-span-3">
                                    <Button onClick={handleSalvarConfig} disabled={cfgUpsertMutation.isPending} title="Salvar configuração">
                                        {cfgUpsertMutation.isPending ? "Salvando..." : "Salvar configuração"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Configurações atuais</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Chave</th>
                                                <th className="text-left px-3 py-2">Valor</th>
                                                <th className="text-left px-3 py-2">Descrição</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {configs.map((cfg: any) => (
                                                <tr key={cfg.id} className="border-t">
                                                    <td className="px-3 py-2 font-medium">{cfg.chave}</td>
                                                    <td className="px-3 py-2">{cfg.valor}</td>
                                                    <td className="px-3 py-2">{cfg.descricao || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
