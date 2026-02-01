import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselNavigationProps {
    currentIndex: number;
    totalItems: number;
    onPrev: () => void;
    onNext: () => void;
    onDotClick?: (index: number) => void;
    variant?: "dots" | "counter";
    buttonStyle?: "large" | "small";
    showDotsLimit?: number;
}

export function CarouselNavigation({
    currentIndex,
    totalItems,
    onPrev,
    onNext,
    onDotClick,
    variant = "dots",
    buttonStyle = "large",
    showDotsLimit = Infinity,
}: CarouselNavigationProps) {
    const shouldShowDots = totalItems <= showDotsLimit;

    // Button styling based on size
    const buttonClasses = {
        large: "hidden md:flex w-12 h-12 rounded-full border-2 border-accent/30 bg-white hover:bg-accent hover:border-accent text-accent hover:text-white transition-all duration-300 items-center justify-center shadow-lg z-50",
        small: "p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all border border-slate-200 text-slate-600 hover:text-accent",
    };

    const iconSize = {
        large: "w-6 h-6",
        small: "w-4 h-4",
    };

    return (
        <div className="flex items-center justify-center gap-6 mt-4">
            {/* Previous Button */}
            <button
                onClick={onPrev}
                className={buttonClasses[buttonStyle]}
                aria-label="Anterior"
            >
                <ChevronLeft className={iconSize[buttonStyle]} />
            </button>

            {/* Navigation Indicators */}
            {variant === "dots" && shouldShowDots ? (
                <div className="flex gap-2">
                    {Array.from({ length: totalItems }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => onDotClick?.(index)}
                            className={`transition-all duration-300 rounded-full ${index === currentIndex
                                    ? "w-10 h-3 bg-amber-500"
                                    : "w-3 h-3 bg-gray-400 hover:bg-gray-500"
                                }`}
                            aria-label={`Ir para item ${index + 1}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                        {currentIndex + 1}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="text-sm text-slate-600">{totalItems}</span>
                </div>
            )}

            {/* Next Button */}
            <button
                onClick={onNext}
                className={buttonClasses[buttonStyle]}
                aria-label="Próximo"
            >
                <ChevronRight className={iconSize[buttonStyle]} />
            </button>
        </div>
    );
}
