import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Travel {
  id?: number;
  title: string;
  description: string;
  origin: string;
  departureDate: string | null;
  returnDate: string | null;
  travelers: string | null;
  price: string;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (travel: Travel) => void;
  initialData?: Travel;
  isLoading?: boolean;
}

export default function TravelModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: TravelModalProps) {
  const [formData, setFormData] = useState<Travel>({
    title: "",
    description: "",
    origin: "",
    departureDate: "",
    returnDate: "",
    travelers: "",
    price: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: "",
        description: "",
        origin: "",
        departureDate: "",
        returnDate: "",
        travelers: "",
        price: "",
        imageUrl: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.origin.trim() ||
      !formData.price.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted">
          <h2 className="text-xl font-medium text-accent">
            {initialData ? "Editar Viagem" : "Nova Viagem"}
          </h2>
          <button
            onClick={onClose}
            className="text-accent/60 hover:text-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Paris - Cidade da Luz"
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Descubra os encantos de Paris..."
              rows={2}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>

          {/* Origin Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              Saindo de *
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) =>
                setFormData({ ...formData, origin: e.target.value })
              }
              placeholder="Ex: São Paulo"
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Data de Ida
              </label>
              <input
                type="text"
                value={formData.departureDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, departureDate: e.target.value })
                }
                placeholder="Ex: 15 Jun 2025"
                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Data de Volta
              </label>
              <input
                type="text"
                value={formData.returnDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, returnDate: e.target.value })
                }
                placeholder="Ex: 22 Jun 2025"
                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Travelers and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Viajantes
              </label>
              <input
                type="text"
                value={formData.travelers || ""}
                onChange={(e) =>
                  setFormData({ ...formData, travelers: e.target.value })
                }
                placeholder="Ex: 2 pessoas"
                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                Preço *
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Ex: R$ 5.000"
                className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Image URL Field */}
          <div>
            <label className="block text-sm font-medium text-accent mb-2">
              URL da Imagem
            </label>
            <input
              type="url"
              value={formData.imageUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-muted">
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
