import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Menu, X } from "lucide-react";
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
}

export default function HeroSlider({ isMobileMenuOpen, setIsMobileMenuOpen, menuRef, sidebarItems, activeSection, scrollToSection }: HeroSliderProps) {
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
      {/* Top Bar com Degradê Horizontal - Position Absolute Sobre Slider */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 md:px-16 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, rgba(26, 43, 76, 1) 0%, rgba(26, 43, 76, 0.95) 15%, rgba(26, 43, 76, 0.7) 25%, rgba(26, 43, 76, 0.4) 40%, rgba(26, 43, 76, 0.2) 55%, transparent 70%)' }}>
        <img src={APP_LOGO} alt={APP_TITLE} className="h-16 md:h-20 w-auto" />

        {/* Menu Hamburguer Mobile */}
        <div ref={menuRef} className="lg:hidden relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-12 h-12 rounded-lg border-2 border-muted bg-card text-accent flex items-center justify-center hover:opacity-90 transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Dropdown Menu - Grid 2 Colunas */}
          {isMobileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 bg-card border-2 border-muted rounded-2xl shadow-lg overflow-hidden animate-fade-in z-50 p-4 w-80">
              <div className="grid grid-cols-2 gap-3">
                {sidebarItems.map((item, index) => {
                  const Icon = item.icon;
                  const isLastAndOdd = index === sidebarItems.length - 1 && sidebarItems.length % 2 !== 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`border-2 rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-all font-medium text-sm ${activeSection === item.id
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-muted/40 bg-muted/15 text-accent"
                        } ${isLastAndOdd ? "col-span-2" : ""
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${activeSection === item.id ? "stroke-accent-foreground text-accent-foreground" : "stroke-accent text-accent"
                        }`} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

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

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-muted bg-background text-accent hover:bg-muted rounded-lg font-medium"
                  onClick={() => navigate("/orcamento")}
                >
                  Solicite Orçamento
                </Button>
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
