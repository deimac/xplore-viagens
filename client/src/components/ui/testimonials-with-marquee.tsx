import { cn } from "@/lib/utils";
import {
  TestimonialCard,
  TestimonialAuthor,
} from "@/components/ui/testimonial-card";

interface TestimonialsSectionProps {
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
}

export function TestimonialsSection({
  testimonials,
  className,
}: TestimonialsSectionProps) {
  // Se não houver testemunhos, não renderiza nada
  if (!testimonials || testimonials.length === 0) {
    return null;
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:gap-16 w-full px-2">
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden min-h-[260px]">
        <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:70s]">
          <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
            {[...Array(4)].map((_, setIndex) =>
              testimonials.map((testimonial, i) => (
                <TestimonialCard
                  key={`${setIndex}-${i}`}
                  {...testimonial}
                />
              ))
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/4 bg-gradient-to-r from-[#F7F7F7] sm:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/4 bg-gradient-to-l from-[#F7F7F7] sm:block" />
      </div>
    </div>
  );
}
