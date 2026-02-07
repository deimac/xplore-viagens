import { useState, useMemo } from "react";
import { Plus, SquarePen, Trash2, Eye, EyeOff, MapPin, Users, Home, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Property } from "@/types/properties";
import { PropertyModal } from "@/components/PropertyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

export function PropertiesSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<{ id: number; name: string } | null>(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

    const { data: properties = [], isLoading, error, refetch } = trpc.properties.listAll.useQuery(
        undefined
    );
    // Debug: mostrar dados recebidos
    console.log('properties:', properties);

    const deleteMutation = trpc.properties.delete.useMutation({
        onSuccess: () => {
            toast.success("Hospedagem excluída com sucesso!");
            refetch();
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao excluir hospedagem");
        },
    });

    const toggleActiveMutation = trpc.properties.toggleActive.useMutation({
        onSuccess: () => {
            toast.success("Status atualizado com sucesso!");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao atualizar status");
        },
    });

    const handleEdit = (property: Property) => {
        setSelectedProperty(property);
        setIsModalOpen(true);
    };

    const handleDelete = async (property: Property) => {
        setPropertyToDelete({ id: property.id, name: property.name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (propertyToDelete) {
            await deleteMutation.mutateAsync({ id: propertyToDelete.id });
        }
    };

    const handleToggleActive = async (property: Property) => {
        await toggleActiveMutation.mutateAsync({
            id: property.id,
            active: !property.active,
        });
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProperty(null);
    };

    const handleModalSave = () => {
        refetch();
    };

    const handleCreateNew = () => {
        setSelectedProperty(null);
        setIsModalOpen(true);
    };

    const toggleDescription = (propertyId: number) => {
        setExpandedDescriptions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(propertyId)) {
                newSet.delete(propertyId);
            } else {
                newSet.add(propertyId);
            }
            return newSet;
        });
    };

    const truncateText = (text: string | null | undefined, maxLength: number = 150) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                            Hospedagens
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie as propriedades disponíveis para hospedagem
                        </p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Hospedagem
                    </Button>
                </div>

                <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
                        Erro ao carregar hospedagens
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">
                        {error.message || "Erro desconhecido"}
                    </p>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                            Hospedagens
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie as propriedades disponíveis para hospedagem
                        </p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Hospedagem
                    </Button>
                </div>

                <div className="p-12 text-center text-muted-foreground">
                    Carregando hospedagens...
                </div>
            </div>
        );
    }

    return (

        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        Hospedagens
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as propriedades disponíveis para hospedagem
                    </p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Hospedagem
                </Button>
            </div>

            {/* Properties Table */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                {properties.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
                            <Building2 className="w-8 h-8 text-pink-600" />
                        </div>
                        <p className="text-muted-foreground mb-4">Nenhuma hospedagem cadastrada</p>
                        <Button
                            onClick={handleCreateNew}
                            variant="outline"
                            className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar primeira hospedagem
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-gray-200">
                                    <th className="text-left p-4 font-semibold text-gray-700">Nome</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Localização</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Detalhes</th>
                                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-right p-4 font-semibold text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {properties.map((property: Property) => (
                                    <tr
                                        key={property.id}
                                        className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-start gap-2">
                                                <Building2 className="w-4 h-4 text-pink-600 mt-1 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">{property.name}</div>
                                                    {(property as any).property_type_name && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {(property as any).property_type_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                                <span>{property.city}{property.state_region && `, ${property.state_region}`}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>{property.max_guests}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Home className="w-3 h-3" />
                                                        <span>{property.bedrooms}</span>
                                                    </div>
                                                    {/* Área não disponível no tipo Property */}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge
                                                className={cn(
                                                    "font-normal",
                                                    property.active
                                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0"
                                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                                )}
                                            >
                                                {property.active ? (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5"></span>
                                                        Ativo
                                                    </>
                                                ) : (
                                                    "Inativo"
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(property)}
                                                    disabled={toggleActiveMutation.isPending}
                                                    className="hover:bg-pink-50"
                                                    title={property.active ? "Desativar" : "Ativar"}
                                                >
                                                    {property.active ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(property)}
                                                    className="hover:bg-pink-50"
                                                    title="Editar"
                                                >
                                                    <SquarePen className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(property)}
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                    title="Excluir"
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
            {/* Modal */}
            <PropertyModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                property={selectedProperty}
                onSave={handleModalSave}
            />
            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Excluir Hospedagem"
                description="Esta ação não pode ser desfeita. A hospedagem será permanentemente removida."
                itemName={propertyToDelete?.name}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}