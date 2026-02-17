import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, Bed, Users, ImageIcon } from "lucide-react";
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
import { SpaceImageUpload } from "@/components/SpaceImageUpload";

export interface LocalSpace {
    tempId: string; // ID temporário único
    roomTypeId: number;
    roomTypeName: string;
    name: string | null;
    beds: LocalBed[];
    imageFile?: File | null;
    imagePreview?: string | null;
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
    // Apenas um espaço aberto por vez (null = nenhum)
    const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);

    // Buscar tipos de espaço e tipos de cama
    const { data: roomTypes = [] } = trpc.roomTypes.list.useQuery();
    const { data: bedTypes = [] } = trpc.bedTypes.list.useQuery();

    // Estado para novo espaço
    const [newRoomTypeId, setNewRoomTypeId] = useState<string>("");

    // Estados para nova cama em cada espaço
    const [newBedStates, setNewBedStates] = useState<Record<string, { bedTypeId: string; quantity: string }>>({});

    // Estados para dialogs de deleção
    const [deleteSpaceDialog, setDeleteSpaceDialog] = useState<{ open: boolean; spaceId?: string; spaceName?: string }>({ open: false });
    const [deleteBedDialog, setDeleteBedDialog] = useState<{ open: boolean; spaceId?: string; bedId?: string; bedName?: string }>({ open: false });

    const listRef = useRef<HTMLDivElement>(null);

    // Toggle exclusivo: abre um, fecha o resto
    const toggleSpace = (tempId: string) => {
        setExpandedSpaceId((prev) => (prev === tempId ? null : tempId));
    };

    const handleAddSpace = () => {
        if (!newRoomTypeId) return;

        const roomType = roomTypes.find((rt: { id: number; name: string }) => rt.id === parseInt(newRoomTypeId));
        if (!roomType) return;

        const newSpace: LocalSpace = {
            tempId: `space-${Date.now()}-${Math.random()}`,
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            name: null,
            beds: [],
        };

        // Adiciona no início da lista
        onSpacesChange([newSpace, ...spaces]);
        setNewRoomTypeId("");
        // Auto-expande o novo espaço
        setExpandedSpaceId(newSpace.tempId);
    };

    const handleDeleteSpace = (tempId: string) => {
        setDeleteSpaceDialog({ open: true });
    };

    const handleConfirmDeleteSpace = () => {
        if (deleteSpaceDialog.spaceId) {
            const tempId = deleteSpaceDialog.spaceId;
            onSpacesChange(spaces.filter((s) => s.tempId !== tempId));
            if (expandedSpaceId === tempId) setExpandedSpaceId(null);
            const newStates = { ...newBedStates };
            delete newStates[tempId];
            setNewBedStates(newStates);
        }
        setDeleteSpaceDialog({ open: false });
    };

    const handleUpdateSpaceName = (tempId: string, name: string) => {
        onSpacesChange(spaces.map((s) => (s.tempId === tempId ? { ...s, name: name || null } : s)));
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

    const handleDeleteBed = (spaceTempId: string, bedTempId: string, bedName: string) => {
        setDeleteBedDialog({ open: true, spaceId: spaceTempId, bedId: bedTempId, bedName });
    };

    const handleConfirmDeleteBed = () => {
        if (deleteBedDialog.spaceId && deleteBedDialog.bedId) {
            onSpacesChange(spaces.map(s =>
                s.tempId === deleteBedDialog.spaceId
                    ? { ...s, beds: s.beds.filter(b => b.tempId !== deleteBedDialog.bedId) }
                    : s
            ));
        }
        setDeleteBedDialog({ open: false });
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

    const handleImageUpload = (spaceTempId: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            onSpacesChange(spaces.map(s =>
                s.tempId === spaceTempId
                    ? { ...s, imageFile: file, imagePreview: reader.result as string }
                    : s
            ));
        };
        reader.readAsDataURL(file);
    };

    const handleImageChange = (spaceTempId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleImageUpload(spaceTempId, file);
    };

    const handleImageDrop = (spaceTempId: string, event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) handleImageUpload(spaceTempId, file);
    };

    const handleRemoveImage = (spaceTempId: string) => {
        onSpacesChange(spaces.map(s =>
            s.tempId === spaceTempId
                ? { ...s, imageFile: null, imagePreview: null }
                : s
        ));
    };

    const getSpaceCapacity = (space: LocalSpace) =>
        space.beds.reduce((sum, bed) => sum + bed.quantity * bed.sleepsCount, 0);

    const getBedCount = (space: LocalSpace) =>
        space.beds.reduce((sum, bed) => sum + bed.quantity, 0);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-1">Configuração de Espaços e Dormidas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Monte os espaços do imóvel e defina as camas em cada um deles.
                </p>
            </div>

            {/* Botão Adicionar */}
            <div className="bg-background pb-3 pt-1 border-b mb-4">
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Label className="text-sm mb-1.5 block font-medium">Adicionar novo espaço</Label>
                        <Select value={newRoomTypeId} onValueChange={setNewRoomTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de espaço..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roomTypes.map((rt: any) => (
                                    <SelectItem key={rt.id} value={rt.id.toString()}>
                                        {rt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddSpace} disabled={!newRoomTypeId} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Lista de Espaços */}
            <div ref={listRef} className="space-y-2">
                {spaces.length === 0 ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl py-12 text-center">
                        <Bed className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground font-medium">Nenhum espaço adicionado</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Selecione um tipo de espaço acima para começar
                        </p>
                    </div>
                ) : (
                    spaces.map((space, index) => {
                        const isOpen = expandedSpaceId === space.tempId;
                        const displayName = space.name || `${space.roomTypeName} ${index + 1}`;
                        const capacity = getSpaceCapacity(space);
                        const bedCount = getBedCount(space);
                        const bedState = newBedStates[space.tempId] || { bedTypeId: "", quantity: "1" };
                        const hasImage = !!space.imagePreview;

                        return (
                            <div
                                key={space.tempId}
                                className={cn(
                                    "border rounded-xl overflow-hidden transition-all duration-200",
                                    isOpen
                                        ? "border-primary/40 shadow-md bg-background"
                                        : "border-border hover:border-primary/20 hover:shadow-sm bg-background"
                                )}
                            >
                                {/* Header - sempre visível */}
                                <button
                                    type="button"
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                        isOpen ? "bg-primary/5" : "hover:bg-muted/50"
                                    )}
                                    onClick={() => toggleSpace(space.tempId)}
                                >
                                    {/* Miniatura da imagem (se tiver) */}
                                    {hasImage ? (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border">
                                            <img
                                                src={space.imagePreview!}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
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
                                            {bedCount > 0 ? (
                                                <>
                                                    <span className="flex items-center gap-1">
                                                        <Bed className="h-3 w-3" />
                                                        {bedCount} cama{bedCount !== 1 ? "s" : ""}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {capacity} pessoa{capacity !== 1 ? "s" : ""}
                                                    </span>
                                                    {hasImage && (
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

                                    {/* Ações no header */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteSpaceDialog({ open: true, spaceId: space.tempId, spaceName: displayName });
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
                                </button>

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
                                                <Label className="text-sm font-medium">Nome do espaço (opcional)</Label>
                                                <Input
                                                    value={space.name || ""}
                                                    onChange={(e) => handleUpdateSpaceName(space.tempId, e.target.value)}
                                                    placeholder={`${space.roomTypeName} ${index + 1}`}
                                                    className="mt-1.5"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Se vazio, será usado "{space.roomTypeName} {index + 1}"
                                                </p>
                                            </div>

                                            {/* Camas */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Camas neste espaço</Label>

                                                {space.beds.length > 0 && (
                                                    <div className="space-y-1.5 mb-3">
                                                        {space.beds.map((bed) => (
                                                            <div
                                                                key={bed.tempId}
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
                                                                        setDeleteBedDialog({ open: true, spaceId: space.tempId, bedId: bed.tempId, bedName: bed.bedTypeName });
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {space.beds.length === 0 && (
                                                    <p className="text-sm text-amber-600 mb-3">
                                                        Adicione pelo menos uma cama ao espaço
                                                    </p>
                                                )}

                                                <div className="bg-muted/30 border rounded-lg p-3 space-y-3">
                                                    <div className="grid grid-cols-[1fr_80px] gap-2">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground">Tipo de cama</Label>
                                                            <Select
                                                                value={bedState.bedTypeId}
                                                                onValueChange={(value) => setBedState(space.tempId, 'bedTypeId', value)}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Selecione..." />
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
                                                            <Label className="text-xs text-muted-foreground">Qtd.</Label>
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
                                                        variant="outline"
                                                        className="w-full"
                                                        disabled={!bedState.bedTypeId || !bedState.quantity}
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                                        Adicionar cama
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Upload de Imagem */}
                                            <SpaceImageUpload
                                                imagePreview={space.imagePreview || null}
                                                onImageChange={(file) => handleImageUpload(space.tempId, file)}
                                                onImageRemove={() => handleRemoveImage(space.tempId)}
                                                uploadId={space.tempId}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

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
                itemName={deleteSpaceDialog.spaceName}
                onConfirm={handleConfirmDeleteSpace}
            />

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
