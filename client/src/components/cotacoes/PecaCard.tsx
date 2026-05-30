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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PecaCompleta } from "./types";
import { TIPO_FINANCEIRO_LABEL } from "./types";
import {
    calcLucro,
    fmtCurrencyCompact,
    fmtDuration,
    fmtTime,
    pecaDurationMinutes,
} from "@/lib/cotacoes/calc";

interface Props {
    peca: PecaCompleta;
    usadaEmCenarios: number;
    onToggleFavorita: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const TIPO_ICON = {
    pagante: Banknote,
    milhas: Coins,
    misto: Shuffle,
} as const;

export function PecaCard({ peca, usadaEmCenarios, onToggleFavorita, onEdit, onDelete }: Props) {
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
                    {/* Linha 1: trecho + horário */}
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-sm flex items-center gap-1 truncate">
                            <Plane className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">
                                {peca.origem || "?"} → {peca.destino || "?"}
                            </span>
                        </div>
                        {peca.dataSaida && (
                            <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                                {fmtTime(peca.dataSaida)}
                                {peca.dataChegada ? ` → ${fmtTime(peca.dataChegada)}` : ""}
                            </span>
                        )}
                    </div>

                    {peca.titulo && (
                        <div className="text-xs text-muted-foreground truncate">{peca.titulo}</div>
                    )}

                    {/* Linha 2: chips operacionais */}
                    <div className="flex items-center gap-1 flex-wrap text-[11px]">
                        {duracao != null && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                                <Clock className="h-3 w-3" />
                                {fmtDuration(duracao)}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                            <Shuffle className="h-3 w-3" />
                            {peca.qtdConexoes} con
                        </span>
                        {peca.bagagem && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-foreground/80 truncate max-w-[140px]">
                                <Luggage className="h-3 w-3" />
                                <span className="truncate">{peca.bagagem}</span>
                            </span>
                        )}
                        {peca.companhias && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80 truncate max-w-[140px]">
                                {peca.companhias}
                            </span>
                        )}
                        {peca.classe && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                                {peca.classe}
                            </span>
                        )}
                    </div>

                    {/* Linha 3: financeiro interno */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed">
                        <Badge
                            variant="outline"
                            className="gap-1 font-normal text-[10px] py-0 h-5"
                            title={TIPO_FINANCEIRO_LABEL[peca.tipoFinanceiro]}
                        >
                            <TipoIcon className="h-3 w-3" />
                            {TIPO_FINANCEIRO_LABEL[peca.tipoFinanceiro]}
                        </Badge>
                        <div className="flex items-center gap-2 text-[11px] tabular-nums">
                            <span className="text-muted-foreground">
                                C: <span className="text-foreground">{fmtCurrencyCompact(peca.custo)}</span>
                            </span>
                            <span className="text-muted-foreground">
                                V: <span className="text-foreground font-medium">{fmtCurrencyCompact(peca.venda)}</span>
                            </span>
                            {lucro != null && (
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
