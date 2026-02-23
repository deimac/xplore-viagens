import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    className?: string;
}

export function DestaqueSelector({ selectedIds, onSelectionChange, className }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState("");

    const { data: destaques = [], isLoading, refetch } = trpc.destaques.list.useQuery();

    const createMutation = trpc.destaques.create.useMutation({
        onSuccess: () => {
            toast.success("Destaque criado com sucesso!");
            setIsModalOpen(false);
            setNewName("");
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao criar destaque");
        },
    });

    const toggle = (id: number) => {
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelection);
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error("Nome do destaque é obrigatório");
            return;
        }
        await createMutation.mutateAsync({ nome: newName.trim() });
    };

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {destaques.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 mx-auto mb-2 bg-muted rounded-full flex items-center justify-center">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Nenhum destaque</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Crie destaques para as tags do card (ex: Aéreo, All Inclusive)
                    </p>
                    <Button type="button" onClick={() => setIsModalOpen(true)} size="sm" className="bg-amber-500 text-white hover:bg-amber-600">
                        <Plus className="w-4 h-4 mr-1" />
                        Criar Primeiro
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {destaques.length} destaque{destaques.length !== 1 ? 's' : ''}
                        </span>
                        <Button type="button" onClick={() => setIsModalOpen(true)} size="sm" variant="outline" className="text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Novo
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {destaques.map((d: any) => {
                            const isSelected = selectedIds.includes(d.id);
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => toggle(d.id)}
                                    className={cn(
                                        "relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                        isSelected
                                            ? "bg-amber-500/10 border-amber-500 text-amber-700"
                                            : "bg-card border-muted hover:border-amber-500/50 hover:bg-amber-50"
                                    )}
                                >
                                    <span className="text-sm font-medium flex-1 min-w-0">{d.nome}</span>
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Modal para criar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Destaque</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="dest-name">Nome do Destaque *</Label>
                            <Input
                                id="dest-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex: Aéreo, Hospedagem, All Inclusive"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={createMutation.isPending}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleCreate} disabled={createMutation.isPending} className="bg-amber-500 text-white hover:bg-amber-600">
                                {createMutation.isPending ? "Criando..." : "Criar"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
