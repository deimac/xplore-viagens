import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plane,
    Clock,
    Luggage,
    Star,
    StarOff,
    Pencil,
    Trash2,
    GripVertical,
    Banknote,
    Coins,
    Shuffle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PecaCompleta } from "./types";
import { TIPO_FINANCEIRO_LABEL } from "./types";
import { fmtBagagemDirecao } from "@/lib/cotacoes/bagagem";
import {
    diffMinutes,
    fmtCurrencyCompact,
    fmtDateShort,
    fmtDuration,
    fmtTime,
    getResumoDirecao,
    getSegmentosDirecao,
    hasVolta,
    toNumber,
} from "@/lib/cotacoes/calc";

interface Props {
    peca: PecaCompleta;
    usadaEmCenarios: number;
    hideProfit?: boolean;
    onToggleFavorita: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const TIPO_ICON = {
    pagante: Banknote,
    milhas: Coins,
    misto: Shuffle,
} as const;

export function PecaCard({
    peca,
    usadaEmCenarios,
    hideProfit = false,
    onToggleFavorita,
    onEdit,
    onDelete,
}: Props) {
    const [expanded, setExpanded] = useState<{ ida: boolean; volta: boolean }>({ ida: false, volta: false });
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `peca-${peca.id}`,
        data: { kind: "peca-library", pecaId: peca.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const custo = toNumber(peca.custo);
    const lucro = toNumber(peca.venda);
    const vendaTotal = custo != null && lucro != null ? custo + lucro : null;
    const TipoIcon = TIPO_ICON[peca.tipoFinanceiro];
    const isFavorita = peca.status === "favorita";
    const ida = getResumoDirecao(peca, "ida");
    const volta = getResumoDirecao(peca, "volta");
    const temVolta = hasVolta(peca);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-lg border bg-card transition-all ${isDragging ? "ring-2 ring-primary" : "hover:border-primary/40 hover:shadow-sm"
                } ${isFavorita ? "border-amber-300/60 bg-amber-50/30" : ""}`}
        >
            {usadaEmCenarios > 0 && (
                <span
                    className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                    title={`Usada em ${usadaEmCenarios} cenário(s)`}
                >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {usadaEmCenarios}
                </span>
            )}

            <div className="flex items-stretch">
                <button
                    type="button"
                    className="px-1.5 py-2 text-muted-foreground/40 hover:text-foreground hover:bg-accent rounded-l-lg cursor-grab active:cursor-grabbing touch-none transition-colors"
                    title="Arraste para um cenário"
                    {...listeners}
                    {...attributes}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 min-w-0 p-2.5 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-sm flex items-center gap-1 truncate">
                            <Plane className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{peca.titulo || "Peça"}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground/80 shrink-0">
                            {temVolta ? "Ida + volta" : "Somente ida"}
                        </span>
                    </div>

                    <TrechoPanel
                        peca={peca}
                        direcao="ida"
                        titulo="Ida"
                        isOpen={expanded.ida}
                        onOpenChange={(isOpen) => setExpanded((prev) => ({ ...prev, ida: isOpen }))}
                    />

                    {temVolta && (
                        <TrechoPanel
                            peca={peca}
                            direcao="volta"
                            titulo="Volta"
                            isOpen={expanded.volta}
                            onOpenChange={(isOpen) => setExpanded((prev) => ({ ...prev, volta: isOpen }))}
                        />
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed">
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="outline"
                                className="gap-1 font-normal text-[10px] py-0 h-5"
                                title={TIPO_FINANCEIRO_LABEL[peca.tipoFinanceiro]}
                            >
                                <TipoIcon className="h-3 w-3" />
                                {TIPO_FINANCEIRO_LABEL[peca.tipoFinanceiro]}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] tabular-nums">
                            <span className="text-muted-foreground">
                                C: <span className="text-foreground">{fmtCurrencyCompact(peca.custo)}</span>
                            </span>
                            <span className="text-muted-foreground">
                                V: <span className="text-foreground font-medium">{fmtCurrencyCompact(vendaTotal)}</span>
                            </span>
                            {!hideProfit && lucro != null && (
                                <span
                                    className={`font-semibold ${lucro >= 0 ? "text-emerald-600" : "text-rose-600"
                                        }`}
                                >
                                    {lucro >= 0 ? "+" : ""}
                                    {fmtCurrencyCompact(lucro)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações inline (aparecem no hover) */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 rounded-md border shadow-sm">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={onToggleFavorita}
                    title={isFavorita ? "Remover dos favoritos" : "Favoritar"}
                >
                    {isFavorita ? (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    ) : (
                        <StarOff className="h-3.5 w-3.5" />
                    )}
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={onEdit}
                    title="Editar peça"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={onDelete}
                    title="Excluir peça"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

function TrechoPanel({
    peca,
    direcao,
    titulo,
    isOpen,
    onOpenChange,
}: {
    peca: PecaCompleta;
    direcao: "ida" | "volta";
    titulo: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const resumo = getResumoDirecao(peca, direcao);
    const segmentos = [...getSegmentosDirecao(peca, direcao)].sort((a, b) => a.ordem - b.ordem);
    const conexoes = resumo.qtdConexoes ?? Math.max(0, segmentos.length - 1);
    const bagagem = fmtBagagemDirecao(peca, direcao);
    const duracao = resumo.duracaoMinutos ?? diffMinutes(resumo.dataSaida, resumo.dataChegada);

    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div className="rounded-md border bg-muted/20 p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{titulo}</div>
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[10px] gap-1"
                            title={isOpen ? "Ocultar segmentos" : "Ver segmentos"}
                        >
                            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Segmentos
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <div className="text-xs font-medium truncate">
                    {resumo.origem || "?"} <ArrowRight className="inline h-3 w-3 align-[-1px]" /> {resumo.destino || "?"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                    {resumo.dataSaida ? fmtTime(resumo.dataSaida) : "—"}
                    {resumo.dataChegada ? ` → ${fmtTime(resumo.dataChegada)}` : ""}
                    {resumo.companhias ? ` • ${resumo.companhias}` : ""}
                    {resumo.classe ? ` • ${resumo.classe}` : ""}
                </div>

                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    {duracao != null && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border text-foreground/80">
                            <Clock className="h-3 w-3" />
                            {fmtDuration(duracao)}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border text-foreground/80">
                        <Shuffle className="h-3 w-3" />
                        {conexoes} con
                    </span>
                    {bagagem && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border text-foreground/80 truncate max-w-[180px]">
                            <Luggage className="h-3 w-3" />
                            <span className="truncate">{bagagem}</span>
                        </span>
                    )}
                </div>

                <CollapsibleContent className="pt-1 space-y-1.5">
                    {segmentos.length === 0 ? (
                        <div className="rounded border border-dashed bg-background px-2 py-1.5 text-[11px] text-muted-foreground">
                            Sem segmentos detalhados.
                        </div>
                    ) : (
                        segmentos.map((seg, idx) => {
                            const next = segmentos[idx + 1];
                            const duracaoVoo = diffMinutes(seg.saida, seg.chegada);
                            const duracaoConexao =
                                seg.duracaoConexaoMinutos ??
                                (next ? diffMinutes(seg.chegada, next.saida) : null);

                            return (
                                <div key={`${direcao}-${seg.id ?? idx}-${seg.ordem}`} className="space-y-1.5">
                                    <div className="rounded border bg-background px-2 py-1.5 space-y-1">
                                        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                                            <span className="font-medium uppercase tracking-wide">Segmento {idx + 1}</span>
                                            <span className="truncate">
                                                {seg.companhia || "Companhia"}
                                                {seg.numeroVoo ? ` • ${seg.numeroVoo}` : ""}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-medium truncate">
                                            {seg.aeroportoOrigem || "?"}
                                            {seg.cidadeOrigem ? ` (${seg.cidadeOrigem})` : ""}
                                            {" "}
                                            <ArrowRight className="inline h-3 w-3 align-[-1px]" />
                                            {" "}
                                            {seg.aeroportoDestino || "?"}
                                            {seg.cidadeDestino ? ` (${seg.cidadeDestino})` : ""}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {duracaoVoo != null ? `${fmtDuration(duracaoVoo)} • ` : ""}
                                            {seg.saida ? `${fmtDateShort(seg.saida)} ${fmtTime(seg.saida)}` : "—"}
                                            {seg.chegada ? ` → ${fmtDateShort(seg.chegada)} ${fmtTime(seg.chegada)}` : ""}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                                            {seg.classe && <span className="px-1.5 py-0.5 rounded bg-muted">{seg.classe}</span>}
                                            {seg.bagagem && <span className="px-1.5 py-0.5 rounded bg-muted truncate max-w-[150px]">{seg.bagagem}</span>}
                                        </div>
                                    </div>

                                    {next && duracaoConexao != null && duracaoConexao > 0 && (
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="flex-1 border-t border-dashed" />
                                            <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                                Conexão {fmtDuration(duracaoConexao)}
                                            </span>
                                            <div className="flex-1 border-t border-dashed" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
