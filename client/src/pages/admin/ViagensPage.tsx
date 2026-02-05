import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import TravelModal from "@/components/TravelModal";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

interface Travel {
    id?: number;
    title: string;
    description: string;
    origin: string;
    departureDate: string | null;
    returnDate: string | null;
    travelers: string | null;
    price: string;
    imageUrl: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export default function ViagensPage() {
    const [travelModalOpen, setTravelModalOpen] = useState(false);
    const [selectedTravel, setSelectedTravel] = useState<Travel | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [travelToDelete, setTravelToDelete] = useState<{ id: number; title: string } | null>(null);

    // @ts-expect-error - tRPC types are generated when server is running
    const travelsQuery = trpc.travels.list.useQuery(undefined);

    // @ts-expect-error - tRPC types are generated when server is running
    const createTravelMutation = trpc.travels.create.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setTravelModalOpen(false);
            toast.success("Viagem criada com sucesso");
        },
        onError: () => {
            toast.error("Erro ao criar viagem");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const updateTravelMutation = trpc.travels.update.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setTravelModalOpen(false);
            toast.success("Viagem atualizada com sucesso");
        },
        onError: () => {
            toast.error("Erro ao atualizar viagem");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteTravelMutation = trpc.travels.delete.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setDeleteDialogOpen(false);
            toast.success("Viagem deletada com sucesso");
        },
        onError: () => {
            toast.error("Erro ao deletar viagem");
        },
    });

    const travels: Travel[] = (travelsQuery.data as any)?.json || travelsQuery.data || [];

    const handleAddTravel = () => {
        setSelectedTravel(undefined);
        setTravelModalOpen(true);
    };

    const handleEditTravel = (travel: Travel) => {
        setSelectedTravel(travel);
        setTravelModalOpen(true);
    };

    const handleDeleteTravel = (id: number, title: string) => {
        setTravelToDelete({ id, title });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (travelToDelete) {
            deleteTravelMutation.mutate({ id: travelToDelete.id });
        }
    };

    const handleSaveTravel = (travel: Travel) => {
        if (travel.id) {
            updateTravelMutation.mutate({
                id: travel.id,
                title: travel.title,
                description: travel.description,
                origin: travel.origin,
                departureDate: travel.departureDate || "",
                returnDate: travel.returnDate || "",
                travelers: travel.travelers || "",
                price: travel.price,
                imageUrl: travel.imageUrl || "",
            });
        } else {
            createTravelMutation.mutate({
                title: travel.title,
                description: travel.description,
                origin: travel.origin,
                departureDate: travel.departureDate || "",
                returnDate: travel.returnDate || "",
                travelers: travel.travelers || "",
                price: travel.price,
                imageUrl: travel.imageUrl || "",
            });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Viagens</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie as viagens disponíveis para reserva
                        </p>
                    </div>
                    <Button
                        onClick={handleAddTravel}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Viagem
                    </Button>
                </div>

                {/* Travels Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {travelsQuery.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando viagens...
                        </div>
                    ) : travels.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Plus className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhuma viagem cadastrada</p>
                            <Button onClick={handleAddTravel} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar primeira viagem
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Origem
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Data Ida
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Preço
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {travels.map((travel) => (
                                    <tr
                                        key={travel.id}
                                        className="hover:bg-blue-50/50 transition-all duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{travel.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{travel.origin}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{travel.departureDate}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-blue-600">{travel.price}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditTravel(travel)}
                                                    className="h-9 w-9 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                                    aria-label="Editar viagem"
                                                >
                                                    <SquarePen className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTravel(travel.id!, travel.title)}
                                                    className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                    aria-label="Excluir viagem"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modals */}
                <TravelModal
                    isOpen={travelModalOpen}
                    onClose={() => setTravelModalOpen(false)}
                    onSave={handleSaveTravel}
                    initialData={selectedTravel}
                    isLoading={createTravelMutation.isPending || updateTravelMutation.isPending}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Excluir Viagem"
                    itemName={travelToDelete?.title}
                    onConfirm={handleConfirmDelete}
                    isLoading={deleteTravelMutation.isPending}
                />
            </div>
        </AdminLayout>
    );
}
