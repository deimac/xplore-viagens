import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plane, Clock, Luggage, X, GripVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PecaCompleta, CenarioPecaLink } from "./types";
import { fmtBagagemPeca } from "@/lib/cotacoes/bagagem";
import {
    fmtTime,
    fmtDuration,
    getResumoDirecao,
    hasVolta,
    pecaDurationMinutes,
} from "@/lib/cotacoes/calc";

interface Props {
    link: CenarioPecaLink;
    peca: PecaCompleta;
    cenarioId: number;
    ordem: number;
    onRemove: () => void;
    onClick: () => void;
}

export function CenarioBloco({ link, peca, cenarioId, ordem, onRemove, onClick }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `link-${link.id}`,
        data: { kind: "cenario-link", pecaId: peca.id, cenarioId, linkId: link.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const duracao = pecaDurationMinutes(peca);
    const ida = getResumoDirecao(peca, "ida");
    const volta = getResumoDirecao(peca, "volta");
    const temVolta = hasVolta(peca);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative rounded-lg border bg-card hover:border-primary/40 transition-all"
        >
            <div className="flex items-stretch">
                <button
                    type="button"
                    {...listeners}
                    {...attributes}
                    className="px-1 py-2 text-muted-foreground/40 hover:text-foreground hover:bg-accent rounded-l-lg cursor-grab active:cursor-grabbing touch-none transition-colors flex flex-col items-center justify-center gap-1"
                    title="Arraste para reordenar"
                >
                    <GripVertical className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground/60">
                        {ordem}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onClick}
                    className="flex-1 min-w-0 p-2 text-left space-y-1"
                >
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-sm flex items-center gap-1 truncate">
                            <Plane className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{ida.origem || "?"}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{ida.destino || "?"}</span>
                        </div>
                        {ida.dataSaida && (
                            <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                                {fmtTime(ida.dataSaida)}
                                {ida.dataChegada ? ` → ${fmtTime(ida.dataChegada)}` : ""}
                            </span>
                        )}
                    </div>

                    {temVolta && (
                        <div className="text-[11px] text-muted-foreground truncate">
                            Volta: {volta.origem || "?"} → {volta.destino || "?"}
                            {volta.dataSaida ? ` • ${fmtTime(volta.dataSaida)}` : ""}
                            {volta.dataChegada ? ` → ${fmtTime(volta.dataChegada)}` : ""}
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                        {(ida.companhias || volta.companhias) && (
                            <span className="truncate max-w-[180px]">
                                {temVolta
                                    ? [ida.companhias, volta.companhias].filter(Boolean).join(" / ")
                                    : ida.companhias}
                            </span>
                        )}
                        {duracao != null && (
                            <span className="inline-flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {fmtDuration(duracao)}
                            </span>
                        )}
                        {((ida.qtdConexoes ?? 0) + (temVolta ? volta.qtdConexoes ?? 0 : 0)) > 0 && (
                            <span>· {(ida.qtdConexoes ?? 0) + (temVolta ? volta.qtdConexoes ?? 0 : 0)} con</span>
                        )}
                        {fmtBagagemPeca(peca) && (
                            <span className="inline-flex items-center gap-0.5 truncate max-w-[140px]">
                                <Luggage className="h-3 w-3" />
                                <span className="truncate">{fmtBagagemPeca(peca)}</span>
                            </span>
                        )}
                    </div>
                </button>

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 m-1 shrink-0 text-muted-foreground/70 hover:text-destructive"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove();
                    }}
                    title="Remover do cenário"
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export function IntervaloEntreBlocos({ minutos, aeroporto }: { minutos: number; aeroporto?: string }) {
    const tone =
        minutos < 60
            ? "text-rose-600 bg-rose-50 border-rose-200"
            : minutos < 180
                ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-emerald-700 bg-emerald-50 border-emerald-200";
    return (
        <div className="flex items-center gap-2 px-3">
            <div className="flex-1 border-t border-dashed" />
            <span
                className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full border ${tone} inline-flex items-center gap-1`}
            >
                <Clock className="h-2.5 w-2.5" />
                {fmtDuration(minutos)}
                {aeroporto ? ` em ${aeroporto}` : ""}
            </span>
            <div className="flex-1 border-t border-dashed" />
        </div>
    );
}
