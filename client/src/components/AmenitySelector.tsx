import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Amenity {
    id: number;
    name: string;
    icon?: string;
}

interface Props {
    selectedAmenityIds: number[];
    onSelectionChange: (amenityIds: number[]) => void;
    className?: string;
}

export function AmenitySelector({ selectedAmenityIds, onSelectionChange, className }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAmenityName, setNewAmenityName] = useState("");
    const [newAmenityIcon, setNewAmenityIcon] = useState("");

    const { data: amenities = [], isLoading, refetch } = trpc.amenities.list.useQuery();

    const createMutation = trpc.amenities.create.useMutation({
        onSuccess: () => {
            toast.success("Comodidade criada com sucesso!");
            setIsModalOpen(false);
            setNewAmenityName("");
            setNewAmenityIcon("");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao criar comodidade");
        },
    });

    const toggleAmenity = (amenityId: number) => {
        const newSelection = selectedAmenityIds.includes(amenityId)
            ? selectedAmenityIds.filter(id => id !== amenityId)
            : [...selectedAmenityIds, amenityId];

        onSelectionChange(newSelection);
    };

    const handleCreateAmenity = async () => {
        if (!newAmenityName.trim()) {
            toast.error("Nome da comodidade é obrigatório");
            return;
        }

        await createMutation.mutateAsync({
            name: newAmenityName.trim(),
            icon: newAmenityIcon.trim() || undefined,
        });
    };

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {amenities.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-2">Nenhuma comodidade cadastrada</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        Crie comodidades para oferecer aos seus hóspedes
                    </p>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        size="sm"
                        className="bg-accent text-accent-foreground"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeira Comodidade
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {amenities.length} comodidade{amenities.length !== 1 ? 's' : ''} disponível{amenities.length !== 1 ? 'eis' : ''}
                        </span>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Nova
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {amenities.map((amenity: Amenity) => {
                            const isSelected = selectedAmenityIds.includes(amenity.id);

                            return (
                                <button
                                    key={amenity.id}
                                    type="button"
                                    onClick={() => toggleAmenity(amenity.id)}
                                    className={cn(
                                        "relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                        isSelected
                                            ? "bg-accent/10 border-accent text-accent-foreground"
                                            : "bg-card border-muted hover:border-accent/50 hover:bg-accent/5"
                                    )}
                                >
                                    {amenity.icon && (
                                        <span className="text-lg flex-shrink-0">
                                            {amenity.icon}
                                        </span>
                                    )}
                                    <span className="text-sm font-medium flex-1 min-w-0">
                                        {amenity.name}
                                    </span>

                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Modal para criar comodidade */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Comodidade</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="amenity-name">Nome da Comodidade *</Label>
                            <Input
                                id="amenity-name"
                                value={newAmenityName}
                                onChange={(e) => setNewAmenityName(e.target.value)}
                                placeholder="Ex: Wi-Fi, Piscina, Ar Condicionado"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateAmenity();
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <Label htmlFor="amenity-icon">Ícone (opcional)</Label>
                            <Input
                                id="amenity-icon"
                                value={newAmenityIcon}
                                onChange={(e) => setNewAmenityIcon(e.target.value)}
                                placeholder="Ex: 📶, 🏊‍♂️, ❄️, 🅿️"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use um emoji para representar a comodidade
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={createMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateAmenity}
                                disabled={createMutation.isPending}
                                className="bg-accent text-accent-foreground"
                            >
                                {createMutation.isPending ? "Criando..." : "Criar"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}