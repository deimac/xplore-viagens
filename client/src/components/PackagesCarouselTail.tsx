import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Users } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import CategoryFilter from "@/components/CategoryFilter";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";

export default function PackagesCarouselTail() {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Função para formatar data DD/MM/AAAA → DD/Mês/AAAA
  const formatDateDisplay = (dateStr: string | null): string | null => {
    if (!dateStr) return null;

    const monthMap: { [key: string]: string } = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    // Formato esperado: DD/MM/AAAA
    const match = dateStr.match(/^(\d{1,2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const day = match[1];
      const month = monthMap[match[2]];
      const year = match[3];
      return `${day}/${month}/${year}`;
    }

    return dateStr; // Retorna original se não conseguir parsear
  };

  // Função para calcular número de dias entre datas (formato DD/MM/AAAA)
  const calculateDays = (departureDate: string | null, returnDate: string | null): number | null => {
    if (!departureDate || !returnDate) return null;

    try {
      // Parsear formato DD/MM/AAAA
      const parseDate = (dateStr: string): Date | null => {
        const match = dateStr.match(/^(\d{1,2})\/(\d{2})\/(\d{4})$/);
        if (match) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        }
        return null;
      };

      const departure = parseDate(departureDate);
      const returnD = parseDate(returnDate);

      if (!departure || !returnD) return null;

      const diffTime = Math.abs(returnD.getTime() - departure.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Erro ao calcular dias:', error);
      return null;
    }
  };

  // Reset index when category changes
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
  };

  // Buscar pacotes e categorias do banco de dados
  const travelsQuery = trpc.travels.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();

  const allTravels = (travelsQuery.data as any)?.json || travelsQuery.data || [];
  const allCategories = (categoriesQuery.data as any)?.json || categoriesQuery.data || [];

  // Filter categories to show only those with associated travels
  const categoriesWithTravels = allCategories.filter((category: any) => {
    return allTravels.some((travel: any) =>
      travel.categories && travel.categories.some((cat: any) => cat.id === category.id)
    );
  });

  // Filter travels by selected category
  const filteredTravels = selectedCategory
    ? allTravels.filter((travel: any) => {
      return travel.categories && travel.categories.some((cat: any) => cat.id === selectedCategory);
    })
    : allTravels;

  const travels = filteredTravels;
  const isLoading = travelsQuery.isLoading || categoriesQuery.isLoading;

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!travels || travels.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Nenhum pacote disponível no momento.
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? travels.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === travels.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handlers para swipe/touch
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Função para calcular posição e estilo de cada card
  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const totalCards = travels.length;

    // Normalizar diferença para lidar com loop circular
    let normalizedDiff = diff;
    if (Math.abs(diff) > totalCards / 2) {
      normalizedDiff = diff > 0 ? diff - totalCards : diff + totalCards;
    }

    // MOBILE: 3 cards (1 central + 1 de cada lado)
    if (isMobile) {
      // Card central - MAIOR no mobile
      if (normalizedDiff === 0) {
        return {
          transform: "translateX(0%) scale(1.05)",
          zIndex: 50,
          opacity: 1,
          pointerEvents: "auto" as const,
        };
      }

      // Cards laterais - mais próximos e DENTRO da tela
      if (normalizedDiff === -1) {
        return {
          transform: "translateX(-70%) scale(0.75)",
          zIndex: 40,
          opacity: 1,
          pointerEvents: "auto" as const,
        };
      }

      if (normalizedDiff === 1) {
        return {
          transform: "translateX(70%) scale(0.75)",
          zIndex: 40,
          opacity: 1,
          pointerEvents: "auto" as const,
        };
      }

      // Cards ocultos no mobile
      return {
        transform: normalizedDiff < 0 ? "translateX(-90%) scale(0.5)" : "translateX(90%) scale(0.5)",
        zIndex: 10,
        opacity: 0,
        pointerEvents: "none" as const,
      };
    }

    // DESKTOP: 5 cards
    // Card central
    if (normalizedDiff === 0) {
      return {
        transform: "translateX(0%) scale(1.0)",
        zIndex: 50,
        opacity: 1,
        pointerEvents: "auto" as const,
      };
    }

    // Cards laterais próximos
    if (normalizedDiff === -1) {
      return {
        transform: "translateX(-60%) scale(0.75)",
        zIndex: 40,
        opacity: 1,
        pointerEvents: "auto" as const,
      };
    }

    if (normalizedDiff === 1) {
      return {
        transform: "translateX(60%) scale(0.75)",
        zIndex: 40,
        opacity: 1,
        pointerEvents: "auto" as const,
      };
    }

    // Cards mais distantes
    if (normalizedDiff === -2) {
      return {
        transform: "translateX(-100%) scale(0.6)",
        zIndex: 30,
        opacity: 1,
        pointerEvents: "none" as const,
      };
    }

    if (normalizedDiff === 2) {
      return {
        transform: "translateX(100%) scale(0.6)",
        zIndex: 30,
        opacity: 1,
        pointerEvents: "none" as const,
      };
    }

    // Cards ocultos
    return {
      transform: normalizedDiff < 0 ? "translateX(-120%) scale(0.45)" : "translateX(120%) scale(0.45)",
      zIndex: 10,
      opacity: 0,
      pointerEvents: "none" as const,
    };
  };

  return (
    <div className="w-full py-8 overflow-hidden" style={{ background: "#F7F7F7" }}>
      <div className="max-w-4xl mx-auto px-6 md:px-16">
        {/* Título da seção */}
        <FadeInContainer>
          <SectionTitle
            title="Ofertas de"
            highlight="Destinos"
            subtitle="Deixe-nos inspirar sua próxima viagem"
          />
        </FadeInContainer>

        {/* Filtro de Categorias */}
        <FadeInContainer delay="1">
          <div className="mb-8">
            <CategoryFilter
              categories={categoriesWithTravels}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </FadeInContainer>

        {/* Container do Carrossel */}
        <FadeInContainer delay="2">
          <div className="relative w-full min-h-[450px] md:min-h-[550px]">
            {/* Cards Container com overflow visível e touch handlers */}
            <div
              className="relative w-full h-[400px] md:h-[450px] flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-full h-full">
                {travels.map((travel: any, index: number) => {
                  const style = getCardStyle(index);

                  return (
                    <div
                      key={travel.id}
                      className="absolute left-1/2 top-1/2 w-full max-w-[280px] md:max-w-md transition-all duration-500 ease-out cursor-pointer"
                      style={{
                        transform: `translate(-50%, -50%) ${style.transform}`,
                        zIndex: style.zIndex,
                        opacity: style.opacity,
                        pointerEvents: style.pointerEvents,
                      }}
                      onClick={() => {
                        if (index === currentIndex) {
                          // Card central - navegar para detalhes
                          navigate(`/destino/${travel.id}`);
                        } else {
                          // Card lateral - trazer para o centro
                          setCurrentIndex(index);
                        }
                      }}
                    >
                      <div
                        className="relative rounded-2xl overflow-hidden bg-white h-[350px] md:h-[400px] border border-gray-500 group"
                        style={{
                          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {/* Imagem de fundo */}
                        <img
                          src={travel.imageUrl}
                          alt={travel.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Overlay gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                        {/* Badge de Promoção no topo esquerdo */}
                        {travel.promotion && travel.promotionColor && (
                          <div
                            className="absolute top-4 left-4 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg font-bold text-xs md:text-sm text-white animate-pulse"
                            style={{
                              backgroundColor: travel.promotionColor,
                              boxShadow: `0 0 20px ${travel.promotionColor}40`
                            }}
                          >
                            {travel.promotion}
                          </div>
                        )}

                        {/* Preço no topo direito */}
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                          {/* Texto "a partir de" */}
                          <p className="text-white/90 text-xs md:text-sm font-normal">
                            a partir de
                          </p>

                          {/* Badge de preço com mais transparência */}
                          <div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-lg">
                            <p className="text-accent font-bold text-base md:text-lg">
                              R$ {travel.price?.toLocaleString('pt-BR')}
                            </p>
                          </div>

                          {/* Texto de viajantes removido - agora aparece apenas na esquerda */}
                        </div>

                        {/* Informações centrais sem badges - apenas texto com ícones alinhado à esquerda */}
                        <div className="absolute top-1/2 left-4 md:left-6 transform -translate-y-1/2 flex flex-col gap-2">
                          {/* Datas - sem badge */}
                          {(travel.departureDate || travel.returnDate) && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              <p className="text-white font-medium text-sm md:text-base">
                                {travel.departureDate && travel.returnDate
                                  ? `${formatDateDisplay(travel.departureDate)} - ${formatDateDisplay(travel.returnDate)}`
                                  : formatDateDisplay(travel.departureDate) || formatDateDisplay(travel.returnDate)}
                              </p>
                            </div>
                          )}

                          {/* Número de viajantes - sem badge */}
                          {travel.travelers && (() => {
                            const num = parseInt(travel.travelers);
                            if (!isNaN(num)) {
                              return (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                  <p className="text-white font-medium text-sm md:text-base">
                                    {num} {num === 1 ? 'viajante' : 'viajantes'}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Informações no bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                          <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <h3 className="text-xl md:text-2xl font-bold">{travel.title}</h3>
                            {(() => {
                              const days = calculateDays(travel.departureDate, travel.returnDate);
                              return days ? (
                                <span className="text-xl md:text-2xl font-bold text-white">
                                  | {days} dias
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {/* Origem abaixo do título */}
                          {travel.origin && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                              <p className="text-sm md:text-base text-white/80 font-medium">
                                Saindo de {travel.origin}
                              </p>
                            </div>
                          )}

                          <p className="text-xs md:text-sm text-white/90 line-clamp-2">
                            {travel.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navegação - Posicionada abaixo dos cards */}
            <div className="flex items-center justify-center gap-6 mt-4">
              {/* Seta Esquerda - Oculta no mobile */}
              <button
                onClick={handlePrev}
                className="hidden md:flex w-12 h-12 rounded-full border-2 border-accent/30 bg-white hover:bg-accent hover:border-accent text-accent hover:text-white transition-all duration-300 items-center justify-center shadow-lg z-50"
                aria-label="Pacote anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Indicadores (bolinhas) */}
              <div className="flex gap-2">
                {travels.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${index === currentIndex
                      ? "w-10 h-3 bg-amber-500"
                      : "w-3 h-3 bg-gray-400 hover:bg-gray-500"
                      }`}
                    aria-label={`Ir para pacote ${index + 1}`}
                  />
                ))}
              </div>

              {/* Seta Direita - Oculta no mobile */}
              <button
                onClick={handleNext}
                className="hidden md:flex w-12 h-12 rounded-full border-2 border-accent/30 bg-white hover:bg-accent hover:border-accent text-accent hover:text-white transition-all duration-300 items-center justify-center shadow-lg z-50"
                aria-label="Próximo pacote"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </FadeInContainer>
      </div>
    </div>
  );
}
