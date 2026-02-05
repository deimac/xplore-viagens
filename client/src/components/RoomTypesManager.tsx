import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function RoomTypesManager() {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    const { data: roomTypes = [], refetch } = (trpc as any).roomTypes.list.useQuery();
    const createMutation = (trpc as any).roomTypes.create.useMutation({
        onSuccess: () => {
            toast.success("Tipo de espaço criado com sucesso!");
            refetch();
            setIsAdding(false);
            setFormData({ name: "" });
        },
        onError: (error: any) => {
            toast.error("Erro ao criar tipo de espaço", { description: error.message });
        }
    });

    const updateMutation = (trpc as any).roomTypes.update.useMutation({
        onSuccess: () => {
            toast.success("Tipo de espaço atualizado com sucesso!");
            refetch();
            setEditingId(null);
            setFormData({ name: "" });
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar tipo de espaço", { description: error.message });
        }
    });

    const deleteMutation = (trpc as any).roomTypes.delete.useMutation({
        onSuccess: () => {
            toast.success("Tipo de espaço excluído com sucesso!");
            refetch();
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir tipo de espaço", { description: error.message });
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

    const handleEdit = (roomType: any) => {
        setEditingId(roomType.id);
        setFormData({ name: roomType.name });
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "" });
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tipos de Espaço</CardTitle>
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
                                        onChange={(e) => setFormData({ name: e.target.value })}
                                        placeholder="Ex: Suíte Master"
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
                        {roomTypes.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Nenhum tipo de espaço cadastrado
                            </p>
                        ) : (
                            roomTypes.map((roomType: any) => (
                                <div
                                    key={roomType.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium">{roomType.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(roomType)}
                                            disabled={!!editingId || isAdding}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm("Tem certeza que deseja excluir este tipo de espaço?")) {
                                                    deleteMutation.mutate({ id: roomType.id });
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
