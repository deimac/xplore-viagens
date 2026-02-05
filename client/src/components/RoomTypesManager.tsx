import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, SquarePen, DoorOpen } from "lucide-react";
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

export default function RoomTypesManager() {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "" });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<{ id: number; name: string } | null>(null);

    const { data: roomTypes = [], refetch } = (trpc as any).roomTypes.list.useQuery();

    const createMutation = (trpc as any).roomTypes.create.useMutation({
        onSuccess: () => {
            toast.success("Tipo de espaço criado com sucesso!");
            refetch();
            setModalOpen(false);
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
            setModalOpen(false);
            setEditingRoom(null);
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
            setDeleteDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Erro ao excluir tipo de espaço", { description: error.message });
        }
    });

    const handleAddRoom = () => {
        setEditingRoom(null);
        setFormData({ name: "" });
        setModalOpen(true);
    };

    const handleEditRoom = (roomType: any) => {
        setEditingRoom(roomType);
        setFormData({ name: roomType.name });
        setModalOpen(true);
    };

    const handleDeleteRoom = (id: number, name: string) => {
        setRoomToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (roomToDelete) {
            deleteMutation.mutate({ id: roomToDelete.id });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Preencha o nome");
            return;
        }

        if (editingRoom) {
            updateMutation.mutate({ id: editingRoom.id, ...formData });
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
                            Tipos de Espaço
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie os tipos de espaços disponíveis nas hospedagens
                        </p>
                    </div>
                    <Button
                        onClick={handleAddRoom}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Tipo
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {roomTypes.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
                                <DoorOpen className="w-8 h-8 text-pink-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhum tipo de espaço cadastrado</p>
                            <Button
                                onClick={handleAddRoom}
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
                                        <th className="text-right p-4 font-semibold text-gray-700">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roomTypes.map((roomType: any) => (
                                        <tr
                                            key={roomType.id}
                                            className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <DoorOpen className="w-4 h-4 text-pink-600" />
                                                    <span className="font-medium">{roomType.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditRoom(roomType)}
                                                        className="hover:bg-pink-50"
                                                    >
                                                        <SquarePen className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteRoom(roomType.id, roomType.name)}
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
                            {editingRoom ? "Editar Tipo de Espaço" : "Novo Tipo de Espaço"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRoom
                                ? "Atualize as informações do tipo de espaço"
                                : "Adicione um novo tipo de espaço para as hospedagens"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Tipo *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                placeholder="Ex: Suíte Master, Quarto Standard..."
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
                                {editingRoom ? "Atualizar" : "Criar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Excluir Tipo de Espaço"
                description="Esta ação não pode ser desfeita. O tipo de espaço será permanentemente removido."
                itemName={roomToDelete?.name}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isLoading}
            />
        </AdminLayout>
    );
}
