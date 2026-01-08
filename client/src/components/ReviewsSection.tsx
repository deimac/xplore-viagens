import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import FadeInContainer from './FadeInContainer';
import { SectionTitle } from './SectionTitle';
import { StandardContainer } from './StandardContainer';

export default function ReviewsSection() {
  const { data: reviews, isLoading } = trpc.reviews.listApproved.useQuery();

  if (isLoading) {
    return (
      <section className="py-20 px-6 md:px-16" style={{ background: '#F7F7F7' }}>
        <div className="max-w-4xl mx-auto">
          <FadeInContainer>
            <SectionTitle
              title="O que Nossos Clientes"
              highlight="Dizem"
              subtitle="Avaliações reais de quem viajou conosco"
            />
          </FadeInContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-lg p-6 border-2 border-muted/40"
                style={{ boxShadow: '0 0 0 6px #fff' }}
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

  if (!reviews || reviews.length === 0) {
    return null; // Don't show section if no reviews
  }

  return (
    <section id="avaliacoes" className="py-20 px-6 md:px-16" style={{ background: '#F7F7F7' }}>
      <div className="max-w-4xl mx-auto">
        <FadeInContainer>
          <SectionTitle
            title="O que Nossos Clientes"
            highlight="Dizem"
            subtitle="Avaliações reais de quem viajou conosco"
          />
        </FadeInContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <FadeInContainer key={review.id} delay={`${index * 0.1}`}>
              <StandardContainer className="h-full">
                {/* Author Info */}
                <div className="flex items-center gap-4 mb-4">
                  {review.author?.avatarUrl && (
                    <img
                      src={review.author.avatarUrl}
                      alt={review.author.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-accent">
                      {review.author?.name || 'Cliente'}
                    </h3>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-muted-foreground leading-relaxed">
                  "{review.comment}"
                </p>

                {/* Date */}
                <div className="mt-4 text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </StandardContainer>
            </FadeInContainer>
          ))}
        </div>
      </div>
    </section>
  );
}
