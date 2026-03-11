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

import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Coins, Clock3, Gift, RefreshCw, Search, Users } from "lucide-react";

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
    const [movTipoOperacao, setMovTipoOperacao] = useState<"all" | "credito" | "debito" | "ajuste">("all");
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

    const movTipoOperacaoParam: "credito" | "debito" | "ajuste" | undefined =
        movTipoOperacao === "all" ? undefined : movTipoOperacao;

    const dashboardQuery = trpc.xpAdmin.dashboard.useQuery({ days: Number(days) || 30 });

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

    const expPreviewQuery = trpc.xpAdmin.expiracao.preview.useQuery();

    const compraMutation = trpc.xpAdmin.compras.registrarManual.useMutation({
        onSuccess: () => {
            toast.success("Compra registrada e XP creditado");
            setCompraValorInput("");
            setCompraDescricao("");
            void Promise.all([
                dashboardQuery.refetch(),
                movQuery.refetch(),
                clientesQuery.refetch(),
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
            void dashboardQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao criar código"),
    });

    const codigoToggleMutation = trpc.xpAdmin.codigos.toggle.useMutation({
        onSuccess: () => {
            void codigosQuery.refetch();
            void dashboardQuery.refetch();
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
            void dashboardQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao salvar configuração"),
    });

    const runExpMutation = trpc.xpAdmin.expiracao.run.useMutation({
        onSuccess: (data: any) => {
            toast.success(`Expiração executada: ${data.totalClientes} clientes / ${data.totalXpDebitado} XP`);
            void Promise.all([
                expPreviewQuery.refetch(),
                dashboardQuery.refetch(),
                movQuery.refetch(),
                clientesQuery.refetch(),
            ]);
        },
        onError: (err: any) => toast.error(err?.message || "Erro ao rodar expiração"),
    });

    const clientesData = (clientesQuery.data as any)?.json || clientesQuery.data || {};
    const movData = (movQuery.data as any)?.json || movQuery.data || {};
    const parceirosData = (parceirosQuery.data as any)?.json || parceirosQuery.data || [];
    const codigosData = (codigosQuery.data as any)?.json || codigosQuery.data || [];
    const configData = (configQuery.data as any)?.json || configQuery.data || [];
    const expPreviewData = (expPreviewQuery.data as any)?.json || expPreviewQuery.data || { totalClientes: 0, totalXp: 0, clientes: [] };
    const dashboard = (dashboardQuery.data as any)?.json || dashboardQuery.data || {};
    const tiposMovimentacao = (tiposMovQuery.data as any)?.json || tiposMovQuery.data || [];
    const tiposMovimentacaoManual = tiposMovimentacao.filter((tipo: any) => {
        const flag = tipo.exibir_no_lancamento_manual ?? tipo.exibirNoLancamentoManual;
        return flag !== 0 && flag !== false;
    });

    const clientes = (clientesData as any)?.items || [];
    const clientesLimitados = clientes.slice(0, 50);
    const movItems = (movData as any)?.items || [];
    const parceiros = (parceirosData as any) || [];
    const parceirosLimitados = parceiros.slice(0, 50);
    const codigos = (codigosData as any) || [];
    const configs = (configData as any) || [];
    const expPreview = (expPreviewData as any) || { totalClientes: 0, totalXp: 0, clientes: [] };

    const parceiroSelecionado =
        codigoForm.idParceiro === "none"
            ? null
            : parceiros.find((partner: any) => String(partner.id) === String(codigoForm.idParceiro)) || null;

    const clienteSelecionado = useMemo(() => {
        if (!compraClienteId) return null;
        return clientes.find((c: any) => Number(c.id) === compraClienteId) || null;
    }, [clientes, compraClienteId]);

    const tipoSelecionado = tiposMovimentacao.find((t: any) => String(t.id) === compraTipoMovimentacaoId) || null;
    const saldoQualificavelSelecionado = Number(clienteSelecionado?.saldo_qualificavel || 0);
    const xpManualNumber = Number(compraXpInput.replace(/\D/g, "")) || 0;
    const debitoPercent = saldoQualificavelSelecionado > 0
        ? Math.min(100, Math.round((xpManualNumber / saldoQualificavelSelecionado) * 100))
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
        if (tipoSelecionado?.tipo_operacao === "debito" && xpManual > saldoQualificavelSelecionado) {
            toast.error("XP informado excede o saldo qualificável do cliente");
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
            toast.error("Dias de expiração inválidos");
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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">XP Club</h1>
                        <p className="text-muted-foreground mt-1">Dashboard e controle completo de movimentações, códigos, parceiros e expiração.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="days">Período (dias)</Label>
                        <Input
                            id="days"
                            value={days}
                            onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 3))}
                            className="w-24"
                            title="Período em dias"
                        />
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">Saldo líquido</CardDescription>
                            <CardTitle className="text-lg flex items-center gap-2"><Coins className="h-4 w-4 text-blue-600" />{Number(dashboard.saldoLiquido || 0)} XP</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">XP para expirar</CardDescription>
                            <CardTitle className="text-lg flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-600" />{Number(dashboard.pontosExpirar || 0)} XP</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">Clientes</CardDescription>
                            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" />{Number(dashboard.clientesAtivos || 0)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">Créditos período</CardDescription>
                            <CardTitle className="text-lg text-blue-600">{Number(dashboard.periodo?.totalCredito || 0)} XP</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">Débitos período</CardDescription>
                            <CardTitle className="text-lg text-red-600">{Number(dashboard.periodo?.totalDebito || 0)} XP</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="py-3 px-4">
                            <CardDescription className="text-xs">Códigos ativos/usos</CardDescription>
                            <CardTitle className="text-lg flex items-center gap-2"><Gift className="h-4 w-4 text-purple-600" />{Number(dashboard.codigosAtivos || 0)} / {Number(dashboard.usosCodigosPeriodo || 0)}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Tabs defaultValue="movimentacoes" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                        <TabsTrigger value="compras">Lançar pontos</TabsTrigger>
                        <TabsTrigger value="codigos">Códigos</TabsTrigger>
                        <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
                        <TabsTrigger value="config">Config</TabsTrigger>
                        <TabsTrigger value="expiracao">Expiração</TabsTrigger>
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
                                                if (value === "all" || value === "credito" || value === "debito" || value === "ajuste") {
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
                                                <SelectItem value="ajuste">Ajuste</SelectItem>
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
                                    <table className="w-full min-w-[980px] text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Data</th>
                                                <th className="text-left px-3 py-2">Cliente</th>
                                                <th className="text-left px-3 py-2">Tipo</th>
                                                <th className="text-left px-3 py-2">Descrição</th>
                                                <th className="text-right px-3 py-2">XP</th>
                                                <th className="text-right px-3 py-2">Saldo após</th>
                                                <th className="text-right px-3 py-2">R$ ref.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movQuery.isLoading ? (
                                                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Carregando...</td></tr>
                                            ) : movItems.length === 0 ? (
                                                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sem movimentações para os filtros.</td></tr>
                                            ) : (
                                                movItems.map((row: any) => (
                                                    <tr key={row.id} className="border-t">
                                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(row.data_movimentacao).toLocaleString("pt-BR")}</td>
                                                        <td className="px-3 py-2">{row.cliente_nome}</td>
                                                        <td className="px-3 py-2">
                                                            <Badge variant={row.tipo_operacao === "credito" ? "default" : row.tipo_operacao === "debito" ? "destructive" : "secondary"}>{row.tipo_nome}</Badge>
                                                        </td>
                                                        <td className="px-3 py-2">{row.descricao || "-"}</td>
                                                        <td className={`px-3 py-2 text-right font-medium ${Number(row.xp) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{Number(row.xp) >= 0 ? "+" : ""}{Number(row.xp)}</td>
                                                        <td className="px-3 py-2 text-right">{Number(row.saldo_apos || 0)}</td>
                                                        <td className="px-3 py-2 text-right">{row.valor_referencia ? formatCurrency(Number(row.valor_referencia)) : "-"}</td>
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
                                                detail: `${c.email || "sem email"} • CPF: ${c.cpf || "-"} • Saldo: ${Number(c.saldo_xp || 0)} XP • Qualificável: ${Number(c.saldo_qualificavel || 0)} XP`,
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
                                                <p>Disponivel para debito (qualificavel): {saldoQualificavelSelecionado.toLocaleString("pt-BR")} XP</p>
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
                                                            const xpValue = Math.round((saldoQualificavelSelecionado * percent) / 100);
                                                            setCompraXpInput(String(xpValue));
                                                        }}
                                                        className="w-full"
                                                        disabled={saldoQualificavelSelecionado <= 0}
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
                                                        const max = saldoQualificavelSelecionado;
                                                        const nextNumber = Number(next || 0);
                                                        setCompraXpInput(String(Math.min(max, nextNumber)));
                                                        return;
                                                    }
                                                    setCompraXpInput(next);
                                                }}
                                                placeholder={
                                                    tipoSelecionado?.tipo_operacao === "debito"
                                                        ? `Max: ${saldoQualificavelSelecionado.toLocaleString("pt-BR")} XP`
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
                                    <Label>Data expiração (opcional)</Label>
                                    <Input type="date" value={codigoForm.dataExpiracao} onChange={(e) => setCodigoForm((p) => ({ ...p, dataExpiracao: e.target.value }))} title="Data de expiração" />
                                </div>
                                <div>
                                    <Label>Dias expiração XP (opcional)</Label>
                                    <Input value={codigoForm.diasExpiracao} onChange={(e) => setCodigoForm((p) => ({ ...p, diasExpiracao: e.target.value.replace(/\D/g, "") }))} placeholder="Ex: 90" title="Dias de expiração do XP desse código" />
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
                                                <th className="text-left px-3 py-2">Expiração</th>
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
                                <CardDescription>Ex.: `xp_por_real_compra`, `xp_valor_reais`, `xp_minimo_resgate`, `xp_alerta_expiracao_dias`.</CardDescription>
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tipos de movimentação</CardTitle>
                                <CardDescription>Defina quais tipos aparecem no lançamento manual de XP.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Tipo</th>
                                                <th className="text-left px-3 py-2">Operação</th>
                                                <th className="text-left px-3 py-2">Qualificável</th>
                                                <th className="text-right px-3 py-2">Exibir no manual</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tiposMovimentacao.map((tipo: any) => (
                                                <tr key={tipo.id} className="border-t">
                                                    <td className="px-3 py-2 font-medium">{tipo.nome}</td>
                                                    <td className="px-3 py-2">{tipo.tipo_operacao}</td>
                                                    <td className="px-3 py-2">{tipo.qualificavel ? "Sim" : "Nao"}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        <div className="flex justify-end">
                                                            <Switch
                                                                checked={!!(tipo.exibir_no_lancamento_manual ?? tipo.exibirNoLancamentoManual)}
                                                                onCheckedChange={(checked) =>
                                                                    tipoExibicaoMutation.mutate({
                                                                        id: Number(tipo.id),
                                                                        exibirNoLancamentoManual: checked,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="expiracao" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Expiração automática</CardTitle>
                                <CardDescription>Visualize pendências e rode o débito automático de XP expirado.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Clientes pendentes</p>
                                        <p className="text-2xl font-semibold">{Number(expPreview.totalClientes || 0)}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">XP pendente para debitar</p>
                                        <p className="text-2xl font-semibold">{Number(expPreview.totalXp || 0)} XP</p>
                                    </div>
                                    <div className="rounded-lg border p-4 flex items-center justify-center">
                                        <Button onClick={() => runExpMutation.mutate()} disabled={runExpMutation.isPending} className="w-full" title="Rodar expiração automática">
                                            <RefreshCw className={`h-4 w-4 mr-2 ${runExpMutation.isPending ? "animate-spin" : ""}`} />
                                            {runExpMutation.isPending ? "Executando..." : "Rodar expiração agora"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="text-left px-3 py-2">Cliente</th>
                                                <th className="text-left px-3 py-2">Email</th>
                                                <th className="text-right px-3 py-2">XP pendente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expPreview.clientes?.length ? (
                                                expPreview.clientes.map((row: any) => (
                                                    <tr key={row.id_cliente} className="border-t">
                                                        <td className="px-3 py-2">{row.cliente_nome}</td>
                                                        <td className="px-3 py-2">{row.cliente_email}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-red-600">{Number(row.pendente || 0)} XP</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Nenhuma pendência de expiração no momento.</td>
                                                </tr>
                                            )}
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
