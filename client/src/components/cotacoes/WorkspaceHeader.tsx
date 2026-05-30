import { Link } from "wouter";
import {
    ArrowLeft,
    Calendar,
    Users,
    MapPin,
    Plane,
    Layers,
    Plus,
    Sparkles,
    FileText,
    Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { CotacaoFull, CotacaoStatus } from "./types";
import { STATUS_COTACAO_LABEL } from "./types";

interface Props {
    cotacao: CotacaoFull["cotacao"];
    pecasCount: number;
    cenariosCount: number;
    selecionadosCount: number;
    onChangeStatus: (status: CotacaoStatus) => void;
    onNewPeca: () => void;
    onImportIa: () => void;
    onNewCenario: () => void;
    onGenerateProposta: () => void;
    onEditCotacao: () => void;
}

const STATUS_TONE: Record<CotacaoStatus, string> = {
    rascunho: "bg-slate-100 text-slate-700 border-slate-200",
    em_pesquisa: "bg-blue-50 text-blue-700 border-blue-200",
    em_montagem: "bg-amber-50 text-amber-700 border-amber-200",
    proposta_enviada: "bg-emerald-50 text-emerald-700 border-emerald-200",
    fechada: "bg-violet-50 text-violet-700 border-violet-200",
    cancelada: "bg-rose-50 text-rose-700 border-rose-200",
};

function fmtDate(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function WorkspaceHeader({
    cotacao,
    pecasCount,
    cenariosCount,
    selecionadosCount,
    onChangeStatus,
    onNewPeca,
    onImportIa,
    onNewCenario,
    onGenerateProposta,
    onEditCotacao,
}: Props) {
    const totalPax = cotacao.paxAdultos + cotacao.paxCriancas + cotacao.paxBebes;
    const podeGerar = selecionadosCount > 0;

    return (
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
                <Link
                    href="/admin/cotacoes"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-card hover:bg-accent transition-colors"
                    title="Voltar para a lista"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={onEditCotacao}
                            className="text-base md:text-lg font-semibold tracking-tight hover:text-primary transition-colors truncate text-left"
                            title="Editar dados da cotação"
                        >
                            {cotacao.clienteNome}
                        </button>
                        <span className="text-xs text-muted-foreground font-mono">#{cotacao.id}</span>
                        <Select value={cotacao.status} onValueChange={(v) => onChangeStatus(v as CotacaoStatus)}>
                            <SelectTrigger
                                className={`h-7 w-auto gap-1.5 text-xs border ${STATUS_TONE[cotacao.status]} px-2.5`}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(STATUS_COTACAO_LABEL) as CotacaoStatus[]).map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUS_COTACAO_LABEL[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-1 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cotacao.origem || "?"} → {cotacao.destino || "?"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(cotacao.dataIda)}
                            {cotacao.dataVolta ? ` – ${fmtDate(cotacao.dataVolta)}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {totalPax} pax
                            {cotacao.paxCriancas || cotacao.paxBebes
                                ? ` (${cotacao.paxAdultos}A${cotacao.paxCriancas ? `+${cotacao.paxCriancas}C` : ""}${cotacao.paxBebes ? `+${cotacao.paxBebes}B` : ""})`
                                : ""}
                        </span>
                        <Badge variant="secondary" className="gap-1 font-normal">
                            <Plane className="h-3 w-3" />
                            {pecasCount} peças
                        </Badge>
                        <Badge variant="secondary" className="gap-1 font-normal">
                            <Layers className="h-3 w-3" />
                            {cenariosCount} cenários
                        </Badge>
                        {selecionadosCount > 0 && (
                            <Badge className="gap-1 font-normal bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                                <Sparkle className="h-3 w-3" />
                                {selecionadosCount} p/ proposta
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={onImportIa} className="gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Importar IA
                    </Button>
                    <Button size="sm" variant="outline" onClick={onNewPeca} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Nova peça
                    </Button>
                    <Button size="sm" variant="outline" onClick={onNewCenario} className="gap-1.5">
                        <Layers className="h-4 w-4" />
                        Novo cenário
                    </Button>
                    <Button
                        size="sm"
                        onClick={onGenerateProposta}
                        disabled={!podeGerar}
                        className="gap-1.5"
                        title={podeGerar ? "Gerar proposta dos cenários selecionados" : "Marque ao menos um cenário como Selecionado p/ proposta"}
                    >
                        <FileText className="h-4 w-4" />
                        Gerar proposta
                    </Button>
                </div>
            </div>
        </header>
    );
}
