import { useState, useRef, useEffect } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CarouselNavigation } from "@/components/CarouselNavigation";

interface Travel {
  id: number;
  title: string;
  origin: string;
  departureDate: string | null;
  returnDate: string | null;
  description: string;
  travelers: string | null;
  price: string;
  imageUrl: string | null;
}

export default function PackagesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Função para formatar data no formato "20 fev 2026"
  const formatDateDisplay = (dateStr: string | null): string | null => {
    if (!dateStr) return null;

    const monthMap: { [key: string]: string } = {
      '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
      '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
    };

    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthMap[String(date.getMonth() + 1).padStart(2, '0')];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateStr;
    }
  };

  // Reset index when category changes
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
  };

  // Fetch travels from database
  const travelsQuery = trpc.viagens.list.useQuery(undefined);
  const categoriesQuery = trpc.categorias.list.useQuery(undefined);

  // Get travels data - superjson wraps data in { json: [...] }
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

  const displayedTravels = filteredTravels;
  const totalItems = displayedTravels.length;

  // Navigation functions - move 1 item at a time
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  // Touch handlers for swipe
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
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Calculate which cards to show
  // Desktop: show current and next card (2 cards)
  // Mobile: show only current card (1 card)
  const getVisibleCards = () => {
    if (totalItems === 0) return [];

    const cards = [];
    // Always show current card
    cards.push(displayedTravels[currentIndex]);

    // On desktop (md+), show next card too
    if (totalItems > 1) {
      const nextIndex = (currentIndex + 1) % totalItems;
      cards.push(displayedTravels[nextIndex]);
    }

    return cards;
  };

  const visibleCards = getVisibleCards();

  // Calculate dots for pagination
  const totalDots = totalItems;

  if (travelsQuery.isLoading) {
    return (
      <section id="pacotes" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
        <div className="max-w-4xl w-full">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-accent mb-12">
            Pacotes de Viagem
          </h2>
          <div className="text-center text-accent/60">Carregando pacotes...</div>
        </div>
      </section>
    );
  }

  if (displayedTravels.length === 0) {
    return (
      <section id="pacotes" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
        <div className="max-w-4xl w-full">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-accent mb-12">
            Pacotes de Viagem
          </h2>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categoriesWithTravels}
          />
          <div className="text-center text-accent/60 mt-8">
            Nenhum pacote disponível no momento
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pacotes" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
      <div className="max-w-4xl w-full">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-accent mb-12">
          Pacotes de Viagem
        </h2>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={categoriesWithTravels}
        />

        {/* Carousel Container with Touch Support */}
        <div
          ref={carouselRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {visibleCards.map((travel, index) => (
            <div
              key={`${travel.id}-${currentIndex}-${index}`}
              className={index === 1 ? "hidden md:block" : ""}
            >
              <div className="group cursor-pointer">
                <div className="bg-card rounded-lg overflow-hidden transition-all duration-300 flex flex-col h-full">
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={
                        travel.imageUrl ||
                        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop"
                      }
                      alt={travel.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-accent/90 text-white px-4 py-2 rounded-full font-light">
                      R$ {parseFloat(travel.price).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-2xl font-light text-accent mb-2">
                        {travel.title}
                      </h3>
                      <p className="text-sm text-accent/70 font-light line-clamp-2 min-h-[2.5rem]">
                        {travel.description}
                      </p>
                    </div>

                    {/* Travel Details Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted/40 flex-grow">
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide mb-1">
                          Saindo de
                        </p>
                        <p className="text-sm font-medium text-accent">
                          {travel.origin}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide mb-1">
                          Viajantes
                        </p>
                        <p className="text-sm font-medium text-accent">
                          {travel.travelers || "2"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide mb-1">
                          Data Ida
                        </p>
                        <p className="text-sm font-medium text-accent">
                          {travel.departureDate ? formatDateDisplay(travel.departureDate) : "A definir"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide mb-1">
                          Data Volta
                        </p>
                        <p className="text-sm font-medium text-accent">
                          {travel.returnDate ? formatDateDisplay(travel.returnDate) : "A definir"}
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-white font-light py-6 rounded-lg transition-all"
                      onClick={() => {
                        // TODO: Open quotation modal
                        console.log("Solicitar cotação para:", travel.title);
                      }}
                    >
                      Solicitar Cotação
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        {totalItems > 1 && (
          <div className="flex items-center justify-between">
            <CarouselNavigation
              currentIndex={currentIndex}
              totalItems={totalItems}
              onPrev={prevSlide}
              onNext={nextSlide}
              variant="dots"
              buttonStyle="large"
            />
          </div>
        )}
      </div>
    </section>
  );
}
