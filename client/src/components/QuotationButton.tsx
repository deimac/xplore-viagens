import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

interface QuotationButtonProps {
    onClick?: () => void;
    className?: string;
    variant?: "amber" | "white";
}

export default function QuotationButton({ onClick, className = "", variant = "amber" }: QuotationButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        onClick?.();
    };

    const colors = {
        amber: {
            text: "text-amber-500",
            textHover: "hover:text-amber-600",
            border: "border-amber-500",
            borderHover: "group-hover:border-amber-600",
        },
        white: {
            text: "text-white",
            textHover: "hover:text-white/90",
            border: "border-white",
            borderHover: "group-hover:border-white/90",
        },
    };

    const color = colors[variant];

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group inline-flex items-center gap-2 px-0 py-0 bg-transparent ${color.text} ${color.textHover} font-medium cursor-pointer transition-colors duration-300 ${className}`}
            aria-label="Solicite Orçamento"
        >
            <span className="text-base">Solicite Orçamento</span>
            <span className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${color.border} ${color.borderHover} overflow-hidden transition-colors duration-300`}>
                <ArrowUpRight
                    className={`absolute w-3.5 h-3.5 ${color.text} transition-all duration-300 ease-out ${isHovered ? "translate-x-3 -translate-y-3 opacity-0" : "translate-x-0 translate-y-0 opacity-100"}`}
                />
                <ArrowUpRight
                    className={`absolute w-3.5 h-3.5 ${color.text} transition-all duration-300 ease-out ${isHovered ? "translate-x-0 translate-y-0 opacity-100" : "-translate-x-3 translate-y-3 opacity-0"}`}
                />
            </span>
        </button>
    );
}
