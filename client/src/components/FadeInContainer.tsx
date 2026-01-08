import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export default function FadeInContainer({ children, delay }: { children: React.ReactNode; delay?: string }) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15 });
  const delayValue = delay ? parseInt(delay) * 100 : 0;

  return (
    <div
      ref={ref}
      data-fade-in="true"
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionDelay: isVisible ? `${delayValue}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
