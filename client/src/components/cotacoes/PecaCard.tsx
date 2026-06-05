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
    Layers,
    Plus,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PecaCompleta } from "./types";
import { TIPO_FINANCEIRO_LABEL } from "./types";
import { fmtBagagemPeca } from "@/lib/cotacoes/bagagem";
import {
    calcLucro,
    fmtCurrencyCompact,
    fmtDuration,
    fmtTime,
    getResumoDirecao,
    hasVolta,
    pecaDurationMinutes,
} from "@/lib/cotacoes/calc";

export interface CenarioOption {
    id: number;
    nome: string;
    jaTem: boolean;
}

interface Props {
    peca: PecaCompleta;
    usadaEmCenarios: number;
    hideProfit?: boolean;
    cenariosOptions?: CenarioOption[];
    onToggleFavorita: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddToCenario?: (cenarioId: number) => void;
    onCreateCenarioAndAdd?: () => void;
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
    cenariosOptions,
    onToggleFavorita,
    onEdit,
    onDelete,
    onAddToCenario,
    onCreateCenarioAndAdd,
}: Props) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `peca-${peca.id}`,
        data: { kind: "peca-library", pecaId: peca.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const lucro = calcLucro(peca.custo, peca.venda);
    const duracao = pecaDurationMinutes(peca);
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
                        {ida.dataSaida && (
                            <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                                {fmtTime(ida.dataSaida)}
                                {ida.dataChegada ? ` → ${fmtTime(ida.dataChegada)}` : ""}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap text-[11px]">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                            {temVolta ? "Ida + volta" : "Somente ida"}
                        </span>
                        {duracao != null && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                                <Clock className="h-3 w-3" />
                                {fmtDuration(duracao)}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                            <Shuffle className="h-3 w-3" />
                            {(ida.qtdConexoes ?? 0) + (temVolta ? volta.qtdConexoes ?? 0 : 0)} con
                        </span>
                        {fmtBagagemPeca(peca) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80 truncate max-w-[140px]">
                                <Luggage className="h-3 w-3" />
                                <span className="truncate">{fmtBagagemPeca(peca)}</span>
                            </span>
                        )}
                    </div>

                    <div className="rounded-md border bg-muted/20 p-2 space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Ida</div>
                        <div className="text-xs font-medium truncate">
                            {ida.origem || "?"} → {ida.destino || "?"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                            {ida.dataSaida ? fmtTime(ida.dataSaida) : "—"}
                            {ida.dataChegada ? ` → ${fmtTime(ida.dataChegada)}` : ""}
                            {ida.companhias ? ` • ${ida.companhias}` : ""}
                        </div>
                    </div>

                    {temVolta && (
                        <div className="rounded-md border bg-muted/20 p-2 space-y-1">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Volta</div>
                            <div className="text-xs font-medium truncate">
                                {volta.origem || "?"} → {volta.destino || "?"}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                                {volta.dataSaida ? fmtTime(volta.dataSaida) : "—"}
                                {volta.dataChegada ? ` → ${fmtTime(volta.dataChegada)}` : ""}
                                {volta.companhias ? ` • ${volta.companhias}` : ""}
                            </div>
                        </div>
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
                            {(onAddToCenario || onCreateCenarioAndAdd) && (
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-5 px-1.5 text-[10px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
                                            title="Adicionar a um cenário"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Cenário
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-64 p-1">
                                        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
                                            <Layers className="h-3 w-3" />
                                            Adicionar a cenário
                                        </div>
                                        {cenariosOptions && cenariosOptions.length > 0 ? (
                                            <div className="max-h-56 overflow-y-auto">
                                                {cenariosOptions.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        disabled={c.jaTem}
                                                        onClick={() => {
                                                            onAddToCenario?.(c.id);
                                                            setPopoverOpen(false);
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2"
                                                    >
                                                        <span className="truncate">{c.nome}</span>
                                                        {c.jaTem && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                                                                <Check className="h-3 w-3" />
                                                                já incluída
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-2 py-2 text-xs text-muted-foreground">
                                                Nenhum cenário criado ainda.
                                            </div>
                                        )}
                                        {onCreateCenarioAndAdd && (
                                            <>
                                                <div className="my-1 border-t" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onCreateCenarioAndAdd();
                                                        setPopoverOpen(false);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex items-center gap-1.5 text-primary font-medium"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Criar novo cenário com esta peça
                                                </button>
                                            </>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] tabular-nums">
                            <span className="text-muted-foreground">
                                C: <span className="text-foreground">{fmtCurrencyCompact(peca.custo)}</span>
                            </span>
                            <span className="text-muted-foreground">
                                V: <span className="text-foreground font-medium">{fmtCurrencyCompact(peca.venda)}</span>
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
