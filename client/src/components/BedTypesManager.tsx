import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, SquarePen, Bed, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

export default function BedTypesManager() {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBed, setEditingBed] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", sleepsCount: 1 });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bedToDelete, setBedToDelete] = useState<{ id: number; name: string } | null>(null);

    const { data: bedTypes = [], refetch } = (trpc as any).bedTypes.list.useQuery();

    const createMutation = (trpc as any).bedTypes.create.useMutation({
        onSuccess: () => {
            toast.success("Tipo de cama criado com sucesso!");
            refetch();
            setModalOpen(false);
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
            setModalOpen(false);
            setEditingBed(null);
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
            setDeleteDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir tipo de cama", { description: error.message });
        }
    });

    const handleAddBed = () => {
        setEditingBed(null);
        setFormData({ name: "", sleepsCount: 1 });
        setModalOpen(true);
    };

    const handleEditBed = (bedType: any) => {
        setEditingBed(bedType);
        setFormData({ name: bedType.name, sleepsCount: bedType.sleepsCount });
        setModalOpen(true);
    };

    const handleDeleteBed = (id: number, name: string) => {
        setBedToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (bedToDelete) {
            deleteMutation.mutate({ id: bedToDelete.id });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Preencha o nome");
            return;
        }

        if (editingBed) {
            updateMutation.mutate({ id: editingBed.id, ...formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                            Tipos de Cama
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie os tipos de camas disponíveis nas hospedagens
                        </p>
                    </div>
                    <Button
                        onClick={handleAddBed}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Tipo
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {bedTypes.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
                                <Bed className="w-8 h-8 text-pink-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhum tipo de cama cadastrado</p>
                            <Button
                                onClick={handleAddBed}
                                variant="outline"
                                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar primeiro tipo
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-gray-200">
                                        <th className="text-left p-4 font-semibold text-gray-700">Nome</th>
                                        <th className="text-left p-4 font-semibold text-gray-700">Capacidade</th>
                                        <th className="text-right p-4 font-semibold text-gray-700">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bedTypes.map((bedType: any) => (
                                        <tr
                                            key={bedType.id}
                                            className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Bed className="w-4 h-4 text-pink-600" />
                                                    <span className="font-medium">{bedType.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {bedType.sleepsCount} {bedType.sleepsCount === 1 ? 'pessoa' : 'pessoas'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditBed(bedType)}
                                                        className="hover:bg-pink-50"
                                                    >
                                                        <SquarePen className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteBed(bedType.id, bedType.name)}
                                                        className="hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBed ? "Editar Tipo de Cama" : "Novo Tipo de Cama"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBed
                                ? "Atualize as informações do tipo de cama"
                                : "Adicione um novo tipo de cama para as hospedagens"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Tipo *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Cama King, Cama Queen..."
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="sleepsCount">Capacidade (pessoas) *</Label>
                            <Input
                                id="sleepsCount"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.sleepsCount}
                                onChange={(e) => setFormData({ ...formData, sleepsCount: parseInt(e.target.value) || 1 })}
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                            >
                                {editingBed ? "Atualizar" : "Criar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Excluir Tipo de Cama"
                description="Esta ação não pode ser desfeita. O tipo de cama será permanentemente removido."
                itemName={bedToDelete?.name}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isLoading}
            />
        </AdminLayout>
    );
}
