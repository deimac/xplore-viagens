/**
 * Extrato XP – histórico completo com filtros, paginação e visual profissional
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    ListFilter,
    Receipt,
    LayoutDashboard,
    HelpCircle,
    Calendar,
    Star,
    Gift,
    CircleHelp,
    X,
    Clock,
    Search,
} from "lucide-react";
import { Link } from "wouter";
import { SectionTitle } from "@/components/SectionTitle";
import { getMovimentacaoPresentation } from "@/lib/xpMovimentacaoPresentation";

const PAGE_SIZES = [20, 50] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export default function ClienteExtrato() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(20);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [tipoId, setTipoId] = useState<string>("all");
    const [somenteQualificaveis, setSomenteQualificaveis] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const tipos = trpc.xp.tiposMovimentacao.useQuery();

    const extrato = trpc.xp.extrato.useQuery({
        page,
        pageSize,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        tipoMovimentacaoId: tipoId !== "all" ? Number(tipoId) : undefined,
        somenteQualificaveis: somenteQualificaveis || undefined,
    });

    const data = extrato.data;
    const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

    const clearFilters = () => {
        setDataInicio("");
        setDataFim("");
        setTipoId("all");
        setSomenteQualificaveis(false);
        setPage(1);
    };

    const hasFilters = !!dataInicio || !!dataFim || tipoId !== "all" || somenteQualificaveis;
    const activeFilterCount = [dataInicio, dataFim, tipoId !== "all" ? tipoId : "", somenteQualificaveis ? "q" : ""].filter(Boolean).length;

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* ── Header centralizado ── */}
            <SectionTitle
                title="Meu"
                highlight="Extrato"
                subtitle="Histórico completo de movimentações XP"
                align="center"
                className="mb-2 sm:mb-4"
                titleClassName="text-2xl sm:text-3xl"
                subtitleClassName="text-sm sm:text-base"
            />

            {/* ── Ações rápidas ── */}
            <div className="flex flex-wrap justify-center gap-2">
                <Link href="/xp-club/dashboard">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/5">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                    </Button>
                </Link>
                <Link href="/xp-club/como-funciona">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Como funciona
                    </Button>
                </Link>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`gap-1.5 text-xs ${!showFilters ? "border-accent/30 text-accent hover:bg-accent/5" : ""}`}
                >
                    <ListFilter className="w-3.5 h-3.5" />
                    Filtros
                    {activeFilterCount > 0 && (
                        <Badge variant={showFilters ? "secondary" : "default"} className="ml-0.5 h-4 min-w-[16px] px-1 text-[10px]">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* ── Painel de filtros ── */}
            {showFilters && (
                <Card className="border-accent/15 bg-accent/[0.02]">
                    <CardContent className="py-4 sm:py-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                                    <Filter className="w-3.5 h-3.5 text-accent" />
                                </div>
                                <span className="text-sm font-medium">Filtrar movimentações</span>
                                <InfoTooltip text="Use os filtros abaixo para encontrar movimentações específicas por data, tipo ou se são qualificáveis." />
                            </div>
                            {hasFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7">
                                    <X className="w-3 h-3" />
                                    Limpar
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                    <Calendar className="w-3 h-3" /> Data início
                                </Label>
                                <Input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                    <Calendar className="w-3 h-3" /> Data fim
                                </Label>
                                <Input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                    <Receipt className="w-3 h-3" /> Tipo
                                </Label>
                                <Select value={tipoId} onValueChange={(v) => { setTipoId(v); setPage(1); }}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Todos os tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os tipos</SelectItem>
                                        {tipos.data?.map((t: any) => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2.5 cursor-pointer text-sm h-9 px-3 rounded-md border bg-background hover:bg-muted/10 transition-colors w-full">
                                    <input
                                        type="checkbox"
                                        checked={somenteQualificaveis}
                                        onChange={(e) => { setSomenteQualificaveis(e.target.checked); setPage(1); }}
                                        className="rounded border-gray-300 text-accent focus:ring-accent"
                                    />
                                    <span className="text-xs">Somente qualificáveis</span>
                                </label>
                            </div>
                        </div>

                        {/* Filtros ativos como tags */}
                        {hasFilters && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dashed border-muted">
                                {dataInicio && <FilterTag label={`A partir de ${formatDate(dataInicio)}`} onRemove={() => { setDataInicio(""); setPage(1); }} />}
                                {dataFim && <FilterTag label={`Até ${formatDate(dataFim)}`} onRemove={() => { setDataFim(""); setPage(1); }} />}
                                {tipoId !== "all" && <FilterTag label={tipos.data?.find((t: any) => String(t.id) === tipoId)?.nome || "Tipo"} onRemove={() => { setTipoId("all"); setPage(1); }} />}
                                {somenteQualificaveis && <FilterTag label="Qualificáveis" onRemove={() => { setSomenteQualificaveis(false); setPage(1); }} />}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Tabela de movimentações ── */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    {extrato.isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-7 h-7 animate-spin text-accent" />
                        </div>
                    ) : data && data.items.length > 0 ? (
                        <>
                            {/* Resumo no topo da tabela */}
                            <div className="px-4 py-3 border-b bg-muted/10 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Receipt className="w-3.5 h-3.5 text-accent" />
                                    <span className="font-medium">{data.total} movimentaç{data.total !== 1 ? "ões" : "ão"}</span>
                                    {hasFilters && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent">Filtrado</Badge>}
                                </div>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(v) => { setPageSize(Number(v) as PageSize); setPage(1); }}
                                >
                                    <SelectTrigger className="h-7 w-[75px] text-xs border-muted">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZES.map((s) => (
                                            <SelectItem key={s} value={String(s)}>{s} / pág</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Desktop: tabela */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/20">
                                            <th className="text-left py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Data</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Tipo</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Descrição</th>
                                            <th className="text-right py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Pontos</th>
                                            <th className="text-center py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Tipo XP</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-[11px] uppercase tracking-wider text-muted-foreground hidden md:table-cell">Vence</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.items.map((mov: any) => <DesktopRow key={mov.id} mov={mov} />)}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: cards */}
                            <div className="sm:hidden divide-y">
                                {data.items.map((mov: any) => <MobileRow key={mov.id} mov={mov} />)}
                            </div>

                            {/* Paginação */}
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/5">
                                <span className="text-xs text-muted-foreground">
                                    Pág. {page} de {totalPages || 1}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {/* Números de página (até 5 visíveis) */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let p: number;
                                        if (totalPages <= 5) {
                                            p = i + 1;
                                        } else if (page <= 3) {
                                            p = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            p = totalPages - 4 + i;
                                        } else {
                                            p = page - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={p}
                                                variant={p === page ? "default" : "ghost"}
                                                size="icon"
                                                className={`h-8 w-8 text-xs ${p === page ? "" : "text-muted-foreground"}`}
                                                onClick={() => setPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Nenhuma movimentação encontrada
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                {hasFilters ? "Tente ajustar seus filtros" : "Suas movimentações aparecerão aqui"}
                            </p>
                            {hasFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 gap-1.5 text-xs">
                                    <X className="w-3 h-3" />
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" className="inline-flex flex-shrink-0" aria-label="Ajuda">
                    <CircleHelp className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-[260px] text-xs leading-relaxed p-3">
                {text}
            </PopoverContent>
        </Popover>
    );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-medium">
            {label}
            <button onClick={onRemove} className="hover:text-accent/70 transition-colors">
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}

function DesktopRow({ mov }: { mov: any }) {
    const isPositive = Number(mov.xp) > 0;
    const view = getMovimentacaoPresentation(mov);
    const isExpiring = mov.data_expiracao && new Date(mov.data_expiracao) < new Date(Date.now() + 30 * 86400000);

    return (
        <tr className="hover:bg-muted/5 transition-colors group">
            {/* Data + ícone */}
            <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                    </span>
                </div>
            </td>
            {/* Tipo */}
            <td className="py-3 px-4">
                <Badge variant="outline" className="text-[11px] font-normal border-muted">
                    {view.titulo || "-"}
                </Badge>
            </td>
            {/* Descrição */}
            <td className="py-3 px-4 max-w-[220px]">
                <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground truncate">{view.descricao || "-"}</p>
                    {view.valor && <p className="text-[11px] text-muted-foreground/70 truncate">{view.valor}</p>}
                </div>
            </td>
            {/* Pontos */}
            <td className="py-3 px-4 text-right whitespace-nowrap">
                <span className={`text-sm font-semibold tabular-nums ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}{Number(mov.xp).toLocaleString("pt-BR")}
                </span>
            </td>
            {/* Tipo XP (Q ou B) */}
            <td className="py-3 px-4 text-center">
                {mov.qualificavel ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" aria-label="Tipo XP">
                                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 cursor-help">
                                    <Star className="w-2.5 h-2.5 mr-0.5" /> Q
                                </Badge>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="text-xs p-2.5 w-auto max-w-[200px]">Qualificável — conta para liberar bônus</PopoverContent>
                    </Popover>
                ) : (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" aria-label="Tipo XP">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-200 text-purple-600 cursor-help">
                                    <Gift className="w-2.5 h-2.5 mr-0.5" /> B
                                </Badge>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="text-xs p-2.5 w-auto max-w-[200px]">Bônus — liberado ao atingir o mínimo</PopoverContent>
                    </Popover>
                )}
            </td>
            {/* Vence */}
            <td className="py-3 px-4 text-xs hidden md:table-cell">
                {mov.data_expiracao ? (
                    <span className={`flex items-center gap-1 ${isExpiring ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        {isExpiring && <Clock className="w-3 h-3" />}
                        {new Date(mov.data_expiracao).toLocaleDateString("pt-BR")}
                    </span>
                ) : (
                    <span className="text-muted-foreground/40">—</span>
                )}
            </td>
        </tr>
    );
}

function MobileRow({ mov }: { mov: any }) {
    const isPositive = Number(mov.xp) > 0;
    const view = getMovimentacaoPresentation(mov);
    const isExpiring = mov.data_expiracao && new Date(mov.data_expiracao) < new Date(Date.now() + 30 * 86400000);

    return (
        <div className="px-4 py-3 hover:bg-muted/5 transition-colors">
            <div className="flex items-start justify-between gap-3">
                {/* Ícone + conteúdo */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{view.titulo}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{view.descricao}</p>
                        {view.valor && <p className="text-[11px] text-muted-foreground/70 truncate">{view.valor}</p>}
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                            </span>
                            {mov.qualificavel ? (
                                <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-0 h-4">
                                    <Star className="w-2 h-2 mr-0.5" /> Q
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-200 text-purple-600 h-4">
                                    <Gift className="w-2 h-2 mr-0.5" /> B
                                </Badge>
                            )}
                            {mov.data_expiracao && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${isExpiring ? "text-amber-600" : "text-muted-foreground/60"}`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(mov.data_expiracao).toLocaleDateString("pt-BR")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Pontos */}
                <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {isPositive ? "+" : ""}{Number(mov.xp).toLocaleString("pt-BR")}
                </span>
            </div>
        </div>
    );
}

function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}
