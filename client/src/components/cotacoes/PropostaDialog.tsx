import { useEffect, useMemo, useState } from "react";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, FileText, GripVertical, Sparkle } from "lucide-react";
import type { CenarioCompleto } from "./types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTitulo: string;
    cenariosSelecionados: CenarioCompleto[];
    onSubmit: (titulo: string, validadeData: string, orderedCenarioIds: number[]) => void;
    isSubmitting: boolean;
}

function SortableCenarioItem({
    cenario,
    index,
    total,
    onMoveUp,
    onMoveDown,
}: {
    cenario: CenarioCompleto;
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(cenario.id),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`rounded border bg-white px-2 py-1.5 flex items-center gap-2 ${isDragging ? "opacity-80 shadow-sm" : ""}`}
        >
            <button
                type="button"
                className="cursor-grab touch-none rounded p-0.5 text-emerald-700/70 hover:text-emerald-800"
                title="Arrastar para reordenar"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            <div className="min-w-0 flex-1">
                <div className="truncate">
                    • {cenario.nome}{" "}
                    <span className="text-emerald-700/70">({cenario.pecas.length} peças)</span>
                </div>
            </div>

            <div className="flex items-center gap-0.5">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Subir"
                    disabled={index === 0}
                    onClick={onMoveUp}
                >
                    <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Descer"
                    disabled={index === total - 1}
                    onClick={onMoveDown}
                >
                    <ArrowDown className="h-3.5 w-3.5" />
                </Button>
            </div>
        </li>
    );
}

export function PropostaDialog({
    open,
    onOpenChange,
    defaultTitulo,
    cenariosSelecionados,
    onSubmit,
    isSubmitting,
}: Props) {
    const [titulo, setTitulo] = useState(defaultTitulo);
    const [validadeData, setValidadeData] = useState("");
    const [orderedCenarioIds, setOrderedCenarioIds] = useState<number[]>([]);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const orderedCenarios = useMemo(() => {
        const byId = new Map(cenariosSelecionados.map((c) => [c.id, c]));
        const picked = orderedCenarioIds
            .map((id) => byId.get(id))
            .filter((c): c is CenarioCompleto => Boolean(c));
        const missing = cenariosSelecionados.filter((c) => !orderedCenarioIds.includes(c.id));
        return [...picked, ...missing];
    }, [cenariosSelecionados, orderedCenarioIds]);

    useEffect(() => {
        if (open) {
            setTitulo(defaultTitulo);
            setValidadeData("");
            setOrderedCenarioIds(cenariosSelecionados.map((c) => c.id));
        }
    }, [open, defaultTitulo, cenariosSelecionados]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = orderedCenarios.findIndex((c) => String(c.id) === String(active.id));
        const newIndex = orderedCenarios.findIndex((c) => String(c.id) === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const moved = arrayMove(orderedCenarios, oldIndex, newIndex).map((c) => c.id);
        setOrderedCenarioIds(moved);
    };

    const handleMove = (index: number, targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= orderedCenarios.length) return;
        const moved = arrayMove(orderedCenarios, index, targetIndex).map((c) => c.id);
        setOrderedCenarioIds(moved);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Gerar proposta
                    </DialogTitle>
                    <DialogDescription>
                        Cria um snapshot cliente-safe dos cenários marcados. Custo, fonte e estratégia internos ficam ocultos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Título (opcional)</Label>
                        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Validade (opcional)</Label>
                        <Input
                            type="date"
                            value={validadeData}
                            onChange={(e) => setValidadeData(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border bg-emerald-50/50 border-emerald-200 p-3">
                        <div className="text-xs font-semibold text-emerald-800 mb-1.5 flex items-center gap-1">
                            <Sparkle className="h-3 w-3" />
                            Cenários incluídos ({orderedCenarios.length})
                        </div>
                        {orderedCenarios.length === 0 ? (
                            <p className="text-xs text-rose-700">
                                Nenhum cenário marcado como "selecionado para proposta".
                            </p>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={orderedCenarios.map((c) => String(c.id))}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <ul className="text-xs text-emerald-900 space-y-1">
                                        {orderedCenarios.map((c, idx) => (
                                            <SortableCenarioItem
                                                key={c.id}
                                                cenario={c}
                                                index={idx}
                                                total={orderedCenarios.length}
                                                onMoveUp={() => handleMove(idx, idx - 1)}
                                                onMoveDown={() => handleMove(idx, idx + 1)}
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onSubmit(titulo, validadeData, orderedCenarios.map((c) => c.id))}
                        disabled={isSubmitting || orderedCenarios.length === 0}
                    >
                        {isSubmitting ? "Gerando..." : "Gerar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
