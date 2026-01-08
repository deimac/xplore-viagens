import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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

export default function Quotation() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

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

  const { data: companySettings } = trpc.companySettings.get.useQuery();

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
      toast.error("Nome é obrigatório");
      return false;
    }
    if (!formData.campoCelular.trim()) {
      toast.error("Telefone é obrigatório");
      return false;
    }
    if (!formData.campoOrigem.trim()) {
      toast.error("Cidade de origem é obrigatória");
      return false;
    }
    if (!formData.campoDestino.trim()) {
      toast.error("Cidade de destino é obrigatória");
      return false;
    }
    if (!formData.campoDataInicial) {
      toast.error("Data de ida é obrigatória");
      return false;
    }
    if (!formData.campoAdicional_1) {
      toast.error("Motivo da viagem é obrigatório");
      return false;
    }
    if (!formData.campoAdicional_2) {
      toast.error("Urgência do orçamento é obrigatória");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.success(`${data.msg} - Código: ${data.cotacao}`);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(data.msg || "Erro ao enviar solicitação");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F7F7] to-white">
      {/* Header */}
      <header className="bg-[#1A2B4C] text-white py-6">
        <div className="container mx-auto px-6">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar para Home
          </Button>
          <h1 className="text-4xl font-bold">Solicite seu Orçamento</h1>
          <p className="text-lg text-white/80 mt-2">Preencha o formulário abaixo e nossa equipe entrará em contato</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário Principal - 2/3 da largura */}
          <div className="lg:col-span-2">
            <div className="bg-muted/30 border border-muted/40 rounded-xl p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* CATEGORIA 1: Dados Pessoais */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Dados Pessoais</h3>
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
                </div>

                {/* CATEGORIA 2: Detalhes da Viagem */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Detalhes da Viagem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  </div>
                </div>

                {/* CATEGORIA 3: Passageiros */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Passageiros</h3>
                  <div className="grid grid-cols-3 gap-3">
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
                  </div>
                </div>

                {/* CATEGORIA 4: Preferências */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Preferências</h3>
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
                  <div>
                    <label className="block text-xs font-medium text-accent mb-1">Malas Despachadas</label>
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

                {/* CATEGORIA 5: Serviços Adicionais */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Serviços Adicionais</h3>
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

                {/* CATEGORIA 6: Informações Adicionais */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-accent border-b border-muted pb-2">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-accent mb-1">
                        Motivo da Viagem <span className="text-red-500">*</span>
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
                  <div>
                    <label className="block text-xs font-medium text-accent mb-1">Investimento Estimado</label>
                    <input
                      type="text"
                      name="campoAdicional_3"
                      value={formData.campoAdicional_3}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="R$ 5.000 - R$ 10.000"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-accent mb-1">Cupom de Desconto</label>
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
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4">
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
                    onClick={() => navigate("/")}
                    className="flex-1 border border-muted text-foreground py-2 rounded-md font-medium text-sm hover:bg-muted/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Direita - 1/3 da largura */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Outras Formas de Contato</CardTitle>
                <CardDescription>Prefere falar diretamente conosco?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companySettings?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{companySettings.phone}</p>
                    </div>
                  </div>
                )}
                {companySettings?.whatsapp && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">{companySettings.whatsapp}</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-accent"
                        onClick={() => {
                          if (companySettings?.whatsapp) {
                            const phoneNumber = companySettings.whatsapp.replace(/\D/g, "");
                            window.open(`https://wa.me/55${phoneNumber}`, "_blank");
                          }
                        }}
                      >
                        Abrir WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
                {companySettings?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <p className="text-sm text-muted-foreground">{companySettings.email}</p>
                    </div>
                  </div>
                )}
                {companySettings?.companyName && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">Empresa</p>
                      <p className="text-sm text-muted-foreground">{companySettings.companyName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-accent">Por que escolher a Xplore?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>✓ Atendimento personalizado</p>
                <p>✓ Melhores preços do mercado</p>
                <p>✓ Suporte 24/7 durante a viagem</p>
                <p>✓ Roteiros exclusivos</p>
                <p>✓ Experiência de 6+ anos</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
