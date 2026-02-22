import { useState } from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { FacebookLoginButton } from '@/components/FacebookLoginButton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { APP_LOGO, APP_TITLE } from '@/const';

export default function ReviewPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createReview = trpc.reviews.create.useMutation();

  const handleLoginSuccess = (id: number, info: { name: string; email: string; avatarUrl: string | null }) => {
    setIsAuthenticated(true);
    setAuthorId(id);
    setAuthorInfo(info);
    toast.success(`Bem-vindo, ${info.name}!`);
  };

  const handleGoogleError = () => {
    toast.error('Falha ao fazer login com Google. Tente novamente.');
  };

  const handleFacebookError = () => {
    toast.error('Falha ao fazer login com Facebook. Tente novamente.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorId) {
      toast.error('Você precisa fazer login primeiro');
      return;
    }

    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Por favor, escreva um comentário com pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReview.mutateAsync({
        authorId,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);
      toast.success('Avaliação enviada com sucesso! Obrigado pelo seu feedback.');
    } catch (error) {
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: '#1A2B4C' }}>
        <div className="max-w-2xl w-full">
          {/* Logo - Above Container */}
          {APP_LOGO && (
            <div className="text-center mb-12">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-24 md:h-32 mx-auto" />
            </div>
          )}
          <div className="bg-white rounded-lg p-12 border-2 border-muted/40 text-center" style={{ boxShadow: '0 0 0 6px #fff' }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-light text-accent mb-4">
              Avaliação Enviada com <span className="font-semibold">Sucesso!</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Obrigado por compartilhar sua experiência conosco. Sua avaliação será revisada e publicada em breve.
            </p>
            {authorInfo && (
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                {authorInfo.avatarUrl && (
                  <img
                    src={authorInfo.avatarUrl}
                    alt={authorInfo.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="text-left">
                  <p className="font-medium text-accent">{authorInfo.name}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: '#1A2B4C' }}>
      <div className="max-w-2xl w-full">
        {/* Logo - Above Container */}
        {APP_LOGO && (
          <div className="text-center mb-12">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-24 md:h-32 mx-auto" />
          </div>
        )}
        <div className="bg-white rounded-lg p-8 md:p-12 border-2 border-muted/40" style={{ boxShadow: '0 0 0 6px #fff' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-light text-accent mb-2">
              Avalie Sua <span className="font-semibold">Experiência</span>
            </h1>
            <p className="text-muted-foreground">
              Sua opinião é muito importante para nós
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-6">
                  Para deixar sua avaliação, faça login com sua conta Google ou Facebook
                </p>
                <div className="space-y-4">
                  <GoogleLoginButton
                    onSuccess={handleLoginSuccess}
                    onError={handleGoogleError}
                  />
                  <div className="flex items-center gap-4 max-w-[300px] mx-auto">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <FacebookLoginButton
                    onSuccess={handleLoginSuccess}
                    onError={handleFacebookError}
                  />
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Usaremos seu nome e foto da sua conta para exibir sua avaliação</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info */}
              {authorInfo && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {authorInfo.avatarUrl && (
                    <img
                      src={authorInfo.avatarUrl}
                      alt={authorInfo.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-accent">{authorInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{authorInfo.email}</p>
                  </div>
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Avaliação *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {rating === 1 && 'Muito insatisfeito'}
                    {rating === 2 && 'Insatisfeito'}
                    {rating === 3 && 'Neutro'}
                    {rating === 4 && 'Satisfeito'}
                    {rating === 5 && 'Muito satisfeito'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-accent mb-2">
                  Comentário * (mínimo 10 caracteres)
                </label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos sobre sua experiência..."
                  rows={6}
                  className="resize-none"
                  required
                  minLength={10}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {comment.length} caracteres
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
