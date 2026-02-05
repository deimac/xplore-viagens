import { useState, useEffect } from "react";
import { X, MapPin, Users, Home, Bed, Bath, Upload, Plus, DoorOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PropertyFormData, Property } from "@/types/properties";
import { PropertyImageUpload } from "@/components/PropertyImageUpload";
import { AmenitySelector } from "@/components/AmenitySelector";
import { MapPreview } from "@/components/MapPreview";
import { SpacesAndBedsManager } from "@/components/SpacesAndBedsManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageFile {
    id?: string;
    file: File | null;
    preview: string;
    is_primary: boolean;
    sort_order: number;
    existing_id?: number; // ID da imagem existente no banco
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    property?: Property | null;
    onSave: () => void;
}

const initialFormData: PropertyFormData = {
    name: "",
    description_short: "",
    description_full: "",
    property_type_id: undefined,
    address_street: "",
    address_number: "",
    address_complement: "",
    neighborhood: "",
    city: "",
    state_region: "",
    country: "Brasil",
    postal_code: "",
    max_guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    area_m2: undefined,
    is_featured: false,
};

export function PropertyModal({ isOpen, onClose, property, onSave }: Props) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
    const [images, setImages] = useState<ImageFile[]>([]);
    const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const utils = trpc.useUtils();

    // Buscar tipos de propriedade
    const { data: propertyTypes = [] } = trpc.propertyTypes.list.useQuery();

    const createMutation = trpc.properties.create.useMutation({
        onSuccess: () => {
            toast.success("Hospedagem criada com sucesso!");
            handleSuccess();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao criar hospedagem");
        },
    });

    const updateMutation = trpc.properties.update.useMutation({
        onSuccess: () => {
            toast.success("Hospedagem atualizada com sucesso!");
            handleSuccess();
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao atualizar hospedagem");
        },
    });

    const uploadImagesMutation = trpc.properties.uploadImages.useMutation({
        onSuccess: () => {
            setIsUploading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao fazer upload das imagens");
            setIsUploading(false);
        },
    });

    const updateImagesMutation = trpc.properties.updateImages.useMutation({
        onSuccess: () => {
            setIsUploading(false);
        },
        onError: (error) => {
            toast.error(error.message || "Erro ao atualizar imagens");
            setIsUploading(false);
        },
    });

    const associateAmenitiesMutation = trpc.amenities.associate.useMutation();


    // Query para buscar detalhes da propriedade incluindo imagens e comodidades
    const { data: propertyDetails } = trpc.properties.getById.useQuery(
        { id: property?.id || 0 },
        {
            enabled: !!property?.id && isOpen,
            staleTime: 1000 * 60 * 5, // 5 minutos
        }
    );

    // Armazena imagens originais para comparação
    const [originalImages, setOriginalImages] = useState<ImageFile[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (property) {
                setFormData({
                    name: property.name || "",
                    description_short: property.description_short || "",
                    description_full: property.description_full || "",
                    property_type_id: property.property_type_id || undefined,
                    address_street: property.address_street || "",
                    address_number: property.address_number || "",
                    address_complement: property.address_complement || "",
                    neighborhood: property.neighborhood || "",
                    city: property.city || "",
                    state_region: property.state_region || "",
                    country: property.country || "Brasil",
                    postal_code: property.postal_code || "",
                    max_guests: property.max_guests || 2,
                    bedrooms: property.bedrooms || 1,
                    beds: property.beds || 1,
                    bathrooms: property.bathrooms || 1,
                    area_m2: property.area_m2 || undefined,
                    is_featured: property.is_featured || false,
                });

                // Carregar imagens existentes quando os detalhes da propriedade estiverem disponíveis
                if (propertyDetails?.images) {
                    // Ordenar imagens por sort_order
                    const sortedImages = [...propertyDetails.images].sort((a, b) =>
                        (a.sort_order || 0) - (b.sort_order || 0)
                    );

                    const existingImages: ImageFile[] = sortedImages.map((img: any, index: number) => ({
                        file: null, // Para imagens existentes, não temos o arquivo original
                        preview: img.image_url,
                        is_primary: index === 0, // A primeira imagem sempre é principal
                        sort_order: index, // Reordenar baseado na posição atual
                        existing_id: img.id, // ID da imagem no banco
                    }));
                    setImages(existingImages);
                    setOriginalImages([...existingImages]); // Salva estado original para comparação
                }

                // Carregar comodidades selecionadas
                if (propertyDetails?.amenities) {
                    const amenityIds = propertyDetails.amenities.map((amenity: any) => amenity.id);
                    setSelectedAmenityIds(amenityIds);
                }
            } else {
                setFormData(initialFormData);
                setImages([]);
                setOriginalImages([]);
                setSelectedAmenityIds([]);
            }
            setCurrentStep(0);
        }
    }, [isOpen, property, propertyDetails]);

    const handleSuccess = () => {
        // Invalidar caches para garantir que as mudanças sejam refletidas
        utils.properties.listActive.invalidate();
        utils.properties.listAll.invalidate();
        utils.properties.getById.invalidate();

        onSave();
        onClose();
        setFormData(initialFormData);
        setImages([]);
        setOriginalImages([]);
        setSelectedAmenityIds([]);
        setCurrentStep(0);
        setShowMap(false);
    };



    const handleSubmit = async () => {
        if (!isFormCompleteForSubmit()) {
            toast.error("Por favor, complete todos os campos obrigatórios antes de salvar");
            return;
        }

        console.log('[PropertyModal] Dados sendo enviados:', formData);

        try {
            let propertyId: number;

            // Limpar dados antes de enviar
            const cleanedData = {
                ...formData,
                area_m2: formData.area_m2 && !isNaN(Number(formData.area_m2)) ? Number(formData.area_m2) : undefined,
            };

            if (property) {
                await updateMutation.mutateAsync({
                    id: property.id,
                    ...cleanedData,
                });
                propertyId = property.id;
            } else {
                const result = await createMutation.mutateAsync(cleanedData);
                propertyId = result.id;
            }

            // Gerenciar imagens de forma inteligente
            if (images.length > 0 || (property && originalImages.length > 0)) {
                setIsUploading(true);

                if (property && originalImages.length > 0) {
                    // Modo edição: usar updateImages para atualização inteligente
                    const currentImages = images;
                    const toDelete: number[] = [];
                    const toAdd: any[] = [];
                    const toUpdate: any[] = [];

                    // Identificar imagens deletadas
                    originalImages.forEach(originalImg => {
                        const stillExists = currentImages.some(img =>
                            img.existing_id === originalImg.existing_id
                        );
                        if (!stillExists && originalImg.existing_id) {
                            toDelete.push(originalImg.existing_id);
                        }
                    });

                    // Identificar novas imagens e atualizações
                    currentImages.forEach(currentImg => {
                        if (currentImg.file !== null) {
                            // Nova imagem
                            toAdd.push({
                                fileName: currentImg.file.name,
                                fileData: '', // Será preenchido abaixo
                                mimeType: currentImg.file.type,
                                is_primary: currentImg.is_primary,
                                sort_order: currentImg.sort_order,
                            });
                        } else if (currentImg.existing_id) {
                            // Imagem existente - verificar se houve mudanças
                            const originalImg = originalImages.find(orig =>
                                orig.existing_id === currentImg.existing_id
                            );

                            if (originalImg && (
                                originalImg.is_primary !== currentImg.is_primary ||
                                originalImg.sort_order !== currentImg.sort_order
                            )) {
                                toUpdate.push({
                                    id: currentImg.existing_id,
                                    is_primary: currentImg.is_primary,
                                    sort_order: currentImg.sort_order,
                                });
                            }
                        }
                    });

                    // Processar uploads de novas imagens
                    if (toAdd.length > 0) {
                        const newImagesWithFiles = currentImages.filter(img => img.file !== null);
                        const imageData = await Promise.all(
                            newImagesWithFiles.map(async (img) => {
                                return new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const base64 = reader.result as string;
                                        const base64Data = base64.split(',')[1];
                                        resolve(base64Data);
                                    };
                                    reader.readAsDataURL(img.file!);
                                });
                            })
                        );

                        // Atualizar fileData nas imagens
                        toAdd.forEach((addImg, index) => {
                            addImg.fileData = imageData[index];
                        });
                    }

                    await updateImagesMutation.mutateAsync({
                        propertyId,
                        toDelete: toDelete.length > 0 ? toDelete : undefined,
                        toAdd: toAdd.length > 0 ? toAdd : undefined,
                        toUpdate: toUpdate.length > 0 ? toUpdate : undefined,
                    });

                } else {
                    // Modo criação: usar uploadImages tradicional
                    const newImages = images.filter(img => img.file !== null);

                    if (newImages.length > 0) {
                        const imageData = await Promise.all(
                            newImages.map(async (img) => {
                                return new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const base64 = reader.result as string;
                                        const base64Data = base64.split(',')[1];
                                        resolve(base64Data);
                                    };
                                    reader.readAsDataURL(img.file!);
                                });
                            })
                        );

                        const imagePayload = newImages.map((img, index) => ({
                            fileName: img.file!.name,
                            fileData: imageData[index],
                            mimeType: img.file!.type,
                            is_primary: img.is_primary,
                            sort_order: img.sort_order,
                        }));

                        await uploadImagesMutation.mutateAsync({
                            propertyId,
                            images: imagePayload,
                        });
                    }
                }
            }

            // Associate amenities
            if (selectedAmenityIds.length > 0) {
                await associateAmenitiesMutation.mutateAsync({
                    propertyId,
                    amenityIds: selectedAmenityIds,
                });
            }

            handleSuccess();
        } catch (error: any) {
            console.error("Error saving property:", error);
            toast.error(error.message || "Erro ao salvar hospedagem");
        }
    };

    const steps = [
        { title: "Informações Básicas", icon: Home },
        { title: "Localização", icon: MapPin },
        { title: "Imagens", icon: Upload },
        { title: "Comodidades", icon: Plus },
        { title: "Espaços", icon: DoorOpen },
    ];

    const isStepValid = (stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: // Informações Básicas
                return formData.name.trim().length > 0; // Só o nome é obrigatório para navegação
            case 1: // Localização
                return formData.city.trim().length > 0; // Só a cidade é obrigatória para navegação
            case 2: // Imagens
                return true; // Imagens são opcionais
            case 3: // Comodidades
                return true; // Comodidades são opcionais
            case 4: // Espaços
                return !!property; // Só disponível para propriedades já criadas
            default:
                return false;
        }
    };

    const isFormCompleteForSubmit = (): boolean => {
        return formData.name.trim().length > 0 &&
            (formData.city?.trim().length || 0) > 0 &&
            formData.max_guests > 0 &&
            formData.bedrooms > 0 &&
            formData.beds > 0 &&
            formData.bathrooms > 0;
    };

    const canNavigateToStep = (stepIndex: number): boolean => {
        // Sempre permite navegar para a primeira seção
        if (stepIndex === 0) return true;

        // Permite navegar para seções opcionais (Imagens e Comodidades) sempre
        if (stepIndex >= 3 && stepIndex <= 4) return true;

        // Quartos e Camas só disponível para propriedades já criadas
        if (stepIndex === 5) return !!property;

        // Para Localização (index 1), só precisa que Informações Básicas seja válida
        if (stepIndex === 1) return isStepValid(0);

        // Para Detalhes (index 2), precisa que Informações Básicas e Localização sejam válidas
        if (stepIndex === 2) return isStepValid(0) && isStepValid(1);

        return false;
    };

    const handleStepClick = (stepIndex: number) => {
        if (canNavigateToStep(stepIndex) && !isLoading) {
            setCurrentStep(stepIndex);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {property ? "Editar Hospedagem" : "Nova Hospedagem"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {steps[currentStep].title}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Steps Navigation */}
                <div className="flex items-center justify-center gap-1 p-4 border-b bg-muted/30 overflow-x-auto">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep && isStepValid(index);
                        const canNavigate = canNavigateToStep(index);
                        const isValid = isStepValid(index);

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleStepClick(index)}
                                disabled={!canNavigate || isLoading}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 min-w-fit whitespace-nowrap",
                                    "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-accent",
                                    isActive && "bg-accent text-accent-foreground shadow-sm",
                                    isCompleted && "text-emerald-600 dark:text-emerald-400",
                                    !canNavigate && "opacity-40 cursor-not-allowed",
                                    canNavigate && !isActive && "text-muted-foreground hover:text-foreground",
                                    isActive && isValid && "ring-2 ring-emerald-500/20"
                                )}
                                title={!canNavigate ? "Complete as seções anteriores primeiro" : `Ir para ${step.title}`}
                            >
                                <Icon className={cn(
                                    "w-4 h-4",
                                    isCompleted && "text-emerald-500",
                                    isActive && isValid && "text-emerald-600"
                                )} />
                                <span className="hidden sm:inline">{step.title}</span>
                                {isCompleted && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                )}
                                {isActive && !isValid && index > 0 && (
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 min-h-0">
                    <div className="min-h-[400px]">
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="name">Nome da Hospedagem *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Apartamento Aconchegante em Copacabana"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description_short">Descrição Curta</Label>
                                    <Input
                                        id="description_short"
                                        value={formData.description_short}
                                        onChange={(e) => setFormData({ ...formData, description_short: e.target.value })}
                                        placeholder="Breve descrição para a listagem"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description_full">Descrição Completa</Label>
                                    <Textarea
                                        id="description_full"
                                        rows={6}
                                        value={formData.description_full}
                                        onChange={(e) => setFormData({ ...formData, description_full: e.target.value })}
                                        placeholder="Descrição detalhada da hospedagem, comodidades, localização..."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="property_type">Tipo de Propriedade *</Label>
                                    <select
                                        id="property_type"
                                        value={formData.property_type_id || ""}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            property_type_id: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Selecione um tipo</option>
                                        {propertyTypes.map((type: any) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_featured"
                                        checked={formData.is_featured || false}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, is_featured: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="is_featured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Marcar como destaque na página inicial
                                    </Label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <Label htmlFor="max_guests">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Quantidade de Hóspedes
                                            </div>
                                        </Label>
                                        <Input
                                            id="max_guests"
                                            type="number"
                                            min="1"
                                            value={formData.max_guests}
                                            onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="area_m2">
                                            <div className="flex items-center gap-2">
                                                <span>📐</span>
                                                Área (m²)
                                            </div>
                                        </Label>
                                        <Input
                                            id="area_m2"
                                            type="number"
                                            min="0"
                                            max="9999.99"
                                            step="0.01"
                                            inputMode="decimal"
                                            placeholder="Ex: 85.50"
                                            value={formData.area_m2 || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                    setFormData({ ...formData, area_m2: undefined });
                                                    return;
                                                }
                                                const parsed = parseFloat(value);
                                                if (!isNaN(parsed) && parsed >= 0 && parsed <= 9999.99) {
                                                    setFormData({ ...formData, area_m2: parsed });
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const value = e.target.value;
                                                if (value && !isNaN(parseFloat(value))) {
                                                    const rounded = Math.round(parseFloat(value) * 100) / 100;
                                                    setFormData({ ...formData, area_m2: rounded });
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Valor entre 0 e 9999.99 m²
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="address_street">Rua / Avenida</Label>
                                        <Input
                                            id="address_street"
                                            value={formData.address_street || ""}
                                            onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                            placeholder="Ex: Avenida Atlântica"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address_number">Número</Label>
                                        <Input
                                            id="address_number"
                                            value={formData.address_number || ""}
                                            onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                                            placeholder="Ex: 1234"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="address_complement">Complemento</Label>
                                        <Input
                                            id="address_complement"
                                            value={formData.address_complement || ""}
                                            onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                                            placeholder="Ex: Apto 501, Bloco B"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="neighborhood">Bairro</Label>
                                        <Input
                                            id="neighborhood"
                                            value={formData.neighborhood || ""}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            placeholder="Ex: Copacabana"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">Cidade *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Ex: Rio de Janeiro"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="state_region">Estado</Label>
                                        <Input
                                            id="state_region"
                                            value={formData.state_region || ""}
                                            onChange={(e) => setFormData({ ...formData, state_region: e.target.value })}
                                            placeholder="Ex: RJ"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="country">País</Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            placeholder="Ex: Brasil"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="postal_code">CEP</Label>
                                        <Input
                                            id="postal_code"
                                            value={formData.postal_code || ""}
                                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            placeholder="Ex: 22021-001"
                                        />
                                    </div>
                                </div>

                                {/* Map Section */}
                                <div className="pt-4 border-t space-y-4">
                                    <div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowMap(!showMap)}
                                            disabled={!formData.city}
                                            className="w-full"
                                        >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {showMap ? "Ocultar Mapa" : "Ver no Mapa"}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {!formData.city
                                                ? "Preencha pelo menos a cidade para ver o mapa"
                                                : "Clique para visualizar a localização no mapa"}
                                        </p>
                                    </div>

                                    {/* Map Preview */}
                                    {showMap && formData.city && (
                                        <div>
                                            <Label className="mb-2 block">Localização</Label>
                                            <MapPreview
                                                property={{
                                                    address_street: formData.address_street,
                                                    address_number: formData.address_number,
                                                    city: formData.city,
                                                    state_region: formData.state_region,
                                                    country: formData.country,
                                                }}
                                                height="300px"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <PropertyImageUpload
                                    images={images}
                                    onImagesChange={setImages}
                                    maxImages={10}
                                />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Selecione as Comodidades</h3>
                                <AmenitySelector
                                    selectedAmenityIds={selectedAmenityIds}
                                    onSelectionChange={setSelectedAmenityIds}
                                />
                            </div>
                        )}

                        {currentStep === 4 && property && (
                            <div>
                                <SpacesAndBedsManager propertyId={property.id} />
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Dica:</strong> Configure os espaços e as camas disponíveis. Apenas espaços com camas serão exibidos na seção "Onde você vai dormir".
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-muted/30">
                    <Button
                        variant="outline"
                        onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}
                        disabled={isLoading}
                    >
                        {currentStep === 0 ? "Cancelar" : "Voltar"}
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            {currentStep + 1} de {steps.length}
                        </span>

                        {currentStep < steps.length - 1 ? (
                            <Button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={isLoading}
                                title="Próxima seção"
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !isFormCompleteForSubmit()}
                                className={cn(
                                    "bg-accent text-accent-foreground",
                                    !isFormCompleteForSubmit() && "opacity-50"
                                )}
                                title={!isFormCompleteForSubmit() ? "Complete todos os campos obrigatórios para finalizar" : "Salvar hospedagem"}
                            >
                                {isLoading ? "Salvando..." : property ? "Atualizar" : "Criar"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}