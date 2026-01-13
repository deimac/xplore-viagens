import { cn } from "@/lib/utils";
import { textStyles } from "@/types/textStyles";

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
  subtitle?: string | React.ReactNode;

  /**
   * Subtítulo alternativo apenas para versão mobile
   */
  subtitleMobile?: string | React.ReactNode;

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
  subtitleMobile,
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

      {/* Subtítulo - Desktop */}
      {subtitle && (
        <p className={`${textStyles.baseCorpo} hidden md:block`}>
          {subtitle}
        </p>
      )}

      {/* Subtítulo - Mobile */}
      {subtitleMobile && (
        <p className={`${textStyles.baseCorpo} md:hidden`}>
          {subtitleMobile}
        </p>
      )}

      {/* Fallback: Se não houver subtitleMobile, mostrar subtitle em mobile */}
      {!subtitleMobile && subtitle && (
        <p className={`${textStyles.baseCorpo} md:hidden`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
