import { useEffect, useState } from 'react';

interface ScrollSpyOptions {
  sectionIds: string[];
  offset?: number;
}

/**
 * Hook que detecta qual seção está visível na tela durante scroll
 * Retorna o ID da seção mais próxima do topo da viewport
 */
export function useScrollSpy({ sectionIds, offset = 100 }: ScrollSpyOptions): string {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || 'home');

  useEffect(() => {
    const handleScroll = () => {
      // Encontrar qual seção está mais próxima do topo
      let currentSection = sectionIds[0];
      
      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        
        // Se a seção está visível na viewport (com offset)
        if (rect.top <= offset && rect.bottom > offset) {
          currentSection = sectionId;
          break;
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
