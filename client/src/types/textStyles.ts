/**
 * Tipografia padrão do projeto
 * Centraliza todos os estilos de texto para fácil manutenção e consistência
 */

export const textStyles = {
    // Títulos dos slides do carrossel (HeroSlider)
    // Exemplo: Títulos principais dentro dos slides
    tituloSlider: "text-3xl md:text-5xl lg:text-6xl font-light text-white",

    // Subtítulos dos slides do carrossel
    // Exemplo: Descrições abaixo dos títulos dos slides
    subtituloSlider: "text-base md:text-lg lg:text-xl text-white/90 font-light",

    // Títulos em destaque maiores
    // Exemplo: "Explore o mundo com a gente"
    tituloDestaqueMaior: "text-4xl md:text-5xl font-light leading-tight text-accent",

    // Texto de corpo padrão
    // Exemplo: "Descubra destinos incríveis, crie memórias inesquecíveis..."
    baseCorpo: "text-base md:text-lg text-accent/70 leading-relaxed font-light",

    // Títulos de seção com palavra em negrito
    // Exemplo: "Soluções para Cada Tipo de Viajante"
    // Nota: Para negrito, use <span className="font-semibold">palavra</span>
    tituloSessao: "text-3xl md:text-4xl font-light text-accent",

    // Títulos em destaque menores
    // Exemplo: "Para quem viaja a trabalho" (botões do TravelerTypesSection)
    tituloDestaqueMenor: "text-base md:text-lg font-semibold text-accent",
} as const;

export type TextStyleKey = keyof typeof textStyles;