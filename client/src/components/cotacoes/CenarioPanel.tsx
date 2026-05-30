import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
    Pencil,
    Trash2,
    Layers,
    Inbox,
    CheckSquare,
    Square,
    Clock,
    Banknote,
    TrendingUp,
    Shuffle,
    Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CenarioBloco, IntervaloEntreBlocos } from "./CenarioBloco";
import type { CenarioCompleto, PecaCompleta } from "./types";
import { calcCenarioTotais, fmtCurrencyCompact, fmtDuration } from "@/lib/cotacoes/calc";

interface Props {
    cenario: CenarioCompleto;
    pecasById: Map<number, PecaCompleta>;
    onEdit: () => void;
    onDelete: () => void;
    onToggleSelecionado: () => void;
    onRemoveLink: (linkId: number) => void;
    onClickPeca: (peca: PecaCompleta) => void;
}

export function CenarioPanel({
    cenario,
    pecasById,
    onEdit,
    onDelete,
    onToggleSelecionado,
    onRemoveLink,
    onClickPeca,
}: Props) {
    const totais = useMemo(() => calcCenarioTotais(cenario, pecasById), [cenario, pecasById]);
    const linksOrdenados = useMemo(() => [...cenario.pecas].sort((a, b) => a.ordem - b.ordem), [cenario.pecas]);

    const { isOver, setNodeRef } = useDroppable({
        id: `cenario-${cenario.id}`,
        data: { cenarioId: cenario.id },
    });

    const sortableIds = linksOrdenados.map((l) => `link-${l.id}`);
    const selecionado = cenario.status === "selecionado_proposta";

    return (
        <section
            className={`flex flex-col w-[380px] shrink-0 rounded-xl border bg-card overflow-hidden transition-all ${selecionado ? "border-emerald-300 ring-2 ring-emerald-200/50" : ""
                }`}
        >
            {/* Header */}
            <div className="p-3 border-b bg-card/60 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Layers className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-sm truncate">{cenario.nome}</h3>
                        {selecionado && (
                            <Badge className="gap-1 font-normal bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-[10px] py-0 h-5">
                                <Sparkle className="h-2.5 w-2.5" />
                                proposta
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={onToggleSelecionado}
                            title={selecionado ? "Desmarcar para proposta" : "Marcar para proposta"}
                        >
                            {selecionado ? (
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                                <Square className="h-3.5 w-3.5" />
                            )}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={onEdit}
                            title="Editar cenário"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={onDelete}
                            title="Excluir cenário"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Barra de resumo */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <Resumo
                        icon={<Banknote className="h-3 w-3" />}
                        label="Venda"
                        value={fmtCurrencyCompact(totais.venda)}
                    />
                    <Resumo
                        icon={<TrendingUp className="h-3 w-3" />}
                        label="Lucro"
                        value={fmtCurrencyCompact(totais.lucro)}
                        tone={totais.lucro >= 0 ? "good" : "bad"}
                    />
                    <Resumo
                        icon={<Clock className="h-3 w-3" />}
                        label="Tempo"
                        value={fmtDuration(totais.tempoMinutos ?? 0)}
                    />
                    <Resumo
                        icon={<Shuffle className="h-3 w-3" />}
                        label="Conexões"
                        value={String(totais.conexoes)}
                    />
                </div>
            </div>

            {/* Trilha de blocos */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-3 transition-colors ${isOver ? "bg-primary/5" : ""
                    }`}
            >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    {linksOrdenados.length === 0 ? (
                        <div
                            className={`border-2 border-dashed rounded-lg py-10 px-3 text-center text-xs ${isOver
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border text-muted-foreground"
                                }`}
                        >
                            <Inbox className="h-6 w-6 mx-auto mb-2 opacity-50" />
                            Arraste peças da biblioteca para montar este cenário.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {linksOrdenados.map((link, idx) => {
                                const peca = pecasById.get(link.pecaId);
                                if (!peca) return null;
                                const intervalo = totais.intervalos.find(
                                    (i) => i.pecaPosteriorId === link.pecaId && idx > 0
                                );
                                return (
                                    <div key={link.id}>
                                        {intervalo && (
                                            <IntervaloEntreBlocos
                                                minutos={intervalo.minutos}
                                                aeroporto={peca.origem ?? undefined}
                                            />
                                        )}
                                        <CenarioBloco
                                            link={link}
                                            peca={peca}
                                            cenarioId={cenario.id}
                                            ordem={idx + 1}
                                            onRemove={() => onRemoveLink(link.id)}
                                            onClick={() => onClickPeca(peca)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </SortableContext>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Custo: {fmtCurrencyCompact(totais.custo)}</span>
                <span>{linksOrdenados.length} peças</span>
            </div>
        </section>
    );
}

function Resumo({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: "good" | "bad";
}) {
    const toneCls =
        tone === "good"
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : tone === "bad"
                ? "text-rose-700 bg-rose-50 border-rose-200"
                : "bg-muted/60";
    return (
        <div className={`rounded-md border px-2 py-1 ${toneCls}`}>
            <div className="text-[10px] uppercase tracking-wide opacity-70 flex items-center gap-1">
                {icon}
                {label}
            </div>
            <div className="font-semibold tabular-nums">{value}</div>
        </div>
    );
}
