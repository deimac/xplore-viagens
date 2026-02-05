import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

interface Bed {
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
    onDelete,
    beds,
    onAddBed,
    onDeleteBed,
    bedTypes,
    propertyId,
    onPhotoUpdate,
}: {
    space: Space;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onUpdate: (id: number, data: { name?: string }) => void;
    onDelete: (id: number) => void;
    beds: Bed[];
    onAddBed: (spaceId: number, bedTypeId: number, quantity: number) => void;
    onDeleteBed: (bedId: number) => void;
    bedTypes: any[];
    propertyId: number;
    onPhotoUpdate: () => void;
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

    const displayName = space.name || `${space.roomTypeName} ${index + 1}`;
    const hasBeds = beds.length > 0;

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

    return (
        <Card ref={setNodeRef} style={style} className="mb-3">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <button
                        className="cursor-grab active:cursor-grabbing touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-gray-400" />
                    </button>

                    <div className="flex-1">
                        {editingName ? (
                            <div className="flex gap-2">
                                <Input
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    placeholder={`${space.roomTypeName} ${index + 1}`}
                                    className="h-8"
                                />
                                <Button size="sm" onClick={handleSaveName}>Salvar</Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditingName(false);
                                        setTempName(space.name || "");
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{displayName}</CardTitle>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingName(true)}
                                    className="h-6 px-2 text-xs"
                                >
                                    Editar nome
                                </Button>
                            </div>
                        )}
                        <CardDescription className="text-xs mt-1">
                            Tipo: {space.roomTypeName}
                        </CardDescription>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm(`Remover "${displayName}"?`)) {
                                onDelete(space.id);
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>

                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onToggle}>
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                </div>
            </CardHeader>

            <CollapsibleContent>
                <CardContent className="pt-0">
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Camas neste espaço</h4>

                        {beds.length === 0 ? (
                            <p className="text-sm text-gray-500 mb-3">Nenhuma cama adicionada</p>
                        ) : (
                            <div className="space-y-2 mb-4">
                                {beds.map((bed) => (
                                    <div key={bed.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                        <div className="flex-1">
                                            <span className="font-medium">{bed.bedTypeName}</span>
                                            <span className="text-sm text-gray-600 ml-2">
                                                ({bed.quantity}x) - {bed.quantity * bed.sleepsCount} pessoa(s)
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Remover esta cama?")) {
                                                    onDeleteBed(bed.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                            <h5 className="font-medium text-sm">Adicionar cama</h5>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Tipo de cama</Label>
                                    <Select value={newBedTypeId} onValueChange={setNewBedTypeId}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Selecione" />
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
                                    <Label className="text-xs">Quantidade</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={newBedQuantity}
                                        onChange={(e) => setNewBedQuantity(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            <Button size="sm" onClick={handleAddBed} className="w-full">
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar cama
                            </Button>
                        </div>

                        {/* Foto do espaço (onde você vai dormir) */}
                        {hasBeds && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-medium mb-3">Foto do espaço (onde você vai dormir)</h4>

                                {space.sleepingPhoto ? (
                                    <div className="space-y-3">
                                        <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={space.sleepingPhoto}
                                                alt={displayName}
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={handleDeletePhoto}
                                                disabled={deletePhotoMutation.isPending}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Label htmlFor={`photo-upload-${space.id}`} className="flex-1">
                                                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
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
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor={`photo-upload-${space.id}`}>
                                            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                                                <Upload className="h-8 w-8 text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {isUploadingPhoto ? "Enviando foto..." : "Clique para enviar uma foto"}
                                                </span>
                                                <span className="text-xs text-gray-500">
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </CollapsibleContent>
        </Card>
    );
}

export function SpacesAndBedsManager({ propertyId }: SpacesAndBedsManagerProps) {
    const [openSpaces, setOpenSpaces] = useState<Set<number>>(new Set());
    const [newSpaceTypeId, setNewSpaceTypeId] = useState("");
    const [spaceBeds, setSpaceBeds] = useState<Record<number, Bed[]>>({});

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
            // Auto-open the new space
            if (data?.id) {
                setOpenSpaces((prev) => new Set(prev).add(data.id));
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

    // Toggle space open/closed
    const toggleSpace = (spaceId: number) => {
        const newOpenSpaces = new Set(openSpaces);
        if (newOpenSpaces.has(spaceId)) {
            newOpenSpaces.delete(spaceId);
        } else {
            newOpenSpaces.add(spaceId);
            if (!spaceBeds[spaceId]) {
                loadSpaceBeds(spaceId);
            }
        }
        setOpenSpaces(newOpenSpaces);
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

    const handleDeleteSpace = (id: number) => {
        deleteSpace.mutate({ id });
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
                <h3 className="text-lg font-semibold mb-2">Configuração de Espaços e Dormidas</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Monte os espaços do imóvel e defina as camas em cada um deles.
                    Arraste para reordenar.
                </p>
            </div>

            {/* Add Space Form */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label className="text-sm mb-2 block">Adicionar novo espaço</Label>
                            <Select value={newSpaceTypeId} onValueChange={setNewSpaceTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de espaço" />
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
                        <div className="flex items-end">
                            <Button onClick={handleAddSpace} disabled={createSpace.isLoading}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar espaço
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Spaces List */}
            {spaces.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        Nenhum espaço configurado. Adicione o primeiro espaço acima.
                    </CardContent>
                </Card>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={spaces.map((s: Space) => s.id)} strategy={verticalListSortingStrategy}>
                        {spaces.map((space: Space, index: number) => (
                            <Collapsible key={space.id} open={openSpaces.has(space.id)}>
                                <SortableSpaceCard
                                    space={space}
                                    index={index}
                                    isOpen={openSpaces.has(space.id)}
                                    onToggle={() => toggleSpace(space.id)}
                                    onUpdate={handleUpdateSpace}
                                    onDelete={handleDeleteSpace}
                                    beds={spaceBeds[space.id] || []}
                                    onAddBed={handleAddBed}
                                    onDeleteBed={(bedId) => handleDeleteBed(bedId, space.id)}
                                    bedTypes={bedTypes}
                                    propertyId={propertyId}
                                    onPhotoUpdate={() => refetchSpaces()}
                                />
                            </Collapsible>
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
