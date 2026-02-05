import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, X, Check, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BedTypesManager() {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: "", sleepsCount: 1 });

    const { data: bedTypes = [], refetch } = (trpc as any).bedTypes.list.useQuery();
    const createMutation = (trpc as any).bedTypes.create.useMutation({
        onSuccess: () => {
            toast.success("Tipo de cama criado com sucesso!");
            refetch();
            setIsAdding(false);
            setFormData({ name: "", sleepsCount: 1 });
        },
        onError: (error: any) => {
            toast.error("Erro ao criar tipo de cama", { description: error.message });
        }
    });

    const updateMutation = (trpc as any).bedTypes.update.useMutation({
        onSuccess: () => {
            toast.success("Tipo de cama atualizado com sucesso!");
            refetch();
            setEditingId(null);
            setFormData({ name: "", sleepsCount: 1 });
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar tipo de cama", { description: error.message });
        }
    });

    const deleteMutation = (trpc as any).bedTypes.delete.useMutation({
        onSuccess: () => {
            toast.success("Tipo de cama excluído com sucesso!");
            refetch();
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir tipo de cama", { description: error.message });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Preencha o nome");
            return;
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, ...formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (bedType: any) => {
        setEditingId(bedType.id);
        setFormData({ name: bedType.name, sleepsCount: bedType.sleepsCount });
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "", sleepsCount: 1 });
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tipos de Camas</CardTitle>
                    {!isAdding && !editingId && (
                        <Button onClick={() => setIsAdding(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Tipo
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {(isAdding || editingId) && (
                        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-muted/50">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Cama King"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sleepsCount">Capacidade (pessoas)</Label>
                                    <Input
                                        id="sleepsCount"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.sleepsCount}
                                        onChange={(e) => setFormData({ ...formData, sleepsCount: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                                        <Check className="w-4 h-4 mr-2" />
                                        {editingId ? "Atualizar" : "Criar"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="space-y-2">
                        {bedTypes.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Nenhum tipo de cama cadastrado
                            </p>
                        ) : (
                            bedTypes.map((bedType: any) => (
                                <div
                                    key={bedType.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium">{bedType.name}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Users className="w-3 h-3" />
                                            {bedType.sleepsCount} {bedType.sleepsCount === 1 ? 'pessoa' : 'pessoas'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(bedType)}
                                            disabled={!!editingId || isAdding}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm("Tem certeza que deseja excluir este tipo de cama?")) {
                                                    deleteMutation.mutate({ id: bedType.id });
                                                }
                                            }}
                                            disabled={deleteMutation.isLoading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
