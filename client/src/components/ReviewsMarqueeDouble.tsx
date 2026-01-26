import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { trpc } from "@/lib/trpc";
import { SectionTitle } from "@/components/SectionTitle";
import { Star } from "lucide-react";

interface ReviewCardProps {
    name: string;
    avatarUrl?: string | null;
    rating: number;
    comment: string;
    date: string;
}

const ReviewCard = ({ name, avatarUrl, rating, comment, date }: ReviewCardProps) => {
    return (
        <figure
            className={cn(
                "relative w-56 sm:w-72 h-[160px] cursor-pointer overflow-hidden rounded-xl p-2.5 border border-gray-200 flex flex-col",
                "bg-white hover:bg-gray-50 transition-colors duration-300"
            )}
        >
            <div className="flex flex-row items-center gap-2 mb-2">
                {avatarUrl ? (
                    <img className="rounded-full w-10 h-10 object-cover" alt={name} src={avatarUrl} />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-base">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex flex-col flex-1">
                    <figcaption className="text-base font-semibold text-accent">
                        {name}
                    </figcaption>
                    <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${i < rating ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-300"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <blockquote className="text-sm text-accent/70 leading-relaxed line-clamp-3 flex-1">
                {comment}
            </blockquote>
            <p className="text-xs text-accent/50 mt-1">{date}</p>
        </figure>
    );
};

export default function ReviewsMarqueeDouble() {
    const { data: reviews, isLoading } = trpc.reviews.listApproved.useQuery();

    // Skeleton loading
    if (isLoading) {
        return (
            <section className="py-12 sm:py-24 md:py-32 px-0" style={{ background: "#F7F7F7" }}>
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-4 px-4">
                        <div className="h-12 w-64 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-80 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="w-full">
                        <div className="flex gap-4 overflow-hidden p-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="w-56 sm:w-72 shrink-0 animate-pulse bg-white rounded-xl p-3 border border-gray-200"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                                            <div className="h-3 bg-gray-200 rounded w-24" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-200 rounded" />
                                        <div className="h-3 bg-gray-200 rounded" />
                                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Se não houver reviews, não mostra a seção
    if (!reviews || reviews.length === 0) {
        return null;
    }

    // Transforma os dados das reviews
    const reviewsData = reviews.map((review) => ({
        name: review.author?.name || "Cliente",
        avatarUrl: review.author?.avatarUrl,
        rating: review.rating,
        comment: review.comment,
        date: new Date(review.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }),
    }));

    // Divide as reviews em duas linhas
    const firstRow = reviewsData.slice(0, Math.ceil(reviewsData.length / 2));
    const secondRow = reviewsData.slice(Math.ceil(reviewsData.length / 2));

    return (
        <section className="py-12 sm:py-24 md:py-32 px-0" style={{ background: "#F7F7F7" }}>
            <div className="max-w-6xl mx-auto">
                <SectionTitle
                    title="O que Nossos Clientes"
                    highlight="Dizem"
                    subtitle="Avaliações reais de quem viajou conosco"
                />

                {/* Desktop: Duas linhas horizontais */}
                <div className="hidden md:block relative w-full overflow-hidden">
                    <Marquee pauseOnHover className="[--duration:40s] mb-4">
                        {firstRow.map((review, index) => (
                            <ReviewCard key={`first-${index}`} {...review} />
                        ))}
                    </Marquee>
                    <Marquee reverse pauseOnHover className="[--duration:40s]">
                        {secondRow.map((review, index) => (
                            <ReviewCard key={`second-${index}`} {...review} />
                        ))}
                    </Marquee>

                    {/* Gradientes laterais */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 bg-gradient-to-r from-[#F7F7F7] to-transparent"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 bg-gradient-to-l from-[#F7F7F7] to-transparent"></div>
                </div>

                {/* Tablet: Duas colunas verticais */}
                <div className="hidden md:block lg:hidden relative h-[500px] w-full overflow-hidden">
                    <div className="flex justify-center gap-4 h-full">
                        <Marquee pauseOnHover vertical className="[--duration:30s]">
                            {firstRow.map((review, index) => (
                                <ReviewCard key={`first-tablet-${index}`} {...review} />
                            ))}
                        </Marquee>
                        <Marquee reverse pauseOnHover vertical className="[--duration:30s]">
                            {secondRow.map((review, index) => (
                                <ReviewCard key={`second-tablet-${index}`} {...review} />
                            ))}
                        </Marquee>
                    </div>

                    {/* Gradientes superior e inferior */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-[#F7F7F7] to-transparent"></div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-[#F7F7F7] to-transparent"></div>
                </div>

                {/* Mobile: Uma coluna vertical */}
                <div className="md:hidden relative flex h-[500px] w-full overflow-hidden justify-center">
                    <Marquee pauseOnHover vertical className="[--duration:30s]">
                        {reviewsData.map((review, index) => (
                            <ReviewCard key={`mobile-${index}`} {...review} />
                        ))}
                    </Marquee>

                    {/* Gradientes superior e inferior */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-[#F7F7F7] to-transparent"></div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-[#F7F7F7] to-transparent"></div>
                </div>
            </div>
        </section>
    );
}
