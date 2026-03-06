import { useEffect, useState } from 'react';

interface ScrollSpyOptions {
  sectionIds: string[];
  offset?: number;
}

/**
 * Hook que detecta qual seção está visível na tela durante scroll
 * Retorna o ID da seção mais próxima do topo da viewport
 */
export function useScrollSpy({ sectionIds, offset = 200 }: ScrollSpyOptions): string {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || 'home');

  useEffect(() => {
    const handleScroll = () => {
      // Encontrar qual seção tem mais conteúdo visível na viewport
      let currentSection = sectionIds[0];
      let maxVisibleHeight = 0;

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (!element) continue;

        const rect = element.getBoundingClientRect();

        // Calcular altura visível do elemento
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(window.innerHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Se a seção tem mais conteúdo visível, ela se torna ativa
        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          currentSection = sectionId;
        }
      }

      setActiveSection(currentSection);
    };

    // Adicionar listener de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Chamar uma vez ao montar para definir a seção inicial
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds, offset]);

  return activeSection;
}
