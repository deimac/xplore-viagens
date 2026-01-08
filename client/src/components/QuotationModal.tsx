import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface FormData {
  campoNome: string;
  campoCelular: string;
  campoEmail: string;
  campoOrigem: string;
  campoDestino: string;
  campoDataInicial: string;
  campoDataFinal: string;
  campoPassageiroAdulto: number;
  campoPassageiroCrianca: number;
  campoPassageiroBebe: number;
  campoFlexibilidade: string;
  campoMalaDespachada: number;
  campoServicos: string[];
  campoCupomDesconto: string;
  campoObservacao: string;
  campoAdicional_4: string;
  campoAdicional_1: string;
  campoAdicional_2: string;
  campoAdicional_3: string;
}

interface ApiResponse {
  sucesso: "S" | "N";
  msg: string;
  cotacao: string;
}

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuotationModal({ isOpen, onClose }: QuotationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    campoNome: "",
    campoCelular: "",
    campoEmail: "",
    campoOrigem: "",
    campoDestino: "",
    campoDataInicial: "",
    campoDataFinal: "",
    campoPassageiroAdulto: 1,
    campoPassageiroCrianca: 0,
    campoPassageiroBebe: 0,
    campoFlexibilidade: "N",
    campoMalaDespachada: 0,
    campoServicos: [],
    campoCupomDesconto: "",
    campoObservacao: "",
    campoAdicional_4: "",
    campoAdicional_1: "",
    campoAdicional_2: "",
    campoAdicional_3: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("Passageiro") || name === "campoMalaDespachada" ? parseInt(value) || 0 : value,
    }));
  };

  const handleServicosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      campoServicos: checked
        ? [...prev.campoServicos, value]
        : prev.campoServicos.filter(s => s !== value),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.campoNome.trim()) {
      setMessage({ type: "error", text: "Nome é obrigatório" });
      return false;
    }
    if (!formData.campoCelular.trim()) {
      setMessage({ type: "error", text: "Telefone é obrigatório" });
      return false;
    }
    if (!formData.campoOrigem.trim()) {
      setMessage({ type: "error", text: "Cidade de origem é obrigatória" });
      return false;
    }
    if (!formData.campoDestino.trim()) {
      setMessage({ type: "error", text: "Cidade de destino é obrigatória" });
      return false;
    }
    if (!formData.campoDataInicial) {
      setMessage({ type: "error", text: "Data de ida é obrigatória" });
      return false;
    }
    if (!formData.campoAdicional_1) {
      setMessage({ type: "error", text: "Motivo da viagem é obrigatório" });
      return false;
    }
    if (!formData.campoAdicional_2) {
      setMessage({ type: "error", text: "Urgência do orçamento é obrigatória" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => payload.append(key, v));
        } else {
          payload.append(key, String(value));
        }
      });

      const response = await fetch("https://agencia.iddas.com.br/so/mnv0fqto", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const data: ApiResponse = await response.json();

      if (data.sucesso === "S") {
        setMessage({
          type: "success",
          text: `${data.msg} - Código: ${data.cotacao}`,
        });
        setTimeout(() => {
          setFormData({
            campoNome: "",
            campoCelular: "",
            campoEmail: "",
            campoOrigem: "",
            campoDestino: "",
            campoDataInicial: "",
            campoDataFinal: "",
            campoPassageiroAdulto: 1,
            campoPassageiroCrianca: 0,
            campoPassageiroBebe: 0,
            campoFlexibilidade: "N",
            campoMalaDespachada: 0,
            campoServicos: [],
            campoCupomDesconto: "",
            campoObservacao: "",
            campoAdicional_4: "",
            campoAdicional_1: "",
            campoAdicional_2: "",
            campoAdicional_3: "",
          });
          onClose();
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.msg || "Erro ao enviar solicitação" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao conectar com o servidor" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-background border border-muted/40 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-muted/40 p-4 md:p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-accent">Solicitar Orçamento</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Preencha os campos abaixo</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Mensagem de Status */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Linha 1: Nome e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="campoNome"
                value={formData.campoNome}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="campoCelular"
                value={formData.campoCelular}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="+5511999887766"
              />
            </div>
          </div>

          {/* Linha 2: Email e Origem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">E-mail</label>
              <input
                type="email"
                name="campoEmail"
                value={formData.campoEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Origem <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="campoOrigem"
                value={formData.campoOrigem}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="São Paulo"
              />
            </div>
          </div>

          {/* Linha 3: Destino e Data Ida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Destino <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="campoDestino"
                value={formData.campoDestino}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Data Ida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="campoDataInicial"
                value={formData.campoDataInicial}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Linha 4: Data Volta e Passageiros Adultos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Data Volta</label>
              <input
                type="date"
                name="campoDataFinal"
                value={formData.campoDataFinal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Adultos</label>
              <input
                type="number"
                name="campoPassageiroAdulto"
                value={formData.campoPassageiroAdulto}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Linha 5: Crianças, Bebês e Malas */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Crianças</label>
              <input
                type="number"
                name="campoPassageiroCrianca"
                value={formData.campoPassageiroCrianca}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Bebês</label>
              <input
                type="number"
                name="campoPassageiroBebe"
                value={formData.campoPassageiroBebe}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Malas</label>
              <input
                type="number"
                name="campoMalaDespachada"
                value={formData.campoMalaDespachada}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Linha 6: Motivo e Urgência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <select
                name="campoAdicional_1"
                value={formData.campoAdicional_1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Selecione...</option>
                <option value="Lazer">Lazer</option>
                <option value="Negócios">Negócios</option>
                <option value="Família">Família</option>
                <option value="Lua de Mel">Lua de Mel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Urgência <span className="text-red-500">*</span>
              </label>
              <select
                name="campoAdicional_2"
                value={formData.campoAdicional_2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Selecione...</option>
                <option value="Urgente">Urgente (48h)</option>
                <option value="Normal">Normal (1 semana)</option>
                <option value="Flexível">Flexível</option>
              </select>
            </div>
          </div>

          {/* Linha 7: Flexibilidade e Classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Flexibilidade</label>
              <select
                name="campoFlexibilidade"
                value={formData.campoFlexibilidade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Classe Voo</label>
              <select
                name="campoAdicional_4"
                value={formData.campoAdicional_4}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Selecione...</option>
                <option value="Econômica">Econômica</option>
                <option value="Executiva">Executiva</option>
                <option value="Primeira">Primeira</option>
              </select>
            </div>
          </div>

          {/* Linha 8: Investimento */}
          <div>
            <label className="block text-xs font-medium text-accent mb-1">Investimento</label>
            <input
              type="text"
              name="campoAdicional_3"
              value={formData.campoAdicional_3}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="R$ 5.000 - R$ 10.000"
            />
          </div>

          {/* Linha 9: Serviços (Checkboxes em linha) */}
          <div>
            <label className="block text-xs font-medium text-accent mb-2">Serviços</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: "H", label: "Hospedagem" },
                { value: "T", label: "Transporte" },
                { value: "P", label: "Passeios" },
                { value: "S", label: "Seguros" },
                { value: "C", label: "Cruzeiro" },
                { value: "R", label: "Roteiro" },
              ].map(service => (
                <label key={service.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={service.value}
                    checked={formData.campoServicos.includes(service.value)}
                    onChange={handleServicosChange}
                    className="w-4 h-4 rounded border-muted"
                  />
                  <span className="text-xs text-foreground">{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linha 10: Cupom e Observação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Cupom</label>
              <input
                type="text"
                name="campoCupomDesconto"
                value={formData.campoCupomDesconto}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Se possuir"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">Observações</label>
              <textarea
                name="campoObservacao"
                value={formData.campoObservacao}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="Deixe suas observações..."
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent text-accent-foreground py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Enviando..." : "Enviar"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-muted text-foreground py-2 rounded-md font-medium text-sm hover:bg-muted/20 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
