import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RoomsManagerProps {
    propertyId: number;
}

interface Room {
    id: number;
    propertyId: number;
    roomTypeId: number;
    roomTypeName: string;
}

interface Bed {
    id: number;
    bedTypeId: number;
    quantity: number;
    bedTypeName: string;
}

export function RoomsManager({ propertyId }: RoomsManagerProps) {
    const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null);
    const [roomBeds, setRoomBeds] = useState<Record<number, Bed[]>>({});

    // New room form
    const [newRoomTypeId, setNewRoomTypeId] = useState<string>("");

    // New bed form
    const [newBedRoomId, setNewBedRoomId] = useState<number | null>(null);
    const [newBedTypeId, setNewBedTypeId] = useState<string>("");
    const [newBedQuantity, setNewBedQuantity] = useState("1");

    // Queries
    const { data: roomTypes = [], isLoading: isLoadingRoomTypes } = (trpc as any).roomTypes.list.useQuery();
    const { data: bedTypes = [], isLoading: isLoadingBedTypes } = (trpc as any).bedTypes.list.useQuery();
    const { data: propertyRooms = [], refetch: refetchRooms } =
        (trpc as any).propertyRooms.listByProperty.useQuery({ propertyId });

    console.log('[RoomsManager] Room Types:', roomTypes);
    console.log('[RoomsManager] Bed Types:', bedTypes);
    console.log('[RoomsManager] Property Rooms:', propertyRooms);
    // Mutations
    const createRoomMutation = (trpc as any).propertyRooms.create.useMutation({
        onSuccess: () => {
            toast.success("Quarto adicionado com sucesso!");
            refetchRooms();
            setNewRoomTypeId("");
        },
        onError: (error: any) => {
            toast.error(`Erro ao adicionar quarto: ${error.message}`);
        },
    });

    const updateRoomMutation = (trpc as any).propertyRooms.update.useMutation({
        onSuccess: () => {
            toast.success("Quarto atualizado com sucesso!");
            refetchRooms();
        },
        onError: (error: any) => {
            toast.error(`Erro ao atualizar quarto: ${error.message}`);
        },
    });

    const deleteRoomMutation = (trpc as any).propertyRooms.delete.useMutation({
        onSuccess: () => {
            toast.success("Quarto removido com sucesso!");
            refetchRooms();
            setExpandedRoomId(null);
        },
        onError: (error: any) => {
            toast.error(`Erro ao remover quarto: ${error.message}`);
        },
    });

    const createBedMutation = (trpc as any).roomBeds.create.useMutation({
        onSuccess: () => {
            toast.success("Cama adicionada com sucesso!");
            if (newBedRoomId) {
                loadRoomBeds(newBedRoomId);
            }
            setNewBedRoomId(null);
            setNewBedTypeId("");
            setNewBedQuantity("1");
        },
        onError: (error: any) => {
            toast.error(`Erro ao adicionar cama: ${error.message}`);
        },
    });

    const updateBedMutation = (trpc as any).roomBeds.update.useMutation({
        onSuccess: (_: any, variables: any) => {
            toast.success("Cama atualizada com sucesso!");
            const roomId = roomBeds[variables.id]?.[0]?.id;
            if (roomId) {
                loadRoomBeds(roomId);
            }
        },
        onError: (error: any) => {
            toast.error(`Erro ao atualizar cama: ${error.message}`);
        },
    });

    const deleteBedMutation = (trpc as any).roomBeds.delete.useMutation({
        onSuccess: () => {
            toast.success("Cama removida com sucesso!");
            if (expandedRoomId) {
                loadRoomBeds(expandedRoomId);
            }
        },
        onError: (error: any) => {
            toast.error(`Erro ao remover cama: ${error.message}`);
        },
    });

    const loadRoomBeds = async (roomId: number) => {
        try {
            const beds = await (trpc as any).roomBeds.listByRoom.query({ roomId });
            setRoomBeds((prev) => ({ ...prev, [roomId]: beds as Bed[] }));
        } catch (error) {
            console.error("Error loading beds:", error);
        }
    };

    const handleExpandRoom = (roomId: number) => {
        if (expandedRoomId === roomId) {
            setExpandedRoomId(null);
        } else {
            setExpandedRoomId(roomId);
            loadRoomBeds(roomId);
        }
    };

    const handleAddRoom = () => {
        if (!newRoomTypeId) {
            toast.error("Selecione um tipo de quarto");
            return;
        }

        createRoomMutation.mutate({
            propertyId,
            roomTypeId: parseInt(newRoomTypeId),
        });
    };

    const handleDeleteRoom = (roomId: number) => {
        if (confirm("Tem certeza que deseja remover este quarto? Todas as camas serão removidas também.")) {
            deleteRoomMutation.mutate({ id: roomId });
        }
    };

    const handleAddBed = (roomId: number) => {
        if (!newBedTypeId) {
            toast.error("Selecione um tipo de cama");
            return;
        }

        createBedMutation.mutate({
            roomId,
            bedTypeId: parseInt(newBedTypeId),
            quantity: parseInt(newBedQuantity),
        });
    };

    const handleDeleteBed = (bedId: number) => {
        if (confirm("Tem certeza que deseja remover esta cama?")) {
            deleteBedMutation.mutate({ id: bedId });
        }
    };

    const getRoomDisplayName = (room: Room, index: number) => {
        return `${room.roomTypeName} ${index + 1}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Quartos e Camas</h3>
                {/* Add New Room */}
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Adicionar Quarto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <Label>Tipo de Quarto *</Label>
                            <Select value={newRoomTypeId} onValueChange={setNewRoomTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map((type: any) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleAddRoom}
                                disabled={createRoomMutation.isPending}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Quarto
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Rooms List */}
                {propertyRooms.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        Nenhum quarto adicionado ainda
                    </p>
                ) : (
                    <div className="space-y-3">
                        {propertyRooms.map((room: any, index: number) => (
                            <div key={room.id} className="border rounded-lg overflow-hidden">
                                {/* Room Header */}
                                <div className="bg-white p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{getRoomDisplayName(room, index)}</h4>
                                                <span className="text-sm text-muted-foreground">
                                                    ({room.roomTypeName})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteRoom(room.id)}
                                                disabled={deleteRoomMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleExpandRoom(room.id)}
                                            >
                                                {expandedRoomId === room.id ? "Ocultar" : "Gerenciar Camas"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Beds Section */}
                                {expandedRoomId === room.id && (
                                    <div className="bg-gray-50 p-4 border-t">
                                        <h5 className="font-medium mb-3">Camas neste quarto</h5>

                                        {/* Add Bed Form */}
                                        <div className="bg-white border rounded-lg p-3 mb-3">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div>
                                                    <Label>Tipo de Cama *</Label>
                                                    <Select
                                                        value={newBedRoomId === room.id ? newBedTypeId : ""}
                                                        onValueChange={(value) => {
                                                            setNewBedRoomId(room.id);
                                                            setNewBedTypeId(value);
                                                        }}
                                                    >
                                                        <SelectTrigger>
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
                                                    <Label>Quantidade *</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={newBedRoomId === room.id ? newBedQuantity : "1"}
                                                        onChange={(e) => {
                                                            setNewBedRoomId(room.id);
                                                            setNewBedQuantity(e.target.value);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-end md:col-span-2">
                                                    <Button
                                                        onClick={() => handleAddBed(room.id)}
                                                        disabled={createBedMutation.isPending || newBedRoomId !== room.id}
                                                        className="w-full"
                                                        size="sm"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Adicionar Cama
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Beds List */}
                                        {roomBeds[room.id]?.length === 0 ? (
                                            <p className="text-muted-foreground text-sm text-center py-4">
                                                Nenhuma cama adicionada ainda
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {roomBeds[room.id]?.map((bed) => (
                                                    <div
                                                        key={bed.id}
                                                        className="bg-white border rounded p-3 flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <span className="font-medium">{bed.bedTypeName}</span>
                                                            <span className="text-sm text-muted-foreground ml-2">
                                                                × {bed.quantity}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteBed(bed.id)}
                                                            disabled={deleteBedMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
