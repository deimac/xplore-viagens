import { cn } from "@/lib/utils";

interface SectionTitleProps {
  /**
   * Primeira parte do título (antes da palavra em destaque)
   * Exemplo: "Soluções para Cada Tipo de"
   */
  title?: string;
  
  /**
   * Palavra ou frase em destaque (negrito)
   * Exemplo: "Viajante"
   */
  highlight?: string;
  
  /**
   * Título completo quando não há palavra em destaque
   * Exemplo: "Ofertas de Destinos"
   */
  fullTitle?: string;
  
  /**
   * Subtítulo descritivo abaixo do título
   */
  subtitle?: string;
  
  /**
   * Alinhamento do texto
   * @default "center"
   */
  align?: "left" | "center" | "right";
  
  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
}

/**
 * Componente padronizado para títulos de seções
 * 
 * Centraliza o estilo de todos os títulos do site em um único lugar.
 * Alterar cores, tamanhos ou fontes aqui atualiza automaticamente todos os títulos.
 * 
 * @example
 * // Com palavra em destaque
 * <SectionTitle 
 *   title="Soluções para Cada Tipo de"
 *   highlight="Viajante"
 *   subtitle="Contamos com um suporte completo..."
 * />
 * 
 * @example
 * // Título simples sem destaque
 * <SectionTitle 
 *   fullTitle="Ofertas de Destinos"
 *   subtitle="Explore nossos pacotes exclusivos"
 * />
 */
export function SectionTitle({
  title,
  highlight,
  fullTitle,
  subtitle,
  align = "center",
  className,
}: SectionTitleProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <div className={cn(alignClass, "mb-12 md:mb-16", className)}>
      {/* Título Principal */}
      <h2 className="text-4xl font-light text-accent mb-2">
        {fullTitle ? (
          // Título completo sem destaque
          fullTitle
        ) : (
          // Título com palavra em destaque
          <>
            {title} <span className="font-semibold">{highlight}</span>
          </>
        )}
      </h2>
      
      {/* Subtítulo */}
      {subtitle && (
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
