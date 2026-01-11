import { trpc } from "@/lib/trpc";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";
import { TestimonialAuthor } from "@/components/ui/testimonial-card";

/**
 * ReviewsMarqueeSection - Nova seção de avaliações com efeito marquee
 * 
 * Este componente busca as avaliações aprovadas do banco de dados
 * e exibe em um carrossel infinito com animação marquee.
 */
export default function ReviewsMarqueeSection() {
  const { data: reviews, isLoading } = trpc.reviews.listApproved.useQuery();

  // Skeleton loading
  if (isLoading) {
    return (
      <section className="py-12 sm:py-24 md:py-32 px-0" style={{ background: "#F7F7F7" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center sm:gap-16">
          <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
            <div className="h-12 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-80 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[320px] sm:w-[360px] shrink-0 animate-pulse bg-white rounded-lg p-6 border-2 border-muted/40"
                style={{ boxShadow: "0 0 0 6px #fff" }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
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
      </section>
    );
  }

  // Se não houver reviews, não mostra a seção
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Transforma os dados das reviews para o formato esperado pelo componente
  const testimonials = reviews.map((review) => ({
    author: {
      name: review.author?.name || "Cliente",
      avatarUrl: review.author?.avatarUrl,
      rating: review.rating,
      date: new Date(review.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    } as TestimonialAuthor,
    text: review.comment,
  }));

  return (
    <TestimonialsSection
      title="O que Nossos Clientes Dizem"
      description="Avaliações reais de quem viajou conosco"
      testimonials={testimonials}
    />
  );
}
