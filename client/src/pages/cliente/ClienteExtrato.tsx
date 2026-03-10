/**
 * Extrato XP – histórico completo com filtros e paginação
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";

const PAGE_SIZES = [20, 50] as const;
type PageSize = typeof PAGE_SIZES[number];

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <SectionTitle
                    title="Meu"
                    highlight="Extrato"
                    subtitle="Histórico completo de movimentações XP"
                    align="center"
                    className="mb-2 sm:mb-4"
                    titleClassName="text-2xl sm:text-3xl"
                    subtitleClassName="text-sm sm:text-base"
                />
                <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                >
                    <ListFilter className="w-4 h-4" />
                    Filtros
                    {hasFilters && (
                        <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
                            !
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Filtros */}
            {showFilters && (
                <Card>
                    <CardHeader className="pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm flex items-center gap-2 text-accent">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <Label className="text-xs">Data início</Label>
                                <Input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => {
                                        setDataInicio(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Data fim</Label>
                                <Input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => {
                                        setDataFim(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Tipo</Label>
                                <Select
                                    value={tipoId}
                                    onValueChange={(v) => {
                                        setTipoId(v);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {tipos.data?.map((t: any) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={somenteQualificaveis}
                                        onChange={(e) => {
                                            setSomenteQualificaveis(e.target.checked);
                                            setPage(1);
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    Somente qualificáveis
                                </label>
                            </div>
                        </div>
                        {hasFilters && (
                            <div className="mt-3">
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                                    Limpar filtros
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {extrato.isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-accent" />
                        </div>
                    ) : data && data.items.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                                Data
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                                                Tipo
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">
                                                Descrição
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                                                Pontos
                                            </th>
                                            <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">
                                                Qualif.
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                                                Expira
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.items.map((mov: any) => {
                                            const isPositive = Number(mov.xp) > 0;
                                            return (
                                                <tr key={mov.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive
                                                                    ? "bg-green-100 text-green-600"
                                                                    : "bg-red-100 text-red-500"
                                                                    }`}
                                                            >
                                                                {isPositive ? (
                                                                    <ArrowUpRight className="w-3 h-3" />
                                                                ) : (
                                                                    <ArrowDownRight className="w-3 h-3" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs">
                                                                {new Date(
                                                                    mov.data_movimentacao
                                                                ).toLocaleDateString("pt-BR")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="text-[11px] font-normal">
                                                            {mov.tipo_nome || "-"}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px] hidden sm:table-cell">
                                                        {mov.descricao || "-"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <span
                                                            className={`font-semibold ${isPositive ? "text-green-600" : "text-red-500"
                                                                }`}
                                                        >
                                                            {isPositive ? "+" : ""}
                                                            {Number(mov.xp).toLocaleString("pt-BR")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                                                        {mov.qualificavel ? (
                                                            <Badge variant="default" className="text-[10px] px-1.5">
                                                                Q
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                                                        {mov.data_expiracao
                                                            ? new Date(mov.data_expiracao).toLocaleDateString("pt-BR")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{data.total} registro{data.total !== 1 ? "s" : ""}</span>
                                    <span>·</span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(v) => {
                                            setPageSize(Number(v) as PageSize);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-[70px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAGE_SIZES.map((s) => (
                                                <SelectItem key={s} value={String(s)}>
                                                    {s}/pág
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {page} / {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground text-sm">
                            Nenhuma movimentação encontrada
                            {hasFilters && (
                                <div className="mt-2">
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        Limpar filtros
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
