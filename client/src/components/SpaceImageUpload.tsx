import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SpaceImageUploadProps {
    imagePreview?: string | null;
    onImageChange: (file: File) => void;
    onImageRemove?: () => void;
    isLoading?: boolean;
    uploadId: string;
}

export function SpaceImageUpload({
    imagePreview,
    onImageChange,
    onImageRemove,
    isLoading = false,
    uploadId,
}: SpaceImageUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            onImageChange(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageChange(file);
        }
    };

    if (imagePreview) {
        return (
            <div>
                <Label className="text-sm font-medium mb-2 block">Imagem do espaço</Label>
                <div className="space-y-2">
                    <div className="relative w-64 h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={onImageRemove}
                            disabled={isLoading}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <Label htmlFor={`image-upload-${uploadId}`}>
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-background border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">
                                {isLoading ? "Enviando..." : "Alterar imagem"}
                            </span>
                        </div>
                        <Input
                            id={`image-upload-${uploadId}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                    </Label>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Label className="text-sm font-medium mb-2 block">Imagem do espaço</Label>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    isDragOver
                        ? "border-primary/60 bg-primary/5"
                        : "border-gray-300 hover:border-primary/50"
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id={`image-upload-${uploadId}`}
                    disabled={isLoading}
                />
                <label
                    htmlFor={`image-upload-${uploadId}`}
                    className="flex flex-col items-center gap-2.5 cursor-pointer"
                >
                    <Upload className="h-6 w-6 text-muted-foreground/60" />
                    <div>
                        <p className="text-sm font-medium text-gray-600">
                            {isLoading ? "Enviando imagem..." : "Arraste a imagem ou clique para enviar"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            JPG, PNG ou WEBP
                        </p>
                    </div>
                </label>
            </div>
        </div>
    );
}
