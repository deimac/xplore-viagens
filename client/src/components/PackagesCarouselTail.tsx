import { useState, useEffect } from "react";
import { MessageCircle, AlertTriangle } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { buildViagemWhatsAppLink } from "@/lib/packageFormat";
import { trpc } from "@/lib/trpc";
import CategoryFilter from "@/components/CategoryFilter";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";
import { CarouselNavigation } from "@/components/CarouselNavigation";

interface PackagesCarouselTailProps {
  whatsappNumber?: string | null;
}

export default function PackagesCarouselTail({ whatsappNumber }: PackagesCarouselTailProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const handleCategoryChange = (categoryId: number | string | null) => {
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
  };

  // Buscar viagens e categorias
  const travelsQuery = trpc.viagens.list.useQuery();
  const categoriesQuery = trpc.categorias.list.useQuery();

  const isAllowedByDepartureDate = (travel: any) => {
    if (!travel?.dataIda) return false;
    const departure = new Date(travel.dataIda);
    if (Number.isNaN(departure.getTime())) return false;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    departure.setHours(0, 0, 0, 0);

    // Check if departure date is in the future
    if (departure <= todayStart) return false;

    // Check if travel is active
    if (!travel.ativo) return false;

    // Check if expiration date is in the future (or not set)
    if (travel.dataExpiracao) {
      const expiration = new Date(travel.dataExpiracao);
      if (!Number.isNaN(expiration.getTime())) {
        expiration.setHours(0, 0, 0, 0);
        if (expiration <= todayStart) return false;
      }
    }

    return true;
  };

  const allTravels = ((travelsQuery.data as any)?.json || travelsQuery.data || []).filter(isAllowedByDepartureDate);
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
                      <PackageCard
                        travel={travel}
                        whatsappNumber={whatsappNumber}
                        hideButtonOnMobile
                        className="h-[400px] md:h-[460px]"
                        style={{
                          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.12)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 mb-1 px-2 flex justify-center">
              <div className="w-full max-w-[280px] md:max-w-md inline-flex items-center justify-center gap-2 text-[11px] md:text-xs text-amber-600 text-center">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <p>
                  Tarifas sujeitas a alteração e disponibilidade.<br />
                  Consulte disponibilidade para datas diferentes.
                </p>
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
      </div >
    </div >
  );
}
