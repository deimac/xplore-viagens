import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface HeroSlide {
  id?: number;
  imageUrl: string;
  title: string;
  subtitle?: string | null;
  order: number;
  isActive: number;
  mostrarNoSite: number;
  mostrarNaTv: number;
}

interface HeroSlideModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (slide: HeroSlide) => void;
  slide?: HeroSlide;
}

export default function HeroSlideModal({ open, onClose, onSave, slide }: HeroSlideModalProps) {
  const [formData, setFormData] = useState<HeroSlide>({
    imageUrl: "",
    title: "",
    subtitle: "",
    order: 0,
    isActive: 1,
    mostrarNoSite: 1,
    mostrarNaTv: 1,
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.heroSlides.uploadImage.useMutation({
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      setPreviewUrl(data.url);
      setImageUrlInput(data.url);
      toast.success("Imagem enviada com sucesso!");
      setUploading(false);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
      setUploading(false);
    },
  });

  const applyImageUrl = useCallback(() => {
    const normalized = imageUrlInput.trim();
    setFormData((prev) => ({ ...prev, imageUrl: normalized }));
    setPreviewUrl(normalized);
  }, [imageUrlInput]);

  useEffect(() => {
    if (slide) {
      setFormData(slide);
      setPreviewUrl(slide.imageUrl);
      setImageUrlInput(slide.imageUrl);
    } else {
      setFormData({
        imageUrl: "",
        title: "",
        subtitle: "",
        order: 0,
        isActive: 1,
        mostrarNoSite: 1,
        mostrarNaTv: 1,
      });
      setPreviewUrl("");
      setImageUrlInput("");
    }
  }, [slide, open]);

  const handleSelectedFile = useCallback((file?: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    setUploading(true);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1]; // Remover prefixo data:image/...;base64,

      uploadImageMutation.mutate({
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [uploadImageMutation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    handleSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    setPreviewUrl("");
    setImageUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedImageUrl = imageUrlInput.trim();
    if (!normalizedImageUrl) {
      toast.error("Por favor, adicione uma imagem");
      return;
    }
    onSave({ ...formData, imageUrl: normalizedImageUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent disableAnimations className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{slide?.id ? "Editar Slide" : "Adicionar Slide"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Imagem *</Label>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-muted"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remover imagem"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-accent bg-accent/5" : "border-muted hover:border-accent"}`}
              >
                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  {uploading ? "Enviando..." : isDragActive ? "Solte a imagem aqui" : "Arraste e solte ou clique para fazer upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou WEBP (máx. 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
              aria-label="Selecionar imagem para upload"
            />

            <p className="text-sm text-muted-foreground">
              Tamanho recomendado: 1920x1200px (proporção 16:10) com céu expansivo na parte superior
            </p>
          </div>

          {/* Ou inserir URL manualmente */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Ou insira uma URL</Label>
            <Input
              id="imageUrl"
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onBlur={applyImageUrl}
              placeholder="https://exemplo.com/imagem.jpg"
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Descubra Santorini"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle || ""}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ex: Paisagens deslumbrantes e pôr do sol inesquecível"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Ordem de Exibição</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <p className="text-sm text-muted-foreground">
              Slides são exibidos em ordem crescente (0, 1, 2...)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive === 1}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
            />
            <Label htmlFor="isActive">Slide ativo</Label>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="mostrarNoSite"
                checked={formData.mostrarNoSite === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, mostrarNoSite: checked ? 1 : 0 })}
              />
              <Label htmlFor="mostrarNoSite">Mostrar no Site</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="mostrarNaTv"
                checked={formData.mostrarNaTv === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, mostrarNaTv: checked ? 1 : 0 })}
              />
              <Label htmlFor="mostrarNaTv">Mostrar na TV</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Enviando..." : slide?.id ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
