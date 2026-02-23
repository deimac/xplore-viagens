import { useState, useEffect } from "react";
import { MapPin, Users, Building2, Moon, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CategoryFilter from "@/components/CategoryFilter";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";
import { CarouselNavigation } from "@/components/CarouselNavigation";

interface PackagesCarouselTailProps {
  whatsappNumber?: string | null;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const monthMap: Record<string, string> = {
    '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
    '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
  };
  try {
    // Handle YYYY-MM-DD format (from DB DATE column)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const day = parseInt(isoMatch[3]).toString().padStart(2, '0');
      const month = monthMap[isoMatch[2]] || isoMatch[2];
      const year = isoMatch[1];
      return `${day} ${month} ${year}`;
    }
    // Handle Date object stringified as ISO
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = date.getUTCDate().toString().padStart(2, '0');
      const monthKey = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const month = monthMap[monthKey] || monthKey;
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const calculateNights = (dataIda: string | null | undefined, dataVolta: string | null | undefined): number | null => {
  if (!dataIda || !dataVolta) return null;

  const start = new Date(dataIda);
  const end = new Date(dataVolta);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return nights > 0 ? nights : null;
};

function buildViagemWhatsAppLink(viagem: any, rawNumber: string): string {
  const number = rawNumber.replace(/\D/g, '');
  const message = `Olá! Tenho interesse na viagem:\n\n` +
    `📋 Código: #${viagem.id}\n` +
    `✈️ ${viagem.titulo}\n` +
    `👥 ${viagem.quantidadePessoas} ${viagem.quantidadePessoas === 1 ? 'viajante' : 'viajantes'}\n` +
    `💰 ${formatCurrency(viagem.valorTotal)}\n\n` +
    `Gostaria de mais informações!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function PackagesCarouselTail({ whatsappNumber }: PackagesCarouselTailProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
  };

  // Buscar viagens e categorias
  const travelsQuery = trpc.viagens.list.useQuery();
  const categoriesQuery = trpc.categorias.list.useQuery();

  const allTravels = (travelsQuery.data as any)?.json || travelsQuery.data || [];
  const allCategories = (categoriesQuery.data as any)?.json || categoriesQuery.data || [];

  // Filter categories to show only those with associated travels
  const categoriesWithTravels = allCategories.filter((cat: any) => {
    return allTravels.some((travel: any) =>
      travel.categorias?.some((c: any) => c.id === cat.id)
    );
  });

  // Filter travels by selected category
  const filteredTravels = selectedCategory
    ? allTravels.filter((travel: any) =>
      travel.categorias?.some((c: any) => c.id === selectedCategory)
    )
    : allTravels;

  const travels = filteredTravels;
  const isLoading = travelsQuery.isLoading || categoriesQuery.isLoading;

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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

  const currentTravel = travels[currentIndex];

  // Handlers para swipe/touch
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNext();
    if (distance < -50) handlePrev();
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Função para calcular posição e estilo de cada card
  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const totalCards = travels.length;
    let normalizedDiff = diff;
    if (Math.abs(diff) > totalCards / 2) {
      normalizedDiff = diff > 0 ? diff - totalCards : diff + totalCards;
    }

    // MOBILE: 3 cards
    if (isMobile) {
      if (normalizedDiff === 0) return { transform: "translateX(0%) scale(1.05)", zIndex: 50, opacity: 1, pointerEvents: "auto" as const };
      if (normalizedDiff === -1) return { transform: "translateX(-70%) scale(0.75)", zIndex: 40, opacity: 1, pointerEvents: "auto" as const };
      if (normalizedDiff === 1) return { transform: "translateX(70%) scale(0.75)", zIndex: 40, opacity: 1, pointerEvents: "auto" as const };
      return { transform: normalizedDiff < 0 ? "translateX(-90%) scale(0.5)" : "translateX(90%) scale(0.5)", zIndex: 10, opacity: 0, pointerEvents: "none" as const };
    }

    // DESKTOP: 5 cards
    if (normalizedDiff === 0) return { transform: "translateX(0%) scale(1.0)", zIndex: 50, opacity: 1, pointerEvents: "auto" as const };
    if (normalizedDiff === -1) return { transform: "translateX(-60%) scale(0.75)", zIndex: 40, opacity: 1, pointerEvents: "auto" as const };
    if (normalizedDiff === 1) return { transform: "translateX(60%) scale(0.75)", zIndex: 40, opacity: 1, pointerEvents: "auto" as const };
    if (normalizedDiff === -2) return { transform: "translateX(-100%) scale(0.6)", zIndex: 30, opacity: 1, pointerEvents: "none" as const };
    if (normalizedDiff === 2) return { transform: "translateX(100%) scale(0.6)", zIndex: 30, opacity: 1, pointerEvents: "none" as const };
    return { transform: normalizedDiff < 0 ? "translateX(-120%) scale(0.45)" : "translateX(120%) scale(0.45)", zIndex: 10, opacity: 0, pointerEvents: "none" as const };
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
          <div className="relative w-full min-h-[450px] md:min-h-[580px]">
            {/* Cards Container */}
            <div
              className="relative w-full h-[420px] md:h-[500px] flex items-center justify-center"
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
                        if (index !== currentIndex) {
                          setCurrentIndex(index);
                        }
                      }}
                    >
                      <div
                        className="rounded-2xl overflow-hidden bg-white h-[400px] md:h-[460px]"
                        style={{
                          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        {/* Image Section - Top */}
                        <div className="relative h-[52%] md:h-[50%] overflow-hidden">
                          <img
                            src={travel.imagemUrl}
                            alt={travel.titulo}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                          {/* Destaque badges */}
                          {travel.destaques?.length > 0 && (
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                              {travel.destaques.map((d: any) => (
                                <span
                                  key={d.id}
                                  className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md"
                                >
                                  {d.nome}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Título e origem sobre a imagem (acima do espaço branco) */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 text-white">
                            <h3 className="text-[15px] md:text-lg font-bold leading-tight line-clamp-2">
                              {travel.titulo}
                            </h3>
                            {travel.origem && (
                              <div className="flex items-center gap-1.5 text-white/90 text-[11px] md:text-sm mt-0.5 md:mt-1">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Saindo de {travel.origem}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info Section - Bottom */}
                        <div className="pl-4 pr-4 pb-4 pt-3 md:pl-5 md:pr-5 md:pb-5 md:pt-5 h-[48%] md:h-[50%] flex flex-col">
                          <div className="grid grid-rows-3 gap-1.5 md:gap-2 text-gray-500 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Moon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {travel.dataIda && travel.dataVolta
                                  ? (() => {
                                    const nights = calculateNights(travel.dataIda, travel.dataVolta);
                                    const rangeText = `${formatDate(travel.dataIda)} a ${formatDate(travel.dataVolta)}`;
                                    return nights != null
                                      ? `${nights} ${nights === 1 ? 'noite' : 'noites'} · ${rangeText}`
                                      : rangeText;
                                  })()
                                  : formatDate(travel.dataIda) || formatDate(travel.dataVolta) || "Data não informada"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 min-w-0">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{travel.quantidadePessoas} {travel.quantidadePessoas === 1 ? 'viajante' : 'viajantes'}</span>
                            </div>

                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {travel.hospedagem && String(travel.hospedagem).trim()
                                  ? travel.hospedagem
                                  : "Hospedagem não informada"}
                              </span>
                            </div>
                          </div>

                          <div className="my-3 md:my-2 border-t border-gray-200/80" />

                          <div className="mt-0 md:mt-auto flex flex-col md:grid md:grid-cols-[55%_45%] md:gap-4 md:items-end">
                            <div>
                              <p className="text-xs md:text-sm text-gray-500">
                                Apartir de
                              </p>
                              <p className="text-base md:text-xl font-bold text-accent">
                                {formatCurrency(travel.valorTotal)}
                              </p>
                              {travel.quantidadeParcelas && travel.valorParcela ? (
                                <p className="text-xs md:text-sm text-gray-500">
                                  ou {travel.quantidadeParcelas}x de {formatCurrency(travel.valorParcela)} {travel.temJuros ? 'com\u00A0juros' : 'sem\u00A0juros'}
                                </p>
                              ) : null}
                              {travel.xp > 0 && (
                                <p className="mt-1 text-xs md:text-sm font-semibold text-amber-600">
                                  Acumule +{Number(travel.xp).toLocaleString('pt-BR')} pontos XP
                                </p>
                              )}
                            </div>

                            <div className="hidden md:flex h-full items-end justify-end pr-2">
                              {whatsappNumber && (
                                <a
                                  href={buildViagemWhatsAppLink(travel, whatsappNumber)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mr-2 inline-flex items-center gap-1.5 bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow px-3 py-1.5 text-xs md:text-sm"
                                >
                                  <span>Tenho interesse</span>
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navegação */}
            <CarouselNavigation
              currentIndex={currentIndex}
              totalItems={travels.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onDotClick={goToSlide}
              variant="dots"
              buttonStyle="large"
            />

            {isMobile && whatsappNumber && currentTravel && (
              <div className="flex justify-center mt-4">
                <a
                  href={buildViagemWhatsAppLink(currentTravel, whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow px-4 py-2 text-sm"
                >
                  <span>Tenho interesse</span>
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

        </FadeInContainer>
      </div>
    </div>
  );
}
