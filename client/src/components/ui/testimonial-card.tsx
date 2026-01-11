import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface TestimonialAuthor {
  name: string;
  avatarUrl?: string;
  rating?: number;
  date?: string;
}

interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
  className?: string;
}

export function TestimonialCard({
  author,
  text,
  href,
  className,
}: TestimonialCardProps) {
  const Card = href ? "a" : "div";
  const rating = author.rating ?? 5;

  return (
    <Card
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        // Estilo padrão do site - StandardContainer pattern
        "flex flex-col rounded-lg border-2 border-muted/40 bg-white p-6 text-left",
        "w-[320px] sm:w-[360px] shrink-0",
        "transition-all duration-300 hover:border-accent/30",
        href && "cursor-pointer",
        className
      )}
      style={{ boxShadow: "0 0 0 6px #fff" }}
    >
      {/* Author Info */}
      <div className="flex items-center gap-4 mb-4">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-muted/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center border-2 border-muted/30">
            <span className="text-lg font-medium text-accent">
              {author.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-accent truncate">{author.name}</h3>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment */}
      <p className="text-muted-foreground leading-relaxed text-sm flex-1">
        "{text}"
      </p>

      {/* Date */}
      {author.date && (
        <div className="mt-4 text-xs text-muted-foreground">{author.date}</div>
      )}
    </Card>
  );
}
