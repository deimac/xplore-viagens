import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CenarioPanel } from "./CenarioPanel";
import type { CenarioCompleto, PecaCompleta } from "./types";

interface Props {
    cenarios: CenarioCompleto[];
    pecasById: Map<number, PecaCompleta>;
    hideProfit?: boolean;
    onNewCenario: () => void;
    onEditCenario: (c: CenarioCompleto) => void;
    onDeleteCenario: (c: CenarioCompleto) => void;
    onToggleSelecionado: (c: CenarioCompleto) => void;
    onRemoveLink: (cenarioId: number, linkId: number) => void;
    onClickPeca: (peca: PecaCompleta) => void;
}

export function CenariosMesa({
    cenarios,
    pecasById,
    hideProfit = false,
    onNewCenario,
    onEditCenario,
    onDeleteCenario,
    onToggleSelecionado,
    onRemoveLink,
    onClickPeca,
}: Props) {
    if (cenarios.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                    <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="text-base font-semibold">Nenhum cenário ainda</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Crie cenários (combinações de peças) para comparar opções e gerar propostas.
                    </p>
                    <Button onClick={onNewCenario} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Criar primeiro cenário
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex gap-4 p-4 items-stretch min-w-min">
                {cenarios.map((c) => (
                    <CenarioPanel
                        key={c.id}
                        cenario={c}
                        pecasById={pecasById}
                        hideProfit={hideProfit}
                        onEdit={() => onEditCenario(c)}
                        onDelete={() => onDeleteCenario(c)}
                        onToggleSelecionado={() => onToggleSelecionado(c)}
                        onRemoveLink={(linkId) => onRemoveLink(c.id, linkId)}
                        onClickPeca={onClickPeca}
                    />
                ))}

                <button
                    type="button"
                    onClick={onNewCenario}
                    className="w-[260px] shrink-0 self-stretch border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-sm font-medium">Novo cenário</span>
                </button>
            </div>
        </div>
    );
}
