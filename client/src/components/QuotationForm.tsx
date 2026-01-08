'use client';
import { useState, useEffect } from 'react';
import { X, Loader2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
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

interface QuotationFormProps {
  onClose: () => void;
}

export default function QuotationForm({ onClose }: QuotationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Scroll para o topo do formulário ao abrir
  useEffect(() => {
    const formElement = document.querySelector('[data-quotation-form]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  return (
    <div className="w-full" data-quotation-form>
      {/* Header com Logo - Ocupando toda a largura */}
      <header className="sticky top-0 z-40 w-full py-6 flex items-center pl-6 md:pl-16" style={{background: '#1A2B4C'}}>
        <img src={APP_LOGO} alt={APP_TITLE} className="h-20 md:h-24 w-auto" />
      </header>

      {/* Título e Subtítulo */}
      <div className="max-w-4xl mx-auto px-6 md:px-16 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-accent mb-2">Solicite seu Orçamento</h1>
        <p className="text-base text-muted-foreground mb-8">Preencha o formulário abaixo e nossa equipe entrará em contato com as melhores opções para sua viagem.</p>

        {/* Mensagem de Status */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Container 1: Dados Pessoais */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
            <h3 className="text-lg font-semibold text-accent mb-4">Dados Pessoais</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Nome <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-medium text-accent mb-2">Telefone <span className="text-red-500">*</span></label>
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
              <div>
                <label className="block text-xs font-medium text-accent mb-2">E-mail</label>
                <input
                  type="email"
                  name="campoEmail"
                  value={formData.campoEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
          </div>

          {/* Container 2: Detalhes da Viagem */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
            <h3 className="text-lg font-semibold text-accent mb-4">Detalhes da Viagem</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Origem <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="campoOrigem"
                    value={formData.campoOrigem}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Destino <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="campoDestino"
                    value={formData.campoDestino}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Paris"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Data Ida <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="campoDataInicial"
                    value={formData.campoDataInicial}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Data Volta</label>
                  <input
                    type="date"
                    name="campoDataFinal"
                    value={formData.campoDataFinal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Container 3: Passageiros */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
            <h3 className="text-lg font-semibold text-accent mb-4">Passageiros</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Adultos</label>
                <input
                  type="number"
                  name="campoPassageiroAdulto"
                  value={formData.campoPassageiroAdulto}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Crianças</label>
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
                <label className="block text-xs font-medium text-accent mb-2">Bebês</label>
                <input
                  type="number"
                  name="campoPassageiroBebe"
                  value={formData.campoPassageiroBebe}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Container 4: Preferências */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
            <h3 className="text-lg font-semibold text-accent mb-4">Preferências</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Flexibilidade de Datas</label>
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
                  <label className="block text-xs font-medium text-accent mb-2">Malas Despachadas</label>
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
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Classe de Voo</label>
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
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Serviços Adicionais</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: "H", label: "Hospedagem" },
                    { value: "T", label: "Transporte" },
                    { value: "P", label: "Passeios" },
                    { value: "S", label: "Seguros" },
                    { value: "C", label: "Cruzeiro" },
                    { value: "R", label: "Roteiro" },
                  ].map(service => (
                    <label key={service.value} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        value={service.value}
                        checked={formData.campoServicos.includes(service.value)}
                        onChange={handleServicosChange}
                        className="w-4 h-4 rounded border-muted mr-2"
                      />
                      {service.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Container 5: Informações Adicionais */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
            <h3 className="text-lg font-semibold text-accent mb-4">Informações Adicionais</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Motivo da Viagem <span className="text-red-500">*</span></label>
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
                  <label className="block text-xs font-medium text-accent mb-2">Urgência <span className="text-red-500">*</span></label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Investimento Médio</label>
                  <input
                    type="text"
                    name="campoAdicional_3"
                    value={formData.campoAdicional_3}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Ex: R$ 5.000 - R$ 10.000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Cupom de Desconto</label>
                  <input
                    type="text"
                    name="campoCupomDesconto"
                    value={formData.campoCupomDesconto}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Código do cupom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Observações Adicionais</label>
                <textarea
                  name="campoObservacao"
                  value={formData.campoObservacao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Conte-nos mais sobre sua viagem..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Botão Enviar */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent text-accent-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Enviando..." : "Solicitar Orçamento"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-muted rounded-lg text-foreground hover:bg-muted/20 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
