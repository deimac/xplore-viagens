import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Plane,
    Clock,
    Luggage,
    X,
    GripVertical,
    ArrowRight,
    Pencil,
    ChevronDown,
    ChevronRight,
    Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PecaCompleta, CenarioPecaLink } from "./types";
import { fmtBagagemDirecao } from "@/lib/cotacoes/bagagem";
import {
    diffMinutes,
    fmtDateShort,
    fmtTime,
    fmtDuration,
    getResumoDirecao,
    getSegmentosDirecao,
    hasVolta,
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
    const [expanded, setExpanded] = useState<{ ida: boolean; volta: boolean }>({ ida: false, volta: false });
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `link-${link.id}`,
        data: { kind: "cenario-link", pecaId: peca.id, cenarioId, linkId: link.id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const ida = getResumoDirecao(peca, "ida");
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

                <div className="flex-1 min-w-0 p-2 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-sm flex items-center gap-1 truncate">
                            <Plane className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{ida.origem || "?"}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{ida.destino || "?"}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] gap-1"
                            onClick={onClick}
                            title="Editar peça"
                        >
                            <Pencil className="h-3 w-3" />
                            Editar
                        </Button>
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
                </div>

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
