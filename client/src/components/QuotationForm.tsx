'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, Plane } from "lucide-react";
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { SectionTitle } from "@/components/SectionTitle";
import { PhoneInput } from "@/components/ui/phone-input";
import { BookingDatePicker } from "@/components/BookingDatePicker";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [quotationCode, setQuotationCode] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const formElement = document.querySelector('[data-quotation-form]');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (message && message.type === "error") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [message]);

  // Prevenir autofill sincronizando o DOM com o estado React
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleAutoFill = () => {
      // Sincronizar inputs do DOM com o estado
      const inputs = form.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
      inputs.forEach((input) => {
        const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const fieldName = element.name;

        // Se o valor do DOM é diferente do estado e o campo não teve foco do usuário, resetar
        if (element.value && formData[fieldName as keyof FormData] === "") {
          element.value = "";
        }
      });
    };

    // Detectar autofill quando há mudanças inesperadas
    const timer = setTimeout(() => {
      handleAutoFill();
    }, 100);

    return () => clearTimeout(timer);
  }, [isSuccess]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Formatação especial para Investimento Médio
    if (name === "campoAdicional_3") {
      // Remover tudo que não é número
      const onlyNumbers = value.replace(/\D/g, "");

      // Formatar como moeda brasileira
      if (onlyNumbers) {
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseInt(onlyNumbers) / 100);

        setFormData(prev => ({
          ...prev,
          [name]: formatted,
        }));
        return;
      } else {
        // Se apagar tudo, limpar o campo
        setFormData(prev => ({
          ...prev,
          [name]: "",
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    if (formData.campoEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.campoEmail.trim())) {
        setMessage({ type: "error", text: "E-mail inválido" });
        return false;
      }
    }
    if (!formData.campoOrigem.trim()) {
      setMessage({ type: "error", text: "Cidade de origem é obrigatória" });
      return false;
    }
    if (!formData.campoDestino.trim()) {
      setMessage({ type: "error", text: "Cidade de destino é obrigatória" });
      return false;
    }
    if (!dateRange?.from) {
      setMessage({ type: "error", text: "Data de ida é obrigatória" });
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange.from < today) {
      setMessage({ type: "error", text: "Data de ida deve ser maior ou igual a data de hoje" });
      return false;
    }
    if (dateRange.to && dateRange.to < dateRange.from) {
      setMessage({ type: "error", text: "Data de volta deve ser maior ou igual a data de ida" });
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

    const formElement = formRef.current;
    if (!formElement) return;

    // Criar objeto com valores do DOM para campos de input direto e do estado para campos customizados
    const actualFormData: FormData = {
      campoNome: (formElement.elements.namedItem('campoNome') as HTMLInputElement)?.value || "",
      campoCelular: formData.campoCelular, // Usar do estado (PhoneInput é um componente customizado)
      campoEmail: (formElement.elements.namedItem('campoEmail') as HTMLInputElement)?.value || "",
      campoOrigem: (formElement.elements.namedItem('campoOrigem') as HTMLInputElement)?.value || "",
      campoDestino: (formElement.elements.namedItem('campoDestino') as HTMLInputElement)?.value || "",
      campoDataInicial: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : "",
      campoDataFinal: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : "",
      campoPassageiroAdulto: parseInt((formElement.elements.namedItem('campoPassageiroAdulto') as HTMLInputElement)?.value || "1"),
      campoPassageiroCrianca: parseInt((formElement.elements.namedItem('campoPassageiroCrianca') as HTMLInputElement)?.value || "0"),
      campoPassageiroBebe: parseInt((formElement.elements.namedItem('campoPassageiroBebe') as HTMLInputElement)?.value || "0"),
      campoFlexibilidade: (formElement.elements.namedItem('campoFlexibilidade') as HTMLSelectElement)?.value || "N",
      campoMalaDespachada: parseInt((formElement.elements.namedItem('campoMalaDespachada') as HTMLInputElement)?.value || "0"),
      campoServicos: Array.from(formElement.querySelectorAll('input[type="checkbox"]:checked')).map(el => (el as HTMLInputElement).value),
      campoCupomDesconto: (formElement.elements.namedItem('campoCupomDesconto') as HTMLInputElement)?.value || "",
      campoObservacao: (formElement.elements.namedItem('campoObservacao') as HTMLTextAreaElement)?.value || "",
      campoAdicional_4: (formElement.elements.namedItem('campoAdicional_4') as HTMLSelectElement)?.value || "",
      campoAdicional_1: (formElement.elements.namedItem('campoAdicional_1') as HTMLSelectElement)?.value || "",
      campoAdicional_2: (formElement.elements.namedItem('campoAdicional_2') as HTMLSelectElement)?.value || "",
      campoAdicional_3: (formElement.elements.namedItem('campoAdicional_3') as HTMLInputElement)?.value || "",
    };

    // Validar usando os dados capturados
    if (!actualFormData.campoNome.trim()) {
      setMessage({ type: "error", text: "Nome é obrigatório" });
      return;
    }
    if (!actualFormData.campoCelular.trim()) {
      setMessage({ type: "error", text: "Telefone é obrigatório" });
      return;
    }
    if (actualFormData.campoEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(actualFormData.campoEmail.trim())) {
        setMessage({ type: "error", text: "E-mail inválido" });
        return;
      }
    }
    if (!actualFormData.campoOrigem.trim()) {
      setMessage({ type: "error", text: "Cidade de origem é obrigatória" });
      return;
    }
    if (!actualFormData.campoDestino.trim()) {
      setMessage({ type: "error", text: "Cidade de destino é obrigatória" });
      return;
    }
    if (!dateRange?.from) {
      setMessage({ type: "error", text: "Data de ida é obrigatória" });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange.from < today) {
      setMessage({ type: "error", text: "Data de ida deve ser maior ou igual a data de hoje" });
      return;
    }
    if (dateRange.to && dateRange.to < dateRange.from) {
      setMessage({ type: "error", text: "Data de volta deve ser maior ou igual a data de ida" });
      return;
    }
    if (!actualFormData.campoAdicional_1) {
      setMessage({ type: "error", text: "Motivo da viagem é obrigatório" });
      return;
    }
    if (!actualFormData.campoAdicional_2) {
      setMessage({ type: "error", text: "Urgência do orçamento é obrigatória" });
      return;
    }

    // Validar Investimento Médio se preenchido
    if (actualFormData.campoAdicional_3.trim()) {
      // Verificar se contém apenas números, vírgulas, pontos e R$
      const investmentPattern = /^R?\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/;
      if (!investmentPattern.test(actualFormData.campoAdicional_3.trim())) {
        setMessage({ type: "error", text: "Investimento médio deve ser um valor válido em reais (ex: R$ 5.000,00)" });
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = new URLSearchParams();
      Object.entries(actualFormData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => payload.append(key, v));
        } else {
          payload.append(key, String(value));
        }
      });

      console.log("DEBUG PAYLOAD:", JSON.stringify(payload, null, 2));

      const response = await fetch("https://agencia.iddas.com.br/so/mnv0fqto", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const data: ApiResponse = await response.json();

      if (data.sucesso === "S") {
        setQuotationCode(data.cotacao);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (isSuccess) {
    return (
      <div className="w-full mt-24 mb-12" data-quotation-form>
        <div className="max-w-4xl mx-auto px-6 md:px-16">
          <div className="border border-muted/40 rounded-xl p-8 md:p-12 text-center" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-accent mb-4">
              Orçamento Enviado com Sucesso!
            </h2>

            <p className="text-lg text-muted-foreground mb-6">
              Recebemos sua solicitação e em breve nossa equipe entrará em contato.
            </p>

            <div className="bg-white border-2 border-accent/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Localizador do orçamento:</p>
              <p className="text-4xl font-bold text-accent">{quotationCode}</p>
              <p className="text-xs text-muted-foreground mt-2">Guarde este código para acompanhar sua solicitação</p>
            </div>

            <div className="bg-accent/5 rounded-lg p-4 mb-8">
              <p className="text-sm text-foreground">
                ⏱️ Nossa equipe analisará sua solicitação e retornará em até <strong>24 horas</strong> com as melhores opções para sua viagem.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Voltar para Home
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setQuotationCode("");
                  setDateRange(undefined);
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
                }}
                className="px-8 py-3 border border-accent text-accent rounded-lg font-medium hover:bg-accent/10 transition-colors"
              >
                Novo Orçamento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="w-full mt-24 mb-12" data-quotation-form>
      <div className="max-w-4xl mx-auto px-6 md:px-16 py-8 relative">
        <button
          onClick={onClose}
          className="absolute -top-8 right-0 w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
          aria-label="Fechar formulário"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 md:gap-6 mb-2">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-accent/20 -z-10" />
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 text-white shadow-lg ring-4 ring-accent/15 flex items-center justify-center">
              <Plane className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div className="absolute -right-3 -bottom-2 w-6 h-6 rounded-full bg-white shadow-md border border-accent/15 flex items-center justify-center text-xs font-semibold text-accent">GO</div>
          </div>
          <div className="flex-1">
            <SectionTitle
              title="Solicite seu"
              highlight="Orçamento"
              subtitle="Preencha o formulário abaixo e nossa equipe entrará em contato com as melhores opções para sua viagem."
            />
          </div>
        </div>

        {message && (
          <div
            ref={messageRef}
            className={`p-4 rounded-lg text-sm mb-6 ${message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
              }`}
          >
            {message.text}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" autoComplete="off" style={{
          WebkitAutofillBackgroundColor: 'transparent',
        } as React.CSSProperties & { WebkitAutofillBackgroundColor: string }}>
          <style>{`
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 30px white inset !important;
            }
            input:-webkit-autofill {
              -webkit-text-fill-color: inherit !important;
            }
          `}</style>
          {/* Container 1: Dados Pessoais */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-accent mb-2">Telefone <span className="text-red-500">*</span></label>
                  <PhoneInput
                    defaultCountry="BR"
                    value={formData.campoCelular || undefined}
                    onChange={(val) => setFormData((prev) => ({ ...prev, campoCelular: val || "" }))}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent mb-2">E-mail</label>
                <input
                  type="text"
                  name="campoEmail"
                  value={formData.campoEmail}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
          </div>

          {/* Container 2: Detalhes da Viagem */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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
                    autoComplete="off"
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
                    autoComplete="off"
                    className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Paris"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent mb-2">Datas de Viagem <span className="text-red-500">*</span></label>
                <div className="flex justify-center md:justify-start">
                  <BookingDatePicker value={dateRange} onChange={setDateRange} />
                </div>
              </div>
            </div>
          </div>

          {/* Container 3: Passageiros */}
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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
          <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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
                    <option value="Urgente">Urgente (24h)</option>
                    <option value="Normal">Normal (48h)</option>
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
                    autoComplete="off"
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
                    autoComplete="off"
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
                  autoComplete="off"
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