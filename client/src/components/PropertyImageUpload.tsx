import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    images: ImageFile[];
    onImagesChange: (images: ImageFile[]) => void;
    maxImages?: number;
    className?: string;
}

export function PropertyImageUpload({ images, onImagesChange, maxImages = 10, className }: Props) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newImages = acceptedFiles.slice(0, maxImages - images.length).map((file, index) => ({
                id: `${Date.now()}-${index}`,
                file,
                preview: URL.createObjectURL(file),
                is_primary: false, // Será definido abaixo
                sort_order: images.length + index,
            }));

            const allImages = [...images, ...newImages];

            // Ensure first image is always primary
            allImages.forEach((img, index) => {
                img.is_primary = index === 0;
            });

            onImagesChange(allImages);
        },
        [images, maxImages, onImagesChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        multiple: true,
        maxFiles: maxImages - images.length,
        disabled: images.length >= maxImages,
    });

    const removeImage = (id: string | undefined) => {
        const newImages = images.filter((img) => (img.id || img.existing_id?.toString()) !== id);

        // Reorder sort_order and ensure first image is primary
        newImages.forEach((img, index) => {
            img.sort_order = index;
            img.is_primary = index === 0; // A primeira imagem sempre é principal
        });

        onImagesChange(newImages);
    };

    const setPrimary = (id: string | undefined) => {
        const newImages = images.map((img) => ({
            ...img,
            is_primary: (img.id || img.existing_id?.toString()) === id,
        }));
        onImagesChange(newImages);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];

        // Remove dragged item
        newImages.splice(draggedIndex, 1);

        // Insert at new position
        newImages.splice(dropIndex, 0, draggedImage);

        // Update sort_order and ensure first image is primary
        newImages.forEach((img, index) => {
            img.sort_order = index;
            img.is_primary = index === 0; // A primeira imagem sempre é principal
        });

        onImagesChange(newImages);
        setDraggedIndex(null);
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive
                        ? "border-accent bg-accent/5"
                        : "border-muted-foreground/25 hover:border-accent hover:bg-accent/5",
                    images.length >= maxImages && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                    {isDragActive ? "Solte as imagens aqui" : "Clique ou arraste imagens"}
                </p>
                <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP até 5MB • {images.length}/{maxImages} imagens
                </p>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => {
                        const imageId = image.id || image.existing_id?.toString() || `existing-${index}`;
                        return (
                            <div
                                key={imageId}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className={cn(
                                    "relative group aspect-square bg-muted rounded-lg overflow-hidden cursor-move transition-all",
                                    draggedIndex === index && "opacity-50 scale-95",
                                    image.is_primary && "ring-2 ring-accent ring-offset-2"
                                )}
                            >
                                <img
                                    src={image.preview}
                                    alt={`Property ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Primary Badge */}
                                {image.is_primary && (
                                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        Principal
                                    </div>
                                )}

                                {/* Actions Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        {!image.is_primary && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setPrimary(imageId)}
                                                className="bg-white/90 hover:bg-white text-black"
                                            >
                                                <Star className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => removeImage(imageId)}
                                            className="bg-white/90 hover:bg-white text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Sort Order */}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                                    {index + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Instructions */}
            {images.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                    <p>• Arraste as imagens para reordenar</p>
                    <p>• A primeira imagem é automaticamente definida como principal</p>
                    <p>• Clique na estrela para definir uma imagem específica como principal</p>
                </div>
            )}
        </div>
    );
}