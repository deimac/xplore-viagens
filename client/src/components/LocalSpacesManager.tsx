import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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

export interface LocalSpace {
    tempId: string; // ID temporário único
    roomTypeId: number;
    roomTypeName: string;
    name: string | null;
    beds: LocalBed[];
}

export interface LocalBed {
    tempId: string;
    bedTypeId: number;
    quantity: number;
    bedTypeName: string;
    sleepsCount: number;
}

interface LocalSpacesManagerProps {
    spaces: LocalSpace[];
    onSpacesChange: (spaces: LocalSpace[]) => void;
}

export function LocalSpacesManager({ spaces, onSpacesChange }: LocalSpacesManagerProps) {
    const [openSpaces, setOpenSpaces] = useState<Set<string>>(new Set());

    // Buscar tipos de espaço e tipos de cama
    const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();
    const { data: bedTypes = [] } = trpc.bedTypes.list.useQuery();

    // Estado para novo espaço
    const [newRoomTypeId, setNewRoomTypeId] = useState<string>("");

    // Estados para nova cama em cada espaço
    const [newBedStates, setNewBedStates] = useState<Record<string, { bedTypeId: string; quantity: string }>>({});

    const toggleSpace = (tempId: string) => {
        const newOpenSpaces = new Set(openSpaces);
        if (newOpenSpaces.has(tempId)) {
            newOpenSpaces.delete(tempId);
        } else {
            newOpenSpaces.add(tempId);
        }
        setOpenSpaces(newOpenSpaces);
    };

    const handleAddSpace = () => {
        if (!newRoomTypeId) return;

        const roomType = roomTypes.find((rt: { id: number, name: string }) => rt.id === parseInt(newRoomTypeId));
        if (!roomType) return;

        const newSpace: LocalSpace = {
            tempId: `space-${Date.now()}-${Math.random()}`,
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            name: null,
            beds: [],
        };

        onSpacesChange([...spaces, newSpace]);
        setNewRoomTypeId("");
    };

    const handleDeleteSpace = (tempId: string) => {
        onSpacesChange(spaces.filter(s => s.tempId !== tempId));
        // Limpar estado de nova cama para este espaço
        const newStates = { ...newBedStates };
        delete newStates[tempId];
        setNewBedStates(newStates);
    };

    const handleUpdateSpaceName = (tempId: string, name: string) => {
        onSpacesChange(spaces.map(s =>
            s.tempId === tempId ? { ...s, name: name || null } : s
        ));
    };

    const handleAddBed = (spaceTempId: string) => {
        const bedState = newBedStates[spaceTempId];
        if (!bedState?.bedTypeId || !bedState?.quantity) return;

        const bedType = bedTypes.find((bt: { id: number, name: string, sleeps_count: number }) => bt.id === parseInt(bedState.bedTypeId));
        if (!bedType) return;

        const quantity = parseInt(bedState.quantity);
        if (isNaN(quantity) || quantity < 1) return;

        const newBed: LocalBed = {
            tempId: `bed-${Date.now()}-${Math.random()}`,
            bedTypeId: bedType.id,
            quantity,
            bedTypeName: bedType.name,
            sleepsCount: bedType.sleeps_count,
        };

        onSpacesChange(spaces.map(s =>
            s.tempId === spaceTempId
                ? { ...s, beds: [...s.beds, newBed] }
                : s
        ));

        // Limpar estado após adicionar
        setNewBedStates({
            ...newBedStates,
            [spaceTempId]: { bedTypeId: "", quantity: "1" },
        });
    };

    const handleDeleteBed = (spaceTempId: string, bedTempId: string) => {
        onSpacesChange(spaces.map(s =>
            s.tempId === spaceTempId
                ? { ...s, beds: s.beds.filter(b => b.tempId !== bedTempId) }
                : s
        ));
    };

    const setBedState = (spaceTempId: string, field: 'bedTypeId' | 'quantity', value: string) => {
        setNewBedStates({
            ...newBedStates,
            [spaceTempId]: {
                ...(newBedStates[spaceTempId] || { bedTypeId: "", quantity: "1" }),
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Configuração de Espaços e Dormidas</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Monte os espaços do imóvel e defina as camas em cada um deles.
            </p>

            {/* Espaços existentes */}
            {spaces.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <p>Nenhum espaço adicionado ainda</p>
                        <p className="text-sm mt-1">Adicione espaços para configurar as opções de dormida</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {spaces.map((space, index) => {
                        const isOpen = openSpaces.has(space.tempId);
                        const displayName = space.name || `${space.roomTypeName} ${index + 1}`;
                        const bedState = newBedStates[space.tempId] || { bedTypeId: "", quantity: "1" };

                        return (
                            <Collapsible key={space.tempId} open={isOpen} onOpenChange={() => toggleSpace(space.tempId)}>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="text-lg">{displayName}</CardTitle>
                                                </div>
                                                <CardDescription className="text-xs">
                                                    Tipo: {space.roomTypeName}
                                                    {space.beds.length > 0 && (
                                                        <span className="ml-2">
                                                            • {space.beds.reduce((sum, bed) => sum + (bed.quantity * bed.sleepsCount), 0)} pessoa(s)
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </div>

                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Remover "${displayName}"?`)) {
                                                            handleDeleteSpace(space.tempId);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>

                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CollapsibleContent>
                                        <CardContent className="pt-0">
                                            <div className="border-t pt-4 space-y-4">
                                                {/* Nome customizado */}
                                                <div>
                                                    <Label className="text-sm">Nome do espaço (opcional)</Label>
                                                    <Input
                                                        value={space.name || ""}
                                                        onChange={(e) => handleUpdateSpaceName(space.tempId, e.target.value)}
                                                        placeholder={`${space.roomTypeName} ${index + 1}`}
                                                        className="mt-1"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Se vazio, será usado "{space.roomTypeName} {index + 1}"
                                                    </p>
                                                </div>

                                                {/* Camas */}
                                                <div>
                                                    <h4 className="font-medium mb-3">Camas neste espaço</h4>

                                                    {space.beds.length === 0 ? (
                                                        <p className="text-sm text-gray-500 mb-3">Nenhuma cama adicionada</p>
                                                    ) : (
                                                        <div className="space-y-2 mb-4">
                                                            {space.beds.map((bed) => (
                                                                <div key={bed.tempId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
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
                                                                                handleDeleteBed(space.tempId, bed.tempId);
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
                                                                <Select
                                                                    value={bedState.bedTypeId}
                                                                    onValueChange={(value) => setBedState(space.tempId, 'bedTypeId', value)}
                                                                >
                                                                    <SelectTrigger className="h-9">
                                                                        <SelectValue placeholder="Selecione" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {bedTypes.map((bt: any) => (
                                                                            <SelectItem key={bt.id} value={bt.id.toString()}>
                                                                                {bt.name} ({bt.sleeps_count} pessoa{bt.sleeps_count > 1 ? 's' : ''})
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
                                                                    value={bedState.quantity}
                                                                    onChange={(e) => setBedState(space.tempId, 'quantity', e.target.value)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                        </div>

                                                        <Button
                                                            onClick={() => handleAddBed(space.tempId)}
                                                            size="sm"
                                                            className="w-full"
                                                            disabled={!bedState.bedTypeId || !bedState.quantity}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Adicionar cama
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        );
                    })}
                </div>
            )}

            {/* Adicionar novo espaço */}
            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <Label>Adicionar novo espaço</Label>
                        <div className="flex gap-2">
                            <Select value={newRoomTypeId} onValueChange={setNewRoomTypeId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Selecione o tipo de espaço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map((rt: any) => (
                                        <SelectItem key={rt.id} value={rt.id.toString()}>
                                            {rt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddSpace}
                                disabled={!newRoomTypeId}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> Configure os espaços e as camas disponíveis. Apenas espaços com camas serão exibidos na seção "Onde você vai dormir".
                </p>
            </div>
        </div>
    );
}
