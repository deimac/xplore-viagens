import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StandardContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Variant controls the visual style of the container
   * - "default": White background with subtle border and white outer shadow (standard site pattern)
   * - "muted": Light gray background (#FAFAFA) with subtle border and white outer shadow
   */
  variant?: "default" | "muted";
  /**
   * Padding size
   * - "default": p-6 md:p-8
   * - "lg": p-8 md:p-12
   * - "sm": p-4 md:p-6
   * - "none": no padding
   */
  padding?: "default" | "lg" | "sm" | "none";
  /**
   * Whether to apply the white outer border shadow effect
   * Default: true
   */
  withOuterBorder?: boolean;
}

/**
 * StandardContainer - Componente de container padronizado do site
 * 
 * Este componente implementa o padrão visual consistente usado em todo o site:
 * - Borda cinza sutil (border-muted/40)
 * - Sombra branca externa de 6px (boxShadow: '0 0 0 6px #fff')
 * - Fundo branco ou cinza claro
 * - Border radius padrão (rounded-lg)
 * - Sombra interna sutil (shadow-md)
 * 
 * Uso:
 * ```tsx
 * <StandardContainer>
 *   <h2>Título</h2>
 *   <p>Conteúdo</p>
 * </StandardContainer>
 * 
 * // Com variante muted (fundo cinza claro)
 * <StandardContainer variant="muted">
 *   Conteúdo
 * </StandardContainer>
 * 
 * // Com padding customizado
 * <StandardContainer padding="lg">
 *   Conteúdo
 * </StandardContainer>
 * 
 * // Sem borda branca externa
 * <StandardContainer withOuterBorder={false}>
 *   Conteúdo
 * </StandardContainer>
 * ```
 */
export function StandardContainer({
  children,
  className,
  variant = "default",
  padding = "default",
  withOuterBorder = true,
}: StandardContainerProps) {
  const paddingClasses = {
    default: "p-6 md:p-8",
    lg: "p-8 md:p-12",
    sm: "p-4 md:p-6",
    none: "",
  };

  const variantClasses = {
    default: "bg-white",
    muted: "bg-[#FAFAFA]",
  };

  const outerBorderStyle = withOuterBorder
    ? { boxShadow: "0 0 0 6px #fff" }
    : undefined;

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-muted/40 shadow-md",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      style={outerBorderStyle}
    >
      {children}
    </div>
  );
}
