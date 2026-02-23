import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BookingDatePicker } from "@/components/BookingDatePicker";
import { ViagemImageUpload } from "@/components/ViagemImageUpload";
import { CategoriaSelector } from "@/components/CategoriaSelector";
import { DestaqueSelector } from "@/components/DestaqueSelector";

export interface ViagemFormData {
  id?: number;
  titulo: string;
  slug: string;
  descricao: string;
  origem: string;
  dataIda: string | null;
  dataVolta: string | null;
  quantidadePessoas: number;
  valorTotal: number;
  quantidadeParcelas: number | null;
  valorParcela: number | null;
  temJuros: boolean;
  xp: number;
  hospedagem: string | null;
  imagemUrl: string;
  ativo: boolean;
  categoriaIds: number[];
  destaqueIds: number[];
  /** Image file for upload (base64) */
  imagem?: { fileName: string; fileData: string; mimeType: string } | null;
}

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (viagem: ViagemFormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCurrencyInput(value: string): number | null {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return null;
  return Number(digitsOnly) / 100;
}

function formatCurrencyInput(value: number | null | undefined): string {
  if (!value || Number.isNaN(value)) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function maskCurrencyInput(rawValue: string): string {
  return formatCurrencyInput(parseCurrencyInput(rawValue));
}

/** Convert date string (YYYY-MM-DD) to Date object */
function parseDateStr(d: any): Date | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
  if (typeof d === "string") {
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(+match[1], +match[2] - 1, +match[3]);
  }
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/** Convert Date object to YYYY-MM-DD string */
function toDateStr(date: Date | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert file to base64 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyForm: ViagemFormData = {
  titulo: "",
  slug: "",
  descricao: "",
  origem: "",
  dataIda: null,
  dataVolta: null,
  quantidadePessoas: 1,
  valorTotal: 0,
  quantidadeParcelas: null,
  valorParcela: null,
  temJuros: false,
  xp: 0,
  hospedagem: null,
  imagemUrl: "",
  ativo: true,
  categoriaIds: [],
  destaqueIds: [],
  imagem: null,
};

export default function TravelModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: TravelModalProps) {
  const [formData, setFormData] = useState<ViagemFormData>({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [valorTotalInput, setValorTotalInput] = useState("");
  const [valorParcelaInput, setValorParcelaInput] = useState("");

  // Date range for BookingDatePicker
  const dateRange: DateRange | undefined =
    formData.dataIda || formData.dataVolta
      ? { from: parseDateStr(formData.dataIda), to: parseDateStr(formData.dataVolta) }
      : undefined;

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        titulo: initialData.titulo || "",
        slug: initialData.slug || "",
        descricao: initialData.descricao || "",
        origem: initialData.origem || "",
        dataIda: initialData.dataIda ? String(initialData.dataIda).slice(0, 10) : null,
        dataVolta: initialData.dataVolta ? String(initialData.dataVolta).slice(0, 10) : null,
        quantidadePessoas: Number(initialData.quantidadePessoas) > 0 ? Number(initialData.quantidadePessoas) : 1,
        valorTotal: Number(initialData.valorTotal) || 0,
        quantidadeParcelas: initialData.quantidadeParcelas || null,
        valorParcela: initialData.valorParcela != null ? Number(initialData.valorParcela) : null,
        temJuros: !!initialData.temJuros,
        xp: initialData.xp || 0,
        hospedagem: initialData.hospedagem || null,
        imagemUrl: initialData.imagemUrl || "",
        ativo: initialData.ativo !== undefined ? !!initialData.ativo : true,
        categoriaIds: initialData.categorias?.map((c: any) => c.id) || [],
        destaqueIds: initialData.destaques?.map((d: any) => d.id) || [],
        imagem: null,
      });
      setValorTotalInput(formatCurrencyInput(Number(initialData.valorTotal) || 0));
      setValorParcelaInput(formatCurrencyInput(initialData.valorParcela != null ? Number(initialData.valorParcela) : null));
      setImageFile(null);
      setImagePreview(undefined);
    } else {
      setFormData({ ...emptyForm });
      setValorTotalInput("");
      setValorParcelaInput("");
      setImageFile(null);
      setImagePreview(undefined);
    }
  }, [initialData, isOpen]);

  const handleTituloChange = (titulo: string) => {
    setFormData((prev) => ({
      ...prev,
      titulo,
      slug: !initialData ? slugify(titulo) : prev.slug,
    }));
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setFormData((prev) => ({
      ...prev,
      dataIda: toDateStr(range?.from),
      dataVolta: toDateStr(range?.to),
    }));
  };

  const handleImageSelect = useCallback((file: File | null) => {
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(undefined);
      setFormData((prev) => ({ ...prev, imagemUrl: "" }));
    }
  }, []);

  const handleValorTotalChange = (value: string) => {
    const parsed = parseCurrencyInput(value);
    setValorTotalInput(maskCurrencyInput(value));
    set("valorTotal", parsed ?? 0);
  };

  const handleValorParcelaChange = (value: string) => {
    const parsed = parseCurrencyInput(value);
    setValorParcelaInput(maskCurrencyInput(value));
    set("valorParcela", parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.descricao.trim() || !formData.origem.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    // Image required: either existing URL or new file
    if (!formData.imagemUrl && !imageFile) {
      toast.error("Adicione uma imagem para a viagem");
      return;
    }
    if (!formData.slug.trim()) {
      formData.slug = slugify(formData.titulo);
    }
    if (formData.valorTotal <= 0) {
      toast.error("Informe o valor total");
      return;
    }

    // Build payload
    const payload: ViagemFormData = { ...formData };

    // If new image file selected, convert to base64
    if (imageFile) {
      try {
        const base64 = await fileToBase64(imageFile);
        payload.imagem = {
          fileName: imageFile.name,
          fileData: base64,
          mimeType: imageFile.type,
        };
      } catch {
        toast.error("Erro ao processar imagem");
        return;
      }
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  const set = <K extends keyof ViagemFormData>(key: K, val: ViagemFormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted">
          <h2 className="text-xl font-medium text-accent">
            {initialData ? "Editar Viagem" : "Nova Viagem"}
          </h2>
          <button aria-label="Fechar modal" onClick={onClose} className="text-accent/60 hover:text-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* === Imagem === */}
          <div>
            <Label className="text-accent mb-2 block">Imagem *</Label>
            <ViagemImageUpload
              currentImageUrl={formData.imagemUrl || undefined}
              previewUrl={imagePreview}
              onImageSelect={handleImageSelect}
            />
          </div>

          {/* === Título + Slug === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-accent">Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Ex: Paris - Cidade da Luz"
              />
            </div>
            <div>
              <Label className="text-accent">Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="paris-cidade-da-luz"
              />
            </div>
          </div>

          {/* === Descrição === */}
          <div>
            <Label className="text-accent">Descrição *</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Descubra os encantos..."
              rows={3}
            />
          </div>

          {/* === Origem + Datas === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-accent">Saindo de *</Label>
              <Input
                value={formData.origem}
                onChange={(e) => set("origem", e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label className="text-accent mb-1 block">Período da Viagem</Label>
              <BookingDatePicker
                value={dateRange}
                onChange={handleDateChange}
                mode="flight"
              />
            </div>
          </div>

          {/* === Pessoas + Valor Total === */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-accent">Qtd. Pessoas</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantidadePessoas}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  set("quantidadePessoas", Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
                }}
              />
            </div>
            <div>
              <Label className="text-accent">Valor Total (R$) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={valorTotalInput}
                onChange={(e) => handleValorTotalChange(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* === Parcelas + Valor Parcela === */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-accent">Qtd. Parcelas</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantidadeParcelas || ""}
                onChange={(e) => set("quantidadeParcelas", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="10"
              />
            </div>
            <div>
              <Label className="text-accent">Valor Parcela (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={valorParcelaInput}
                onChange={(e) => handleValorParcelaChange(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* === Juros + XP + Ativo === */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 pt-5">
              <Switch
                id="temJuros"
                checked={formData.temJuros}
                onCheckedChange={(v) => set("temJuros", v)}
              />
              <Label htmlFor="temJuros" className="text-accent text-sm cursor-pointer">Com juros</Label>
            </div>
            <div>
              <Label className="text-accent">XP</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={formData.xp}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  set("xp", Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0);
                }}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(v) => set("ativo", v)}
              />
              <Label htmlFor="ativo" className="text-accent text-sm cursor-pointer">Ativo</Label>
            </div>
          </div>

          {/* === Hospedagem === */}
          <div>
            <Label className="text-accent">Hospedagem</Label>
            <Textarea
              value={formData.hospedagem || ""}
              onChange={(e) => set("hospedagem", e.target.value || null)}
              placeholder="Detalhes da hospedagem..."
              rows={2}
            />
          </div>

          {/* === Categorias === */}
          <div>
            <Label className="text-accent mb-2 block">Categorias</Label>
            <CategoriaSelector
              selectedIds={formData.categoriaIds}
              onSelectionChange={(ids) => set("categoriaIds", ids)}
            />
          </div>

          {/* === Destaques === */}
          <div>
            <Label className="text-accent mb-2 block">Destaques (tags do card)</Label>
            <DestaqueSelector
              selectedIds={formData.destaqueIds}
              onSelectionChange={(ids) => set("destaqueIds", ids)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-muted">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-accent text-accent-foreground hover:opacity-90">
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
