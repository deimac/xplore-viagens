import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DestaquesViagensPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [toDelete, setToDelete] = useState<{ id: number; nome: string } | null>(null);

    // @ts-expect-error - tRPC types are generated when server is running
    const query = trpc.destaques.list.useQuery();

    // @ts-expect-error - tRPC types are generated when server is running
    const createMutation = trpc.destaques.create.useMutation({
        onSuccess: () => {
            query.refetch();
            setCreateOpen(false);
            setNewName("");
            toast.success("Destaque criado com sucesso");
        },
        onError: () => toast.error("Erro ao criar destaque"),
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteMutation = trpc.destaques.delete.useMutation({
        onSuccess: () => {
            query.refetch();
            setDeleteDialogOpen(false);
            toast.success("Destaque excluído com sucesso");
        },
        onError: () => toast.error("Erro ao excluir destaque"),
    });

    const destaques: any[] = query.data || [];

    const handleCreate = () => {
        if (!newName.trim()) {
            toast.error("Nome do destaque é obrigatório");
            return;
        }
        createMutation.mutate({ nome: newName.trim() });
    };

    const handleDelete = (item: any) => {
        setToDelete({ id: item.id, nome: item.nome });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (toDelete) {
            deleteMutation.mutate({ id: toDelete.id });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                            Destaques de Viagens
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie os destaques (tags) exibidos nos cards de viagens
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Destaque
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {query.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando destaques...
                        </div>
                    ) : destaques.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                                <Plus className="w-8 h-8 text-amber-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhum destaque cadastrado</p>
                            <Button onClick={() => setCreateOpen(true)} variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar primeiro destaque
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {destaques.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-amber-50/50 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-500">#{item.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-gray-900">{item.nome}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item)}
                                                className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                aria-label="Excluir destaque"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Create Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Novo Destaque</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label htmlFor="new-dest">Nome do Destaque *</Label>
                                <Input
                                    id="new-dest"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Aéreo, All Inclusive, Hospedagem"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleCreate();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-amber-500 text-white hover:bg-amber-600">
                                    {createMutation.isPending ? "Criando..." : "Criar"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Excluir Destaque"
                    itemName={toDelete?.nome}
                    onConfirm={handleConfirmDelete}
                    isLoading={deleteMutation.isPending}
                />
            </div>
        </AdminLayout>
    );
}
