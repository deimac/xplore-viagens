import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { StandardContainer } from "@/components/StandardContainer";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useCountUp } from "@/hooks/useCountUp";
import QuotationForm from "@/components/QuotationForm";
import PackagesCarouselTail from "@/components/PackagesCarouselTail";
import { trpc } from "@/lib/trpc";

import FadeInContainer from "@/components/FadeInContainer";
import HeroSlider from "@/components/HeroSlider";
import TravelerTypesSection from "@/components/TravelerTypesSection";
import { SectionTitle } from "@/components/SectionTitle";
import ReviewsSection from "@/components/ReviewsSection";
import ReviewsMarqueeSection from "@/components/ReviewsMarqueeSection";


import {
  Home as HomeIcon,
  Plane,
  Compass,
  Users,
  Star,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Briefcase,
  Mail,
  Grid3x3,
  Menu,
  X,
  MessageCircle,
  FileText,
  MapPin,
  Package,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Buscar configurações da empresa
  const { data: companySettings } = trpc.companySettings.get.useQuery();

  // Counter animations for stats
  const { count: travelsCount, elementRef: travelsRef } = useCountUp({ end: 1000, duration: 2500 });
  const { count: clientsCount, elementRef: clientsRef } = useCountUp({ end: 2000, duration: 2500 });
  const { count: yearsCount, elementRef: yearsRef } = useCountUp({ end: 4, duration: 2000 });

  // Use the scroll to section hook
  useScrollToSection();

  const sidebarItems = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "servicos", icon: Compass, label: "Serviços" },
    { id: "pacotes", icon: Plane, label: "Pacotes" },
    { id: "portfolio", icon: MapPin, label: "Portfólio" },
    { id: "depoimentos", icon: Users, label: "Clientes" },
    { id: "contato", icon: Mail, label: "Contato" },
  ];

  // Use Scroll Spy para destacar automaticamente a seção visível
  let activeSection = useScrollSpy({
    sectionIds: sidebarItems.map(item => item.id),
    offset: 100,
  });

  // Se o modal de cotações está aberto, destaque o botão de cotações
  if (isQuotationOpen) {
    activeSection = "quotation";
  }

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    
    // Se modal está aberto, fechar e aguardar antes de fazer scroll
    if (isQuotationOpen) {
      setIsQuotationOpen(false);
      // Aguardar o modal fechar (100ms de delay)
      setTimeout(() => {
        performScroll(sectionId);
      }, 100);
    } else {
      performScroll(sectionId);
    }
  };

  const performScroll = (sectionId: string) => {
    // Se Home, fazer scroll para o topo (incluindo cabecalho)
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      // Reset all FadeInContainers in the target section
      const fadeContainers = element.querySelectorAll('[data-fade-in]');
      fadeContainers.forEach((container) => {
        container.classList.remove('opacity-100', 'translate-y-0');
        container.classList.add('opacity-0', 'translate-y-8');
      });
      
      element.scrollIntoView({ behavior: "smooth" });
      
      // Trigger animations after scroll
      setTimeout(() => {
        fadeContainers.forEach((container, index) => {
          setTimeout(() => {
            container.classList.remove('opacity-0', 'translate-y-8');
            container.classList.add('opacity-100', 'translate-y-0');
          }, index * 100);
        });
      }, 300);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Esquerda - Desktop Only */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-40 bg-background border-r border-muted flex-col items-end py-8 px-6 z-50">
        {/* Flex-1 para centralizar o menu */}
        <div className="flex-1 flex items-center justify-end w-full">
          {/* Menu Container - Sutil */}
          <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40">
            {/* Menu Items */}
            <nav className="flex flex-col gap-1 w-full">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ml-auto relative group ${
                      isActive
                        ? "bg-accent"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? "stroke-accent-foreground text-accent-foreground"
                        : "stroke-accent text-accent"
                    }`} strokeWidth={1.5} />
                    {/* Sombra branca quase transparente */}
                    <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    {/* Tooltip elegante */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Botão Go Top - Dentro de um container */}
        <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40">
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-md text-accent hover:bg-muted/40 flex items-center justify-center transition-all duration-300 relative group"
          >
            <ArrowUp className="w-5 h-5 stroke-accent text-accent transition-transform duration-500" strokeWidth={1.5} />
            {/* Sombra branca quase transparente */}
            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Popup elegante */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-muted/20 border border-muted/60 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)', borderColor: 'rgba(0, 0, 0, 0.25)'}}>
              Ir ao Topo
            </div>
          </button>
        </div>
      </aside>

      {/* Sidebar Direita - Desktop Only */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-40 bg-background border-l border-muted flex-col items-start justify-center py-8 px-6 z-50">
        {/* WhatsApp Button */}
        <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40 mb-3">
          <button className="w-10 h-10 rounded-md text-accent flex items-center justify-center transition-all duration-300 relative group hover:bg-muted/40">
            <MessageCircle className="w-5 h-5 stroke-accent text-accent" strokeWidth={1.5} />
            {/* Destaque cinza ao passar o mouse */}
            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Tooltip elegante */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
              WhatsApp
            </div>
          </button>
        </div>

        {/* Cotações Button */}
        <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40">
          <button onClick={() => setIsQuotationOpen(true)} className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 relative group ${
            activeSection === "quotation"
              ? "bg-accent text-accent-foreground"
              : "text-accent hover:bg-muted/40"
          }`}>
            <FileText className={`w-5 h-5 ${
              activeSection === "quotation"
                ? "stroke-accent-foreground text-accent-foreground"
                : "stroke-accent text-accent"
            }`} strokeWidth={1.5} />
            {/* Destaque cinza ao passar o mouse */}
            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            {/* Tooltip elegante */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
              Cotações
            </div>
          </button>
        </div>
      </aside>



      {/* Botão Go Top Flutuante - Final da Página (Desktop) */}
      <div className="hidden lg:block fixed bottom-8 left-[calc(80px-27px)] z-40">
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ml-auto relative group bg-muted/30 border border-muted/60 hover:bg-muted/40 p-2"
        >
          <ArrowUp className="w-5 h-5 stroke-accent text-accent transition-transform duration-500" strokeWidth={1.5} />
          {/* Sombra branca quase transparente */}
          <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          {/* Tooltip elegante */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
            Ir ao Topo
          </div>
        </button>
      </div>

      {/* Conteúdo Principal Rolável */}
      <main className="lg:ml-40 lg:mr-40 flex-1 overflow-y-auto">
        {/* Mostrar formulário ou conteúdo principal */}
        {isQuotationOpen ? (
          <div className="flex items-center justify-center px-4 md:px-8 py-12 min-h-screen">
            <QuotationForm onClose={() => setIsQuotationOpen(false)} />
          </div>
         ) : (
          <>
        {/* Hero Slider Full-Width - Inicia no Topo */}
        <div className="pt-0">
          <HeroSlider isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} menuRef={menuRef} sidebarItems={sidebarItems} activeSection={activeSection} scrollToSection={scrollToSection} />
        </div>
        
        <section id="home" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl w-full">
            {/* Hero Container */}
            <FadeInContainer>
            <StandardContainer variant="muted" padding="lg" className="section-transition relative overflow-hidden">
              {/* Background Image - Desktop Only */}
              <div className="hidden md:block absolute right-0 -top-8 w-1/2 h-[110%] opacity-100 pointer-events-none" style={{backgroundImage: 'url(/NovaMao.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'right top'}}></div>
              <div className="relative z-10 max-w-xl py-8">
                <div className="space-y-6">
                  <h1 className="text-4xl md:text-5xl font-light leading-tight text-accent">
                    Explore o mundo com a gente
                  </h1>
                  <p className="text-base md:text-lg text-accent/70 leading-relaxed font-light">
                    Descubra destinos incríveis, crie memórias inesquecíveis e viva experiências transformadoras.
                  </p>
                </div>
              </div>
            </StandardContainer>
            </FadeInContainer>

            {/* Stats Containers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-6">
              <FadeInContainer delay="0">
              <div ref={travelsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{boxShadow: '0 0 0 6px #fff'}}>
                <p className="text-lg md:text-xl text-accent text-center">
                  <span className="font-semibold text-amber-500">+{travelsCount}</span> <span className="font-light">Viagens Completas</span>
                </p>
              </div>
              </FadeInContainer>
              <FadeInContainer delay="1">
              <div ref={clientsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{boxShadow: '0 0 0 6px #fff'}}>
                <p className="text-lg md:text-xl text-accent text-center">
                  <span className="font-semibold text-amber-500">+{clientsCount}</span> <span className="font-light">Clientes Felizes</span>
                </p>
              </div>
              </FadeInContainer>
              <FadeInContainer delay="2">
              <div ref={yearsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{boxShadow: '0 0 0 6px #fff'}}>
                <p className="text-lg md:text-xl text-accent text-center">
                  <span className="font-semibold text-amber-500">+{yearsCount}</span> <span className="font-light">Anos de Experiência</span>
                </p>
              </div>
              </FadeInContainer>
            </div>
          </div>
        </section>

        {/* Traveler Types Section */}
        <TravelerTypesSection />

        {/* Services Section */}
        <section id="servicos" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
          <div className="max-w-4xl w-full section-transition">
            <FadeInContainer>
            <SectionTitle
              title="Serviços Sob Medida para o"
              highlight="Sucesso"
              subtitle="Transformamos ideias em realidade digital"
            />
            </FadeInContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {/* Service Card 1 */}
              <FadeInContainer delay="0">
              <div className="container-box border-2 border-muted group hover:border-accent transition-all duration-300" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-accent">Destinos Curados</h3>
                <p className="text-sm text-accent/70 font-light">
                  Selecionamos os melhores destinos do mundo para você descobrir lugares incríveis.
                </p>
              </div>
              </FadeInContainer>

              {/* Service Card 2 */}
              <FadeInContainer delay="1">
              <div className="container-box border-2 border-muted group hover:border-accent transition-all duration-300" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Compass className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-accent">Roteiros Personalizados</h3>
                <p className="text-sm text-accent/70 font-light">
                  Criamos roteiros sob medida para suas preferências e orçamento.
                </p>
              </div>
              </FadeInContainer>

              {/* Service Card 3 */}
              <FadeInContainer delay="2">
              <div className="container-box border-2 border-muted group hover:border-accent transition-all duration-300" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-accent">Suporte 24/7</h3>
                <p className="text-sm text-accent/70 font-light">
                  Nossa equipe está sempre disponível para ajudar durante sua jornada.
                </p>
              </div>
              </FadeInContainer>

              {/* Service Card 4 */}
              <FadeInContainer delay="3">
              <div className="container-box border-2 border-muted group hover:border-accent transition-all duration-300" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-accent">Experiências Premium</h3>
                <p className="text-sm text-accent/70 font-light">
                  Oferecemos pacotes exclusivos com experiências inesquecíveis.
                </p>
              </div>
              </FadeInContainer>
            </div>
          </div>
        </section>

              {/* Packages Section */}
          <section id="pacotes" className="py-0">
            <PackagesCarouselTail />
          </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
          <div className="max-w-4xl w-full section-transition">
            <FadeInContainer>
            <SectionTitle
              title="Descubra Nossas Últimas"
              highlight="Criações"
              subtitle="Projetos que combinam design e funcionalidade"
            />
            </FadeInContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Card 1 */}
              <FadeInContainer delay="0">
              <div className="group cursor-pointer" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="relative h-80 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&h=1080&fit=crop"
                    alt="Paris"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-light text-white mb-1">Paris - Cidade do Amor</h3>
                      <p className="text-sm text-white/80">Experimente a magia parisiense</p>
                    </div>
                  </div>
                </div>
              </div>
              </FadeInContainer>

              {/* Portfolio Card 2 */}
              <FadeInContainer delay="1">
              <div className="group cursor-pointer" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="relative h-80 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1540959375944-7049f642e9a0?w=1920&h=1080&fit=crop"
                    alt="Tóquio"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-light text-white mb-1">Tóquio - Tradição e Modernidade</h3>
                      <p className="text-sm text-white/80">Descubra a cultura japonesa</p>
                    </div>
                  </div>
                </div>
              </div>
              </FadeInContainer>

              {/* Portfolio Card 3 */}
              <FadeInContainer delay="2">
              <div className="group cursor-pointer" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="relative h-80 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1537225228614-b4fad34a0b60?w=1920&h=1080&fit=crop"
                    alt="Bali"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-light text-white mb-1">Bali - Paraíso Tropical</h3>
                      <p className="text-sm text-white/80">Relaxe em praias paradisíacas</p>
                    </div>
                  </div>
                </div>
              </div>
              </FadeInContainer>

              {/* Portfolio Card 4 */}
              <FadeInContainer delay="3">
              <div className="group cursor-pointer" style={{boxShadow: '0 0 0 6px #fff'}}>
                <div className="relative h-80 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&h=1080&fit=crop"
                    alt="Nova York"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-light text-white mb-1">Nova York - A Cidade que Nunca Dorme</h3>
                      <p className="text-sm text-white/80">Viva a energia urbana</p>
                    </div>
                  </div>
                </div>
              </div>
              </FadeInContainer>
            </div>
          </div>
        </section>


        {/* Nova seção de testemunhos com marquee e FadeInContainer */}
        <FadeInContainer>
          <ReviewsMarqueeSection />
        </FadeInContainer>


        {/* Contact Section */}
        <section id="contato" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative">
          <div className="max-w-4xl w-full">
            <FadeInContainer>
            <div className="rounded-lg p-8 md:p-12 border-2 border-muted/40 space-y-8 section-transition text-center" style={{background: '#FAFAFA', boxShadow: '0 0 0 6px #fff'}}>
              <SectionTitle
                title="Pronto para Sua Próxima"
                highlight="Aventura?"
                subtitle="Entre em contato e vamos criar algo incrível juntos"
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow"
                  onClick={() => setIsQuotationOpen(true)}
                >
                  Solicitar Orçamento
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-muted bg-background text-accent hover:bg-muted rounded-lg font-medium"
                >
                  Enviar Email
                </Button>
              </div>
            </div>
            </FadeInContainer>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-accent text-accent-foreground py-12 px-6 md:px-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-medium mb-4">Sobre Nós</h4>
                <p className="text-sm opacity-80">
                  {companySettings?.companyName || "Xplore Viagens"} é uma agência de viagens premium dedicada a criar experiências inesquecíveis.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-4">Links Rápidos</h4>
                <ul className="text-sm space-y-2 opacity-80">
                  <li><button onClick={() => scrollToSection('servicos')} className="hover:opacity-100 transition-opacity">Serviços</button></li>
                  <li><button onClick={() => scrollToSection('portfolio')} className="hover:opacity-100 transition-opacity">Portfólio</button></li>
                  <li><button onClick={() => scrollToSection('contato')} className="hover:opacity-100 transition-opacity">Contato</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4">Contato</h4>
                <div className="text-sm opacity-80 space-y-2">
                  {companySettings?.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${companySettings.email}`} className="hover:opacity-100 transition-opacity">
                        {companySettings.email}
                      </a>
                    </p>
                  )}
                  {companySettings?.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${companySettings.phone.replace(/\D/g, '')}`} className="hover:opacity-100 transition-opacity">
                        {companySettings.phone}
                      </a>
                    </p>
                  )}
                  {companySettings?.whatsapp && (
                    <p className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <a href={`https://wa.me/${companySettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                        WhatsApp: {companySettings.whatsapp}
                      </a>
                    </p>
                  )}
                  {/* Redes Sociais */}
                  <div className="flex gap-3 mt-4">
                    {companySettings?.instagram && (
                      <a href={companySettings.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {companySettings?.facebook && (
                      <a href={companySettings.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {companySettings?.linkedin && (
                      <a href={companySettings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {companySettings?.twitter && (
                      <a href={companySettings.twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-accent-foreground/20 pt-8 text-center text-sm opacity-80">
              <p>&copy; {new Date().getFullYear()} {companySettings?.companyName || "Xplore Viagens"}. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
          </>
        )}
      </main>
    </div>
  );
}
