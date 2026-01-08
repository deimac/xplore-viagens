import { useEffect } from 'react';

export function useScrollToSection() {
  useEffect(() => {
    const handleMenuClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]') || target.closest('button[data-section]');
      
      if (link) {
        const sectionId = link.getAttribute('href')?.slice(1) || link.getAttribute('data-section');
        
        if (sectionId) {
          e.preventDefault();
          
          // Scroll to section
          const section = document.getElementById(sectionId);
          if (section) {
            // Reset all FadeInContainers in the target section
            const fadeContainers = section.querySelectorAll('[data-fade-in]');
            fadeContainers.forEach((container) => {
              container.classList.remove('opacity-100', 'translate-y-0');
              container.classList.add('opacity-0', 'translate-y-8');
            });
            
            // Scroll with smooth behavior
            section.scrollIntoView({ behavior: 'smooth' });
            
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
        }
      }
    };

    // Add event listeners to all menu buttons
    const menuButtons = document.querySelectorAll('[data-menu-item]');
    menuButtons.forEach((button) => {
      button.addEventListener('click', handleMenuClick as EventListener);
    });

    return () => {
      menuButtons.forEach((button) => {
        button.removeEventListener('click', handleMenuClick as EventListener);
      });
    };
  }, []);
}
