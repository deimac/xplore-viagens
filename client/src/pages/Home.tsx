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
import QuotationButton from "@/components/QuotationButton";
import { trpc } from "@/lib/trpc";

import FadeInContainer from "@/components/FadeInContainer";
import HeroSlider from "@/components/HeroSlider";
import TravelerTypesSection from "@/components/TravelerTypesSection";
import ServicesBentoSection from "@/components/ServicesBentoSection";
import { SectionTitle } from "@/components/SectionTitle";
import ReviewsSection from "@/components/ReviewsSection";
import ReviewsMarqueeSection from "@/components/ReviewsMarqueeSection";
import ReviewsMarqueeDouble from "@/components/ReviewsMarqueeDouble";
import { textStyles } from "@/types/textStyles";
import { PremiumFlightsSection } from "@/components/PremiumFlightsSection";
import { HospedagensSection } from "@/components/HospedagensSection";
import { AllHospedagensView } from "@/components/AllHospedagensView";
import { PropertyView } from "@/components/PropertyView";
import { AllPacotesView } from "@/components/AllPacotesView";
import ClienteAuthInline from "@/components/ClienteAuthInline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Home as HomeIcon,
  Plane,
  Compass,
  Users,
  Star,
  ArrowRight,
  ArrowUpRight,
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
  Crown,
  Building2,
  UserCircle,
} from "lucide-react";

export default function Home() {
  const [showAllPacotes, setShowAllPacotes] = useState(false);
  const [showAllHospedagens, setShowAllHospedagens] = useState(false);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  const [navigationOrigin, setNavigationOrigin] = useState<'home' | 'list' | null>(null);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTopbarSolid, setIsTopbarSolid] = useState(false);

  // Verificar se o cliente está logado
  const clienteMeQuery = trpc.cliente.me.useQuery(undefined, { retry: false });
  const isClienteLogado = !!clienteMeQuery.data;
  const clienteNome = clienteMeQuery.data?.nome || "Cliente";
  const clienteEmail = clienteMeQuery.data?.email || "";

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name?.trim()) {
      const parts = name.trim().split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email?.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return "CL";
  };

  // Garantir que ao abrir a lista de hospedagens, a seção fique visível instantaneamente
  // Ref para detectar transição de PropertyView para lista
  const prevSelectedPropertySlug = useRef<string | null>(null);
  useEffect(() => {
    // Scroll para lista de hospedagens ao abrir
    if (showAllHospedagens) {
      setTimeout(() => {
        const el = document.getElementById('all-hospedagens-section');
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 0);
    }
    // Scroll para hospedagens-section ao fechar PropertyView vindo da home
    if (
      prevSelectedPropertySlug.current &&
      !selectedPropertySlug &&
      !showAllHospedagens &&
      navigationOrigin === 'home'
    ) {
      setTimeout(() => {
        const el = document.getElementById('hospedagens-section');
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 0);
    }
    prevSelectedPropertySlug.current = selectedPropertySlug;
    // eslint-disable-next-line
  }, [showAllHospedagens, selectedPropertySlug, navigationOrigin]);
  // On mount, check if URL has a property slug and open the property view if so
  useEffect(() => {
    const match = window.location.pathname.match(/^\/hospedagem\/(.+)$/);
    if (match && match[1]) {
      setSelectedPropertySlug(match[1]);
      setNavigationOrigin('home');
    }
  }, []);
  const [location, navigate] = useLocation();

  // Auto-abrir auth quando acessa /xp-club diretamente
  useEffect(() => {
    if (location === "/xp-club") {
      if (isClienteLogado) {
        navigate("/xp-club/dashboard");
      } else if (!clienteMeQuery.isLoading) {
        setShowAuth(true);
      }
    }
  }, [location, isClienteLogado, clienteMeQuery.isLoading]);

  // Helper to open hospedagens list and scroll to top
  const openAllHospedagens = () => {
    setShowAllHospedagens(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const menuRef = useRef<HTMLDivElement>(null);

  // Buscar configurações da empresa
  const { data: companySettings } = trpc.companySettings.get.useQuery();
  const { data: ofertasVoo } = trpc.ofertasVoo.listActive.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });

  // Counter animations for stats
  // Força o reset dos contadores ao voltar para a Home
  const isHome = location === "/";
  const { count: travelsCount, elementRef: travelsRef } = useCountUp({ end: 1000, duration: 2500, key: isHome });
  const { count: clientsCount, elementRef: clientsRef } = useCountUp({ end: 2000, duration: 2500, key: isHome });
  const { count: yearsCount, elementRef: yearsRef } = useCountUp({ end: 4, duration: 2000, key: isHome });

  // Use the scroll to section hook
  useScrollToSection();

  const sidebarItems = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "ofertas-premium", icon: Crown, label: "Experiências Premium" },
    { id: "hospedagens-section", icon: Building2, label: "Hospedagens" },
    { id: "pacotes", icon: Plane, label: "Pacotes" },
    { id: "depoimentos", icon: Star, label: "Depoimentos" },
    { id: "contato", icon: Mail, label: "Contato" },
  ];
  // Botão de exemplo para abrir modal

  // Use Scroll Spy para destacar automaticamente a seção visível
  let activeSection = useScrollSpy({
    sectionIds: sidebarItems.map(item => item.id),
    offset: 100,
  });

  // Se o modal de cotações está aberto, destaque o botão de cotações
  // Se o modal de auth está aberto, remova destaque de qualquer seção
  if (isQuotationOpen) {
    activeSection = "quotation";
  } else if (showAuth) {
    activeSection = "";
  }

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);

    // Se algum modal está aberto, fechar e aguardar antes de fazer scroll
    if (showAuth) {
      setShowAuth(false);
      setTimeout(() => {
        performScroll(sectionId);
      }, 100);
    } else if (isQuotationOpen) {
      setIsQuotationOpen(false);
      setTimeout(() => {
        performScroll(sectionId);
      }, 100);
    } else if (showAllPacotes) {
      setShowAllPacotes(false);
      setTimeout(() => {
        performScroll(sectionId);
      }, 100);
    } else if (showAllHospedagens) {
      setShowAllHospedagens(false);
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

  // Fazer scroll para o topo quando o modal de cotações ou auth abre
  useEffect(() => {
    if (isQuotationOpen || showAuth) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isQuotationOpen, showAuth]);

  useEffect(() => {
    const updateTopbarSolid = () => {
      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      setIsTopbarSolid(isMobile && window.scrollY > 24);
    };
    updateTopbarSolid();
    window.addEventListener("scroll", updateTopbarSolid, { passive: true });
    window.addEventListener("resize", updateTopbarSolid);
    return () => {
      window.removeEventListener("scroll", updateTopbarSolid);
      window.removeEventListener("resize", updateTopbarSolid);
    };
  }, []);

  const handleMinhaContaClick = () => {
    setIsMobileMenuOpen(false);
    if (isClienteLogado) {
      navigate("/xp-club/dashboard");
    } else {
      setIsQuotationOpen(false);
      setShowAuth(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Esquerda - Desktop Only */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-40 bg-background border-r border-muted flex-col items-end py-8 px-6 z-50">
        {/* Flex-1 para centralizar o menu */}
        <div className="flex-1 flex items-center justify-end w-full">
          {/* Menu Container - Sutil */}
          <div className="flex flex-col gap-2 bg-muted/15 rounded-lg p-2 border border-muted/40">
            {/* Menu Items */}
            <nav className="flex flex-col gap-1 w-full">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 ml-auto relative group ${isActive
                      ? "bg-accent"
                      : "hover:bg-muted/40"
                      }`}
                  >
                    {Icon && <Icon className={`w-5 h-5 ${isActive
                      ? "text-accent-foreground"
                      : "text-accent"
                      }`} strokeWidth={1.5} />}
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

            {/* Tooltip elegante - mesmo estilo dos menus */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
              Ir ao Topo
            </div>
          </button>
        </div>
      </aside>

      {/* Sidebar Direita - Desktop Only */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-40 bg-background border-l border-muted flex-col items-start justify-center py-8 px-6 z-50">
        {/* WhatsApp Button */}
        <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40 mb-3">
          <button onClick={() => {
            setShowAuth(false);
            if (companySettings?.whatsapp) {
              const phoneNumber = companySettings.whatsapp.replace(/\D/g, "");
              window.open(`https://wa.me/55${phoneNumber}`, "_blank");
            }
          }} className="w-10 h-10 rounded-md text-accent flex items-center justify-center transition-all duration-300 relative group hover:bg-muted/40">
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
          <button onClick={() => { setShowAuth(false); setIsQuotationOpen(true); }} className={`w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300 relative group ${activeSection === "quotation"
            ? "bg-accent text-accent-foreground"
            : "text-accent hover:bg-muted/40"
            }`}>
            <FileText className={`w-5 h-5 ${activeSection === "quotation"
              ? "stroke-accent-foreground text-accent-foreground"
              : "stroke-accent text-accent"
              }`} strokeWidth={1.5} />
            {/* Destaque cinza ao passar o mouse */}
            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            {/* Tooltip elegante */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
              Orçamento
            </div>
          </button>
        </div>

        {/* Minha Conta Button */}
        <div className="flex flex-col gap-2 w-fit bg-muted/15 rounded-lg p-2 border border-muted/40 mt-3">
          <button onClick={handleMinhaContaClick} className={`w-10 h-10 rounded-md text-accent flex items-center justify-center transition-all duration-300 relative group hover:bg-muted/40 ${showAuth ? 'bg-accent text-accent-foreground' : ''}`}>
            <UserCircle className={`w-5 h-5 ${showAuth ? 'stroke-accent-foreground text-accent-foreground' : 'stroke-accent text-accent'}`} strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 bg-white border border-gray-300 rounded-md px-3 py-2 whitespace-nowrap text-sm font-medium text-accent shadow-lg">
              {isClienteLogado ? 'Minha Conta' : 'Conta XP Club'}
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
      <main className="lg:ml-40 lg:mr-40 flex-1 overflow-y-auto relative">

        {/* Top Bar Azul - Sempre Visível SOBRE o conteúdo */}
        <header
          className="fixed lg:absolute top-0 left-0 right-0 z-50 px-6 md:px-16 py-4 flex items-center justify-between"
          style={{
            background: (showAuth || isQuotationOpen || isTopbarSolid)
              ? "rgb(26, 43, 76)"
              : "linear-gradient(to right, rgba(26, 43, 76, 1) 0%, rgba(26, 43, 76, 0.95) 15%, rgba(26, 43, 76, 0.7) 25%, rgba(26, 43, 76, 0.4) 40%, rgba(26, 43, 76, 0.2) 55%, transparent 70%)",
            transition: "background 200ms ease, box-shadow 200ms ease",
            boxShadow: isTopbarSolid ? "0 6px 20px rgba(0, 0, 0, 0.15)" : "none",
          }}
        >
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 md:h-20 w-auto" />

          {isClienteLogado ? (
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/30">
                {clienteMeQuery.data?.avatarUrl ? (
                  <AvatarImage src={clienteMeQuery.data.avatarUrl} alt={clienteNome} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                  {getInitials(clienteMeQuery.data?.nome, clienteMeQuery.data?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-white text-sm font-semibold leading-none">{clienteNome}</p>
                <p className="text-white/80 text-xs leading-none mt-1">{clienteEmail}</p>
              </div>
            </div>
          ) : (
            <span className="hidden md:block text-white font-bold text-lg">Entre você e seu destino</span>
          )}

          {/* Menu Hamburguer Mobile */}
          <div ref={menuRef} className="lg:hidden relative">
            <div className="flex items-center gap-2">
              {isClienteLogado && (
                <div className="flex items-center gap-2 pr-1">
                  <Avatar className="h-9 w-9 border border-white/30">
                    {clienteMeQuery.data?.avatarUrl ? (
                      <AvatarImage src={clienteMeQuery.data.avatarUrl} alt={clienteNome} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                      {getInitials(clienteMeQuery.data?.nome, clienteMeQuery.data?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right max-w-[110px]">
                    <p className="text-white text-xs font-semibold truncate leading-none">{clienteNome}</p>
                    <p className="text-white/70 text-[10px] truncate leading-none mt-1">{clienteEmail}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-12 h-12 rounded-lg border-2 border-muted bg-card text-accent flex items-center justify-center hover:opacity-90 transition-all"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Dropdown Menu - Grid 2 Colunas */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-card border-2 border-muted rounded-2xl shadow-lg animate-fade-in z-50 p-4 w-[340px]">
                <div className="grid grid-cols-2 gap-3">
                  {sidebarItems.map((item, index) => {
                    const Icon = item.icon;
                    const isLastAndOdd = index === sidebarItems.length - 1 && sidebarItems.length % 2 !== 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`border-2 rounded-lg px-3 py-3 flex items-center gap-2 hover:opacity-90 transition-all font-medium text-xs ${activeSection === item.id
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-muted/40 bg-muted/15 text-accent"
                          } ${isLastAndOdd ? "col-span-2 justify-center" : ""
                          }`}
                      >
                        {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${activeSection === item.id ? "text-accent-foreground" : "text-accent"
                          }`} strokeWidth={1.5} />}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Minha Conta - Mobile */}
                <div className="mt-3 pt-3 border-t border-muted/30">
                  <button
                    onClick={handleMinhaContaClick}
                    className="col-span-2 border-2 rounded-lg px-3 py-3 flex items-center gap-2 hover:opacity-90 transition-all font-medium text-xs border-accent/30 bg-accent/5 text-accent justify-center w-full"
                  >
                    <UserCircle className="w-5 h-5 flex-shrink-0 text-accent" strokeWidth={1.5} />
                    <span>{isClienteLogado ? 'Minha Conta' : 'Conta XP Club'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Alternar entre Modal e Conteúdo da Home */}
        {showAuth ? (
          <ClienteAuthInline onClose={() => setShowAuth(false)} />
        ) : isQuotationOpen ? (
          <div className="w-full min-h-screen bg-background flex items-start justify-center py-24 px-4">
            <QuotationForm onClose={() => setIsQuotationOpen(false)} />
          </div>
        ) : selectedPropertySlug ? (
          <div className="w-full min-h-screen bg-background flex items-start justify-center py-24 px-4" id={navigationOrigin === "list" ? "all-hospedagens-section" : "hospedagens-section"}>
            <PropertyView
              slug={selectedPropertySlug}
              onClose={() => {
                setSelectedPropertySlug(null);
                if (navigationOrigin === "list") {
                  setShowAllHospedagens(true);
                } else {
                  setShowAllHospedagens(false);
                }
                setNavigationOrigin(null);
                // Restore URL to base when closing property view
                window.history.replaceState(null, '', '/');
              }}
              origin={navigationOrigin || "home"}
            />
          </div>
        ) : showAllHospedagens ? (
          <div id="all-hospedagens-section">
            <AllHospedagensView
              onClose={() => setShowAllHospedagens(false)}
              onPropertySelect={(slug) => {
                setSelectedPropertySlug(slug);
                setNavigationOrigin("list");
                setShowAllHospedagens(false);
                // Update URL with property slug for sharing
                window.history.replaceState(null, '', `/hospedagem/${slug}`);
              }}
            />
          </div>
        ) : showAllPacotes ? (
          <div id="all-pacotes-section">
            <AllPacotesView
              onClose={() => setShowAllPacotes(false)}
            />
          </div>
        ) : (
          <>
            {/* Hero Slider Full-Width - Inicia no Topo */}
            <div className="pt-0">
              <HeroSlider isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} menuRef={menuRef} sidebarItems={sidebarItems} activeSection={activeSection} scrollToSection={scrollToSection} onOpenQuotation={() => setIsQuotationOpen(true)} />
            </div>

            <section id="home" className="flex justify-center px-6 md:px-16 py-12 md:py-16 relative bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-4xl w-full">
                {/* Hero Container */}
                <FadeInContainer>
                  <StandardContainer variant="muted" padding="lg" className="section-transition relative overflow-hidden">
                    {/* Background Image - Desktop Only */}
                    <div className="hidden md:block absolute right-0 -top-8 w-1/2 h-[110%] opacity-100 pointer-events-none" style={{ backgroundImage: 'url(/NovaMao.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'right top' }}></div>
                    <div className="relative z-10 max-w-xl py-8">
                      <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-light leading-tight text-accent text-center md:text-left">
                          Explore o mundo com a gente
                        </h1>
                        <p className="text-base md:text-lg text-accent/70 leading-relaxed font-light text-center md:text-left">
                          Descubra destinos incríveis, crie memórias inesquecíveis e viva experiências transformadoras.
                        </p>
                      </div>
                    </div>
                  </StandardContainer>
                </FadeInContainer>

                {/* Stats Containers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-6">
                  <FadeInContainer delay="0">
                    <div ref={travelsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <p className="text-base md:text-lg text-accent/70 leading-relaxed font-light text-center">
                        <span className="font-semibold text-amber-500">+{travelsCount}</span> <span className="font-light">Viagens Completas</span>
                      </p>
                    </div>
                  </FadeInContainer>
                  <FadeInContainer delay="1">
                    <div ref={clientsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <p className="text-base md:text-lg text-accent/70 leading-relaxed font-light text-center">
                        <span className="font-semibold text-amber-500">+{clientsCount}</span> <span className="font-light">Clientes Felizes</span>
                      </p>
                    </div>
                  </FadeInContainer>
                  <FadeInContainer delay="2">
                    <div ref={yearsRef} className="bg-muted/15 rounded-lg py-3 px-4 md:py-4 md:px-6 border-2 border-muted/40 section-transition" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <p className="text-base md:text-lg text-accent/70 leading-relaxed font-light text-center">
                        <span className="font-semibold text-amber-500">+{yearsCount}</span> <span className="font-light">Anos de Experiência</span>
                      </p>
                    </div>
                  </FadeInContainer>
                </div>
              </div>
            </section>

            {/* Traveler Types Section */}
            <TravelerTypesSection />

            {/* Services Bento Section */}
            <ServicesBentoSection />

            {ofertasVoo && ofertasVoo.length > 0 && (
              <section id="ofertas-premium">
                <PremiumFlightsSection ofertas={ofertasVoo} whatsappNumber={companySettings?.whatsapp} />
              </section>
            )}

            {/* Hospedagens Section */}
            <section id="hospedagens-section" className="py-0">
              <HospedagensSection
                onPropertySelect={(slug) => {
                  setSelectedPropertySlug(slug);
                  setNavigationOrigin("home");
                  // Update URL with property slug for sharing
                  window.history.replaceState(null, '', `/hospedagem/${slug}`);
                }}
                onShowAllHospedagens={openAllHospedagens}
              />
            </section>

            {/* Packages Section */}
            <section id="pacotes" className="py-0">
              {showAllPacotes ? (
                <AllPacotesView onClose={() => setShowAllPacotes(false)} />
              ) : (
                <>
                  <PackagesCarouselTail whatsappNumber={companySettings?.whatsapp} />
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => {
                        setShowAllPacotes(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      variant="outline"
                      className="text-accent hover:bg-accent hover:text-white border-accent"
                    >
                      Ver todos os nossos destinos
                    </Button>
                  </div>
                </>
              )}
            </section>

            {/* Portfolio Section */}
            <section id="portfolio" className="min-h-screen flex items-center justify-center px-6 md:px-16 py-20 relative hidden">
              {/* Seção de portfólio oculta. Para reexibir, remova a classe 'hidden'. */}
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
                    <div className="group cursor-pointer" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <div className="relative h-80 overflow-hidden rounded-lg">
                        <img
                          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&h=1080&fit=crop"
                          alt="Paris"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <div>
                            <h3 className="text-2xl font-light text-white mb-1">Paris - Cidade do Amor</h3>
                            <p className="text-sm text-white/90 font-light">Experimente a magia parisiense</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeInContainer>

                  {/* Portfolio Card 2 */}
                  <FadeInContainer delay="1">
                    <div className="group cursor-pointer" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <div className="relative h-80 overflow-hidden rounded-lg">
                        <img
                          src="https://images.unsplash.com/photo-1540959375944-7049f642e9a0?w=1920&h=1080&fit=crop"
                          alt="Tóquio"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <div>
                            <h3 className="text-2xl font-light text-white mb-1">Tóquio - Tradição e Modernidade</h3>
                            <p className="text-sm text-white/90 font-light">Descubra a cultura japonesa</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeInContainer>

                  {/* Portfolio Card 3 */}
                  <FadeInContainer delay="2">
                    <div className="group cursor-pointer" style={{ boxShadow: '0 0 0 6px #fff' }}>
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
                    <div className="group cursor-pointer" style={{ boxShadow: '0 0 0 6px #fff' }}>
                      <div className="relative h-80 overflow-hidden rounded-lg">
                        <img
                          src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&h=1080&fit=crop"
                          alt="Nova York"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <div>
                            <h3 className="text-2xl font-light text-white mb-1">Nova York - A Cidade que Nunca Dorme</h3>
                            <p className="text-sm text-white/80">Viva o ritmo frenético da Big Apple</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeInContainer>
                </div>
              </div>
            </section>


            {/* Nova seção de testemunhos com marquee duplo */}
            <section id="depoimentos">
              <FadeInContainer>
                <ReviewsMarqueeDouble />
              </FadeInContainer>
            </section>


            {/* Contact Section */}
            <section id="contato" className="flex items-center justify-center px-6 md:px-16 py-12 relative">
              <div className="max-w-4xl w-full">
                <FadeInContainer>
                  <div className="rounded-lg p-6 md:p-8 border-2 border-muted/40 space-y-5 section-transition text-center" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                    <SectionTitle
                      title="Pronto para Sua Próxima"
                      highlight="Aventura?"
                      subtitle="Entre em contato e vamos criar memórias inesquecíveis juntos"
                    />

                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <span className="px-3 py-1 rounded-full border border-accent/25 text-xs text-accent bg-accent/5 flex items-center gap-2">
                        <Plane className="w-4 h-4" /> Destinos premium
                      </span>
                      <span className="px-3 py-1 rounded-full border border-accent/25 text-xs text-accent bg-accent/5 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Concierge 24/7
                      </span>
                      <span className="px-3 py-1 rounded-full border border-accent/25 text-xs text-accent bg-accent/5 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Upgrades e mimos
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-2">
                      <Button
                        size="lg"
                        className="bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow"
                        onClick={() => {
                          if (companySettings?.whatsapp) {
                            const phoneNumber = companySettings.whatsapp.replace(/\D/g, "");
                            window.open(`https://wa.me/55${phoneNumber}`, "_blank");
                          }
                        }}
                      >
                        Fale Conosco
                        <MessageCircle className="ml-2 w-4 h-4" />
                      </Button>

                      <QuotationButton onClick={() => setIsQuotationOpen(true)} />
                    </div>
                  </div>
                </FadeInContainer>
              </div>
            </section>
          </>
        )}
        {/* Footer */}
        {!isQuotationOpen && (
          <footer className="bg-accent text-accent-foreground py-12 px-6 md:px-16 w-full">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-4">Xplore Milhas e Viagens Ltda</h4>
                  <p className="text-sm opacity-80">
                    Cnpj: 57.874.236/0001-74
                  </p>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-4">Onde estamos localizados</h4>
                  <div className="text-sm opacity-80 space-y-1">
                    <p>Ironberg Bodybuilder Training Center</p>
                    <p>Av. Colombo, 3234 - Zona 7, Maringá - PR</p>
                  </div>
                </div>
                <div className="md:ml-auto">
                  <h4 className="text-lg font-semibold mb-4">Contato</h4>
                  <div className="text-sm space-y-1 opacity-80">
                    {companySettings?.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a href={`mailto:${companySettings.email}`} className="hover:opacity-100 transition-opacity">
                          {companySettings.email}
                        </a>
                      </p>
                    )}
                    {companySettings?.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${companySettings.phone.replace(/\D/g, '')}`} className="hover:opacity-100 transition-opacity">
                          {companySettings.phone}
                        </a>
                      </p>
                    )}
                    {companySettings?.whatsapp && (
                      <p className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        <a href={`https://wa.me/${companySettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                          WhatsApp: {companySettings.whatsapp}
                        </a>
                      </p>
                    )}
                    {companySettings?.instagram && (
                      <p className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 flex-shrink-0" />
                        <a href={companySettings.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                          @xploreviagens
                        </a>
                      </p>
                    )}

                    <div className="flex gap-2">
                      {companySettings?.facebook && (
                        <a href={companySettings.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {companySettings?.linkedin && (
                        <a href={companySettings.linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {companySettings?.twitter && (
                        <a href={companySettings.twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                          <Twitter className="w-4 h-4" />
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
        )}
      </main>
    </div>
  );
}