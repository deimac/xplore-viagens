import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";

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
  const [isQuotationHovered, setIsQuotationHovered] = useState(false);

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
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
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
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                {slide.title}
              </h1>
              <p className="text-lg md:text-2xl text-white/95 mb-10 max-w-3xl drop-shadow-lg">
                {slide.subtitle}
              </p>

              {/* Botões CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow"
                  onClick={() => window.open(whatsappLink, "_blank")}
                >
                  Fale Conosco
                  <MessageCircle className="ml-2 w-4 h-4" />
                </Button>

                <button
                  onClick={onOpenQuotation}
                  onMouseEnter={() => setIsQuotationHovered(true)}
                  onMouseLeave={() => setIsQuotationHovered(false)}
                  className="group inline-flex items-center gap-2 px-0 py-0 bg-transparent text-white hover:text-white/90 font-medium"
                  aria-label="Solicite Orçamento"
                >
                  <span className="text-base">Solicite Orçamento</span>
                  <span className="relative flex items-center justify-center w-6 h-6 rounded-full border border-white group-hover:border-white/90 overflow-hidden">
                    <ArrowUpRight
                      className={`absolute w-3.5 h-3.5 text-white transition-all duration-300 ease-out ${isQuotationHovered ? "translate-x-3 -translate-y-3 opacity-0" : "translate-x-0 translate-y-0 opacity-100"}`}
                    />
                    <ArrowUpRight
                      className={`absolute w-3.5 h-3.5 text-white transition-all duration-300 ease-out ${isQuotationHovered ? "translate-x-0 translate-y-0 opacity-100" : "-translate-x-3 translate-y-3 opacity-0"}`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Indicadores (Dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
              ? "bg-amber-500 w-8"
              : "bg-gray-400 hover:bg-gray-500"
              }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
