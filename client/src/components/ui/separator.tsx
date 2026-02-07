import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

export interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      className={className}
      orientation={orientation}
      decorative={decorative}
    />
  );
}
