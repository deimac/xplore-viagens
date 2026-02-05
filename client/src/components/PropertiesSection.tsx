import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, MapPin, Users, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Property } from "@/types/properties";
import { PropertyModal } from "@/components/PropertyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PropertiesSection() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const { data: properties = [], isLoading, error, refetch } = trpc.properties.listAll.useQuery(
        undefined,
        {
            staleTime: 1000 * 60 * 5, // 5 minutos
            gcTime: 1000 * 60 * 10, // 10 minutos (nova propriedade para React Query v5)
            refetchOnWindowFocus: false,
            retry: 1, // Reduz tentativas de retry
        }
    );

    const deleteMutation = trpc.properties.delete.useMutation({
        onSuccess: () => {
            toast.success("Hospedagem excluída com sucesso!");
            refetch();
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
        if (window.confirm(`Tem certeza que deseja excluir "${property.name}"?`)) {
            await deleteMutation.mutateAsync({ id: property.id });
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

    // Memoize the properties list to prevent unnecessary re-renders
    const propertiesList = useMemo(() => {
        if (!properties || properties.length === 0) return null;

        return properties.map((property: Property) => (
            <div
                key={property.id}
                className="bg-card border rounded-lg p-6 transition-all hover:shadow-md"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold truncate">{property.name}</h3>
                            {(property as any).property_type_name && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {(property as any).property_type_name}
                                </Badge>
                            )}
                            <Badge
                                variant={property.active ? "default" : "secondary"}
                                className={cn(
                                    property.active
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                )}
                            >
                                {property.active ? "Ativo" : "Inativo"}
                            </Badge>
                            {property.image_count && property.image_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {property.image_count} {property.image_count === 1 ? "imagem" : "imagens"}
                                </Badge>
                            )}
                        </div>

                        {property.description_short && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {property.description_short}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{property.city}{property.state_region && `, ${property.state_region}`}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{property.max_guests} hóspedes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                <span>{property.bedrooms} quarto{property.bedrooms !== 1 ? "s" : ""}</span>
                            </div>
                            {property.area_m2 && (
                                <div className="flex items-center gap-1">
                                    <span>📐</span>
                                    <span>{property.area_m2} m²</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(property)}
                            disabled={toggleActiveMutation.isPending}
                            title={property.active ? "Desativar propriedade" : "Ativar propriedade"}
                        >
                            {property.active ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(property)}
                            title="Editar propriedade"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(property)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            title="Excluir propriedade"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        ));
    }, [properties, deleteMutation.isPending, toggleActiveMutation.isPending]);

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Hospedagens</h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie propriedades para hospedagem
                        </p>
                    </div>
                    <Button onClick={handleCreateNew} className="bg-accent text-accent-foreground">
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
                {/* Header sempre visível */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Hospedagens</h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie propriedades para hospedagem
                        </p>
                    </div>
                    <Button onClick={handleCreateNew} className="bg-accent text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Hospedagem
                    </Button>
                </div>

                {/* Loading rápido e simples */}
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Carregando hospedagens...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Hospedagens</h2>
                    <p className="text-sm text-muted-foreground">
                        Gerencie propriedades para hospedagem
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="bg-accent text-accent-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Hospedagem
                </Button>
            </div>

            {/* Properties List */}
            <div className="space-y-4">
                {properties.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma hospedagem cadastrada</h3>
                        <p className="text-muted-foreground mb-4">
                            Comece criando sua primeira propriedade para hospedagem
                        </p>
                        <Button onClick={handleCreateNew} className="bg-accent text-accent-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeira Hospedagem
                        </Button>
                    </div>
                ) : (
                    propertiesList
                )}
            </div>

            {/* Modal */}
            <PropertyModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                property={selectedProperty}
                onSave={handleModalSave}
            />
        </div>
    );
}