import { useState, useEffect, useRef } from "react";
import { MessageCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";
import QuotationButton from "@/components/QuotationButton";
import { CarouselNavigation } from "@/components/CarouselNavigation";

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

// Slides hardcoded como fallback caso banco esteja vazio
const fallbackSlides: Slide[] = [
  {
    id: 1,
    image: "/hero-santorini.jpg",
    title: "Viva experiências inesquecíveis",
    subtitle: "Descubra a magia de Santorini e deixe-se encantar pelo pôr do sol mais bonito do mundo",
  },
  {
    id: 2,
    image: "/hero-salinas-maragogi.jpg",
    title: "Paraíso All-Inclusive no Nordeste",
    subtitle: "Relaxe nas águas cristalinas de Maragogi e desfrute do melhor resort de praia do Brasil",
  },
];

interface HeroSliderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  sidebarItems: Array<{
    id: string;
    label: string;
    icon: any;
  }>;
  activeSection: string;
  scrollToSection: (sectionId: string) => void;
  onOpenQuotation?: () => void;
}

export default function HeroSlider({ isMobileMenuOpen, setIsMobileMenuOpen, menuRef, sidebarItems, activeSection, scrollToSection, onOpenQuotation }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [, navigate] = useLocation();

  // Buscar configurações da empresa
  const { data: companySettings } = trpc.companySettings.get.useQuery();

  // Buscar slides ativos do banco de dados
  const { data: dbSlides, isLoading } = trpc.heroSlides.listActive.useQuery();

  // Usar slides do banco ou fallback
  const slidesData = dbSlides && dbSlides.length > 0
    ? dbSlides.map(slide => ({
      id: slide.id!,
      image: slide.imageUrl,
      title: slide.title,
      subtitle: slide.subtitle || "",
    }))
    : fallbackSlides;

  const slides = slidesData;

  const whatsappNumber = companySettings?.whatsapp || "";
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [slides.length]);

  // Mostrar loading enquanto carrega slides
  if (isLoading) {
    return (
      <div className="relative w-full h-[575px] md:h-[690px] bg-accent flex items-center justify-center">
        <p className="text-white text-lg">Carregando...</p>
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[575px] md:h-[690px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Overlay escuro para melhor legibilidade */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Conteúdo do Slide */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-6 md:px-16">
              <div className="flex flex-col items-center gap-6">
                <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-2xl text-white/95 max-w-3xl drop-shadow-lg min-h-[72px]">
                  {slide.subtitle}
                </p>

                {/* Botões CTA */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow"
                    onClick={() => window.open(whatsappLink, "_blank")}
                  >
                    Fale Conosco
                    <MessageCircle className="ml-2 w-4 h-4" />
                  </Button>

                  <QuotationButton onClick={onOpenQuotation} variant="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Indicadores (Dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <CarouselNavigation
          currentIndex={currentSlide}
          totalItems={slides.length}
          onPrev={goToPrevious}
          onNext={goToNext}
          onDotClick={goToSlide}
          variant="dots"
          buttonStyle="large"
        />
      </div>
    </div>
  );
}
