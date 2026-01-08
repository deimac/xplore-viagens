import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  MapPin, 
  Clock,
  Check,
  Mail,
  Phone,
  User
} from "lucide-react";
import { toast } from "sonner";

export default function TravelDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: "2",
    message: ""
  });

  // Parse ID
  const travelId = id ? parseInt(id) : 0;
  
  // Debug: log ID
  useEffect(() => {
    console.log('TravelDetails mounted with id:', id, 'parsed:', travelId);
  }, [id, travelId]);

  // Buscar detalhes do destino usando (trpc as any) para contornar erro de tipos
  const { data, isLoading, error } = (trpc as any).travels.getById.useQuery(
    { id: travelId },
    { 
      enabled: !!id && !isNaN(travelId),
      retry: false
    }
  );

  // Debug: log query state
  useEffect(() => {
    console.log('Query state:', { data, isLoading, error });
  }, [data, isLoading, error]);

  // Extrair travel dos dados (pode estar wrapped em superjson)
  const travel = (data as any)?.json || data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Solicitação enviada! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", phone: "", travelers: "2", message: "" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Carregando destino...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Erro ao carregar destino</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => navigate("/")}>Voltar para Home</Button>
      </div>
    );
  }

  if (!travel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold mb-4">Destino não encontrado</h1>
        <Button onClick={() => navigate("/")}>Voltar para Home</Button>
      </div>
    );
  }

  // Imagens do destino (usando a mesma imagem por enquanto, pode ser expandido)
  const images = [travel.imageUrl, travel.imageUrl, travel.imageUrl];

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Galeria de Fotos */}
        <div className="mb-12">
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
            <img
              src={images[selectedImageIndex]}
              alt={travel.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-video rounded-lg overflow-hidden transition-all ${
                  selectedImageIndex === index
                    ? "ring-2 ring-primary"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${travel.title} - ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Coluna Esquerda - Informações */}
          <div className="lg:col-span-2 space-y-8">
            {/* Título e Preço */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{travel.title}</h1>
              <p className="text-muted-foreground text-lg mb-4">{travel.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  R$ {parseFloat(travel.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground">por pessoa</span>
              </div>
            </div>

            {/* Informações Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <Calendar className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-semibold">7 dias</p>
              </Card>
              <Card className="p-4">
                <Users className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Grupo</p>
                <p className="font-semibold">2-15 pessoas</p>
              </Card>
              <Card className="p-4">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-semibold">{travel.title}</p>
              </Card>
              <Card className="p-4">
                <Clock className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Partida</p>
                <p className="font-semibold">Flexível</p>
              </Card>
            </div>

            {/* Descrição */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Sobre o Destino</h2>
              <p className="text-muted-foreground leading-relaxed">
                {travel.description}
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Descubra as maravilhas de {travel.title}, um destino que combina história, 
                cultura e experiências inesquecíveis. Nossa equipe especializada preparou 
                um roteiro exclusivo para você aproveitar ao máximo cada momento desta viagem.
              </p>
            </div>

            {/* Itinerário */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Itinerário</h2>
              <div className="space-y-4">
                {[
                  { day: 1, title: "Chegada e Check-in", description: "Chegada ao destino, transfer para hotel e check-in. Tarde livre para explorar a região." },
                  { day: 2, title: "City Tour", description: "Tour guiado pelos principais pontos turísticos da cidade com guia local." },
                  { day: 3, title: "Experiências Culturais", description: "Visita a museus, galerias e centros culturais. Almoço em restaurante típico." },
                  { day: 4, title: "Dia Livre", description: "Dia livre para atividades opcionais ou relaxamento no hotel." },
                  { day: 5, title: "Passeio Panorâmico", description: "Passeio pelos arredores com paradas em mirantes e locais fotogênicos." },
                  { day: 6, title: "Compras e Gastronomia", description: "Visita a mercados locais e jantar especial de despedida." },
                  { day: 7, title: "Check-out e Partida", description: "Café da manhã, check-out e transfer para aeroporto." }
                ].map((item) => (
                  <Card key={item.day} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">{item.day}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Dia {item.day}: {item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* O que está incluído */}
            <div>
              <h2 className="text-2xl font-bold mb-4">O que está incluído</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Passagens aéreas ida e volta",
                  "7 noites de hospedagem",
                  "Café da manhã diário",
                  "Transfers aeroporto-hotel-aeroporto",
                  "Passeios mencionados no itinerário",
                  "Guia turístico em português",
                  "Seguro viagem",
                  "Taxas e impostos"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita - Formulário de Reserva */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Solicitar Cotação</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Número de Viajantes
                  </label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={formData.travelers}
                    onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">
                    Mensagem (opcional)
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Conte-nos mais sobre sua viagem..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Solicitar Cotação
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Entraremos em contato em até 24 horas
                </p>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
