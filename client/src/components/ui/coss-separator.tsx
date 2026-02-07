import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/utils"

type CossSeparatorProps = SeparatorPrimitive.Props

function CossSeparator({
  className,
  orientation = "horizontal",
  ...props
}: CossSeparatorProps) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className
      )}
      data-slot="coss-separator"
      orientation={orientation}
      {...props}
    />
  )
}

export { CossSeparator }
