import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
    /** Current image URL (for preview of existing image) */
    currentImageUrl?: string;
    /** Called when a new file is selected */
    onImageSelect: (file: File | null) => void;
    /** Preview URL from newly selected file */
    previewUrl?: string;
    className?: string;
}

export function ViagemImageUpload({ currentImageUrl, onImageSelect, previewUrl, className }: Props) {
    const displayUrl = previewUrl || currentImageUrl;

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onImageSelect(acceptedFiles[0]);
            }
        },
        [onImageSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        multiple: false,
        maxFiles: 1,
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onImageSelect(null);
    };

    return (
        <div className={cn("space-y-3", className)}>
            {displayUrl ? (
                <div className="relative group">
                    <img
                        src={displayUrl}
                        alt="Imagem da viagem"
                        className="w-full h-48 object-cover rounded-lg border border-muted"
                    />
                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/90 hover:bg-white text-black"
                                >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Trocar
                                </Button>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={handleRemove}
                                className="bg-white/90 hover:bg-white text-red-600"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Remover
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        isDragActive
                            ? "border-accent bg-accent/5"
                            : "border-muted-foreground/25 hover:border-accent hover:bg-accent/5"
                    )}
                >
                    <input {...getInputProps()} />
                    <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                        {isDragActive ? "Solte a imagem aqui" : "Clique ou arraste uma imagem"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP até 5MB
                    </p>
                </div>
            )}
        </div>
    );
}
