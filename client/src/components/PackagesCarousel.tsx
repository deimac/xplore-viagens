import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryFilter from "@/components/CategoryFilter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

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

  // Reset index when category changes
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentIndex(0);
  };

  // Fetch travels from database
  const travelsQuery = trpc.travels.list.useQuery(undefined);
  const categoriesQuery = trpc.categories.list.useQuery(undefined);

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
              <div className="group cursor-pointer" style={{ boxShadow: '0 0 0 6px #fff' }}>
                <div className="bg-card rounded-lg overflow-hidden border-2 border-muted/40 hover:border-accent/30 transition-all duration-300 flex flex-col h-full">
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
                          {travel.departureDate ? new Date(travel.departureDate).toLocaleDateString('pt-BR') : "A definir"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide mb-1">
                          Data Volta
                        </p>
                        <p className="text-sm font-medium text-accent">
                          {travel.returnDate ? new Date(travel.returnDate).toLocaleDateString('pt-BR') : "A definir"}
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
            {/* Navigation Arrows - Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={prevSlide}
                className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                aria-label="Pacote anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={nextSlide}
                className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                aria-label="Próximo pacote"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Page Indicators - Right */}
            <div className="flex gap-2">
              {Array.from({ length: totalDots }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentIndex === index
                      ? "bg-accent w-8"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                  aria-label={`Ir para pacote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
