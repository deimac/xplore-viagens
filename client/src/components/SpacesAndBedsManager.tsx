import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, ChevronDown, Upload, X, Bed, Users, ImageIcon, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SpacesAndBedsManagerProps {
    propertyId: number;
}

interface Space {
    id: number;
    propertyId: number;
    roomTypeId: number;
    roomTypeName: string;
    name: string | null;
    displayOrder: number;
    sleepingPhoto: string | null;
}

interface BedItem {
    id: number;
    bedTypeId: number;
    quantity: number;
    bedTypeName: string;
    sleepsCount: number;
}

function SortableSpaceCard({
    space,
    index,
    isOpen,
    onToggle,
    onUpdate,
    beds,
    onAddBed,
    onDeleteBed,
    bedTypes,
    propertyId,
    onPhotoUpdate,
    onShowDeleteDialog,
}: {
    space: Space;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: number, data: { name?: string }) => void;
    beds: BedItem[];
    onAddBed: (spaceId: number, bedTypeId: number, quantity: number) => void;
    onDeleteBed: (bedId: number) => void;
    bedTypes: any[];
    propertyId: number;
    onPhotoUpdate: () => void;
    onShowDeleteDialog: (spaceId: number, spaceName: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: space.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState(space.name || "");
    const [newBedTypeId, setNewBedTypeId] = useState("");
    const [newBedQuantity, setNewBedQuantity] = useState("1");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [deleteBedDialog, setDeleteBedDialog] = useState<{ open: boolean; bedId?: number; bedName?: string }>({ open: false });

    const displayName = space.name || `${space.roomTypeName} ${index + 1}`;
    const hasBeds = beds.length > 0;
    const capacity = beds.reduce((sum, bed) => sum + bed.quantity * bed.sleepsCount, 0);
    const bedCount = beds.reduce((sum, bed) => sum + bed.quantity, 0);

    const uploadPhotoMutation = trpc.propertyRooms.uploadPhoto.useMutation({
        onSuccess: () => {
            toast.success("Foto enviada com sucesso!");
            onPhotoUpdate();
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao enviar foto");
            setIsUploadingPhoto(false);
        },
    });

    const deletePhotoMutation = trpc.propertyRooms.deletePhoto.useMutation({
        onSuccess: () => {
            toast.success("Foto removida com sucesso!");
            onPhotoUpdate();
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao remover foto");
        },
    });

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Por favor, selecione uma imagem");
            return;
        }

        setIsUploadingPhoto(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imageData = event.target?.result as string;
                await uploadPhotoMutation.mutateAsync({
                    roomId: space.id,
                    propertyId: propertyId,
                    imageData: imageData,
                });
                setIsUploadingPhoto(false);
            } catch (error) {
                setIsUploadingPhoto(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePhoto = async () => {
        if (!confirm("Remover foto do espaço?")) return;

        await deletePhotoMutation.mutateAsync({
            roomId: space.id,
            propertyId: propertyId,
        });
    };

    const handleSaveName = () => {
        onUpdate(space.id, { name: tempName || undefined });
        setEditingName(false);
    };

    const handleAddBed = () => {
        if (!newBedTypeId) {
            toast.error("Selecione o tipo de cama");
            return;
        }
        onAddBed(space.id, parseInt(newBedTypeId), parseInt(newBedQuantity));
        setNewBedTypeId("");
        setNewBedQuantity("1");
    };

    const handleConfirmDeleteBed = () => {
        if (deleteBedDialog.bedId) {
            onDeleteBed(deleteBedDialog.bedId);
        }
        setDeleteBedDialog({ open: false });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "border rounded-xl overflow-hidden transition-all duration-200",
                isOpen
                    ? "border-primary/40 shadow-md bg-background"
                    : "border-border hover:border-primary/20 hover:shadow-sm bg-background"
            )}
        >
            {/* Header - sempre visível */}
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-3 transition-colors cursor-pointer",
                    isOpen ? "bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={onToggle}
            >
                {/* Drag handle */}
                <button
                    className="cursor-grab active:cursor-grabbing touch-none shrink-0 p-0.5"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                </button>

                {/* Miniatura */}
                {space.sleepingPhoto ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border">
                        <img src={space.sleepingPhoto} alt="" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Bed className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {space.roomTypeName}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {hasBeds ? (
                            <>
                                <span className="flex items-center gap-1">
                                    <Bed className="h-3 w-3" />
                                    {bedCount} cama{bedCount !== 1 ? "s" : ""}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {capacity} pessoa{capacity !== 1 ? "s" : ""}
                                </span>
                                {space.sleepingPhoto && (
                                    <span className="flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" />
                                        Foto
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-amber-600">Sem camas configuradas</span>
                        )}
                    </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDeleteDialog(space.id, displayName);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                        )}
                    />
                </div>
            </div>

            {/* Conteúdo expandido */}
            <div
                className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-2 border-t space-y-5">
                        {/* Nome customizado */}
                        <div>
                            <Label className="text-sm font-medium">Nome do espaço</Label>
                            {editingName ? (
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        placeholder={`${space.roomTypeName} ${index + 1}`}
                                        className="h-9"
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleSaveName} className="h-9 px-3">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 px-3"
                                        onClick={() => {
                                            setEditingName(false);
                                            setTempName(space.name || "");
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-sm text-muted-foreground">
                                        {space.name || `${space.roomTypeName} ${index + 1}`}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setEditingName(true)}
                                    >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Editar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Camas */}
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Camas neste espaço</Label>

                            {beds.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    {beds.map((bed) => (
                                        <div
                                            key={bed.id}
                                            className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg"
                                        >
                                            <Bed className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium">{bed.bedTypeName}</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {bed.quantity}x &middot; {bed.quantity * bed.sleepsCount} pessoa(s)
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => {
                                                    setDeleteBedDialog({ open: true, bedId: bed.id, bedName: bed.bedTypeName });
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {beds.length === 0 && (
                                <p className="text-sm text-amber-600 mb-3">
                                    Adicione pelo menos uma cama ao espaço
                                </p>
                            )}

                            <div className="bg-muted/30 border rounded-lg p-3 space-y-3">
                                <div className="grid grid-cols-[1fr_80px] gap-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tipo de cama</Label>
                                        <Select value={newBedTypeId} onValueChange={setNewBedTypeId}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bedTypes.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name} ({type.sleepsCount} pessoa{type.sleepsCount > 1 ? 's' : ''})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Qtd.</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={newBedQuantity}
                                            onChange={(e) => setNewBedQuantity(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleAddBed} className="w-full">
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Adicionar cama
                                </Button>
                            </div>
                        </div>

                        {/* Foto do espaço */}
                        {hasBeds && (
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Foto do espaço
                                </Label>

                                {space.sleepingPhoto ? (
                                    <div className="space-y-2">
                                        <div className="relative w-64 h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                            <img
                                                src={space.sleepingPhoto}
                                                alt={displayName}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7"
                                                onClick={handleDeletePhoto}
                                                disabled={deletePhotoMutation.isPending}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <Label htmlFor={`photo-upload-${space.id}`}>
                                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-background border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-sm">
                                                    {isUploadingPhoto ? "Enviando..." : "Substituir foto"}
                                                </span>
                                            </div>
                                            <Input
                                                id={`photo-upload-${space.id}`}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handlePhotoUpload}
                                                disabled={isUploadingPhoto}
                                            />
                                        </Label>
                                    </div>
                                ) : (
                                    <Label htmlFor={`photo-upload-${space.id}`}>
                                        <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                            <Upload className="h-6 w-6 text-muted-foreground/60" />
                                            <span className="text-sm text-muted-foreground">
                                                {isUploadingPhoto ? "Enviando foto..." : "Clique para enviar uma foto"}
                                            </span>
                                            <span className="text-xs text-muted-foreground/60">
                                                JPG, PNG ou WEBP
                                            </span>
                                        </div>
                                        <Input
                                            id={`photo-upload-${space.id}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoUpload}
                                            disabled={isUploadingPhoto}
                                        />
                                    </Label>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Bed Dialog */}
            <DeleteConfirmDialog
                open={deleteBedDialog.open}
                onOpenChange={(open) => setDeleteBedDialog({ ...deleteBedDialog, open })}
                title="Excluir Cama"
                itemName={deleteBedDialog.bedName}
                description="Tem certeza que deseja remover esta cama do espaço? Esta ação não pode ser desfeita."
                onConfirm={handleConfirmDeleteBed}
            />
        </div>
    );
}

export function SpacesAndBedsManager({ propertyId }: SpacesAndBedsManagerProps) {
    // Apenas um espaço aberto por vez (null = nenhum)
    const [expandedSpaceId, setExpandedSpaceId] = useState<number | null>(null);
    const [newSpaceTypeId, setNewSpaceTypeId] = useState("");
    const [spaceBeds, setSpaceBeds] = useState<Record<number, BedItem[]>>({});
    const [deleteSpaceDialog, setDeleteSpaceDialog] = useState<{
        open: boolean;
        id?: number;
        name?: string;
    }>({ open: false });

    const utils = (trpc as any).useContext();

    // Queries
    const { data: spaceTypes = [], isLoading: isLoadingSpaceTypes } =
        (trpc as any).roomTypes.list.useQuery();
    const { data: bedTypes = [], isLoading: isLoadingBedTypes } =
        (trpc as any).bedTypes.list.useQuery();
    const { data: spaces = [] as Space[], refetch: refetchSpaces } =
        (trpc as any).propertyRooms.listByProperty.useQuery({ propertyId });

    // Mutations
    const createSpace = (trpc as any).propertyRooms.create.useMutation({
        onSuccess: (data: any) => {
            refetchSpaces();
            toast.success("Espaço adicionado!");
            setNewSpaceTypeId("");
            // Auto-expande e fecha os demais
            if (data?.id) {
                setExpandedSpaceId(data.id);
                loadSpaceBeds(data.id);
            }
        },
        onError: (error: any) => {
            toast.error("Erro ao adicionar espaço: " + error.message);
        },
    });

    const updateSpace = (trpc as any).propertyRooms.update.useMutation({
        onSuccess: () => {
            refetchSpaces();
            toast.success("Espaço atualizado!");
        },
        onError: (error: any) => {
            toast.error("Erro ao atualizar espaço: " + error.message);
        },
    });

    const deleteSpace = (trpc as any).propertyRooms.delete.useMutation({
        onSuccess: () => {
            refetchSpaces();
            toast.success("Espaço removido!");
        },
        onError: (error: any) => {
            toast.error("Erro ao remover espaço: " + error.message);
        },
    });

    const reorderSpaces = (trpc as any).propertyRooms.reorder.useMutation({
        onSuccess: () => {
            refetchSpaces();
            toast.success("Ordem atualizada!");
        },
        onError: (error: any) => {
            toast.error("Erro ao reordenar: " + error.message);
        },
    });

    const createBed = (trpc as any).roomBeds.create.useMutation({
        onSuccess: (_: any, variables: { roomId: number; bedTypeId: number; quantity: number }) => {
            loadSpaceBeds(variables.roomId);
            toast.success("Cama adicionada!");
        },
        onError: (error: any) => {
            toast.error("Erro ao adicionar cama: " + error.message);
        },
    });

    const deleteBed = (trpc as any).roomBeds.delete.useMutation({
        onSuccess: () => {
            toast.success("Cama removida!");
        },
        onError: (error: any) => {
            toast.error("Erro ao remover cama: " + error.message);
        },
    });

    // Load beds for a space
    const loadSpaceBeds = async (spaceId: number) => {
        try {
            const beds = await utils.client.roomBeds.listByRoom.query({ roomId: spaceId });
            setSpaceBeds((prev) => ({ ...prev, [spaceId]: beds }));
        } catch (error) {
            console.error("Error loading beds:", error);
        }
    };

    // Toggle exclusivo: abre um, fecha o resto
    const toggleSpace = (spaceId: number) => {
        if (expandedSpaceId === spaceId) {
            setExpandedSpaceId(null);
        } else {
            setExpandedSpaceId(spaceId);
            if (!spaceBeds[spaceId]) {
                loadSpaceBeds(spaceId);
            }
        }
    };

    // Drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = spaces.findIndex((s: Space) => s.id === active.id);
            const newIndex = spaces.findIndex((s: Space) => s.id === over.id);

            const newSpaces = arrayMove(spaces, oldIndex, newIndex) as Space[];
            const roomIds = newSpaces.map((s) => s.id);

            reorderSpaces.mutate({ propertyId, roomIds });
        }
    };

    const handleAddSpace = () => {
        if (!newSpaceTypeId) {
            toast.error("Selecione o tipo de espaço");
            return;
        }

        const maxOrder = spaces.length > 0
            ? Math.max(...spaces.map((s: Space) => s.displayOrder))
            : -1;

        createSpace.mutate({
            propertyId,
            roomTypeId: parseInt(newSpaceTypeId),
            displayOrder: maxOrder + 1,
        });
    };

    const handleUpdateSpace = (id: number, data: { name?: string }) => {
        updateSpace.mutate({ id, ...data });
    };

    const handleDeleteSpace = (id: number, name: string) => {
        setDeleteSpaceDialog({ open: true, id, name });
    };

    const handleConfirmDeleteSpace = () => {
        if (deleteSpaceDialog.id) {
            deleteSpace.mutate(
                { id: deleteSpaceDialog.id },
                {
                    onSuccess: () => {
                        if (expandedSpaceId === deleteSpaceDialog.id) {
                            setExpandedSpaceId(null);
                        }
                        setDeleteSpaceDialog({ open: false });
                    },
                }
            );
        }
    };

    const handleAddBed = (spaceId: number, bedTypeId: number, quantity: number) => {
        createBed.mutate(
            { roomId: spaceId, bedTypeId, quantity },
            {
                onSuccess: () => {
                    loadSpaceBeds(spaceId);
                },
            }
        );
    };

    const handleDeleteBed = (bedId: number, spaceId: number) => {
        deleteBed.mutate(
            { id: bedId },
            {
                onSuccess: () => {
                    loadSpaceBeds(spaceId);
                },
            }
        );
    };

    if (isLoadingSpaceTypes || isLoadingBedTypes) {
        return <div className="p-4">Carregando...</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-1">Configuração de Espaços e Dormidas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Monte os espaços do imóvel e defina as camas em cada um deles. Arraste para reordenar.
                </p>
            </div>

            {/* Botão Adicionar */}
            <div className="bg-background pb-3 pt-1 border-b mb-4">
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Label className="text-sm mb-1.5 block font-medium">Adicionar novo espaço</Label>
                        <Select value={newSpaceTypeId} onValueChange={setNewSpaceTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de espaço..." />
                            </SelectTrigger>
                            <SelectContent>
                                {spaceTypes.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddSpace} disabled={createSpace.isLoading} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Lista de Espaços */}
            {spaces.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl py-12 text-center">
                    <Bed className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Nenhum espaço configurado</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Adicione o primeiro espaço acima para começar
                    </p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={spaces.map((s: Space) => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {spaces.map((space: Space, index: number) => (
                                <SortableSpaceCard
                                    key={space.id}
                                    space={space}
                                    index={index}
                                    isOpen={expandedSpaceId === space.id}
                                    onToggle={() => toggleSpace(space.id)}
                                    onUpdate={handleUpdateSpace}
                                    onShowDeleteDialog={handleDeleteSpace}
                                    beds={spaceBeds[space.id] || []}
                                    onAddBed={handleAddBed}
                                    onDeleteBed={(bedId) => handleDeleteBed(bedId, space.id)}
                                    bedTypes={bedTypes}
                                    propertyId={propertyId}
                                    onPhotoUpdate={() => refetchSpaces()}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Dica */}
            {spaces.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                        <strong>Dica:</strong> Apenas espaços com camas serão exibidos na seção "Onde você vai dormir".
                    </p>
                </div>
            )}

            {/* Delete Space Dialog */}
            <DeleteConfirmDialog
                open={deleteSpaceDialog.open}
                onOpenChange={(open) => setDeleteSpaceDialog({ ...deleteSpaceDialog, open })}
                title="Excluir Espaço"
                itemName={deleteSpaceDialog.name}
                description="Tem certeza que deseja remover este espaço? Todas as camas associadas serão removidas. Esta ação não pode ser desfeita."
                onConfirm={handleConfirmDeleteSpace}
            />
        </div>
    );
}
