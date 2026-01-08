import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Category {
  id?: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  initialData?: Category;
  isLoading?: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<Category>({
    name: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: "", description: "", icon: "" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted">
          <h2 className="text-xl font-medium text-accent">
            {initialData ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button
            onClick={onClose}
            className="text-accent/60 hover:text-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Pacotes"
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Pacotes de viagem completos"
              rows={3}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>

          {/* Icon Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Ícone (lucide-react)
            </label>
            <input
              type="text"
              value={formData.icon || ""}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="Ex: Briefcase"
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent text-accent-foreground hover:opacity-90"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
