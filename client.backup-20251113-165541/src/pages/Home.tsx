import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, User } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { data: featuredDestinations, isLoading } = trpc.destinations.featured.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              {APP_TITLE}
            </a>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/destinations">
              <a className="text-sm font-medium hover:text-primary transition-colors">
                Destinos
              </a>
            </Link>
            {user ? (
              <>
                <Link href="/my-bookings">
                  <a className="text-sm font-medium hover:text-primary transition-colors">
                    Minhas Reservas
                  </a>
                </Link>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">
                    <a className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.name || "Perfil"}
                    </a>
                  </Link>
                </Button>
              </>
            ) : (
              !authLoading && (
                <Button size="sm" asChild>
                  <a href={getLoginUrl()}>Entrar</a>
                </Button>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Descubra o Brasil com a <span className="text-primary">Xplore Viagens</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore destinos incríveis, reserve experiências únicas e crie memórias inesquecíveis pelos quatro cantos do Brasil.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/destinations">
                  <a>Explorar Destinos</a>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">
                  <a>Saiba Mais</a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Destinos em Destaque</h2>
            <p className="text-muted-foreground">Conheça os lugares mais procurados pelos nossos viajantes</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDestinations?.map((destination) => (
                <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={destination.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"}
                      alt={destination.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{destination.rating}</span>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-foreground">{destination.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {destination.city}, {destination.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {destination.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">A partir de</p>
                      <p className="text-2xl font-bold text-primary">
                        R$ {destination.pricePerNight}
                        <span className="text-sm font-normal text-muted-foreground">/noite</span>
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/destination/${destination.id}`}>
                        <a>Ver Detalhes</a>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/destinations">
                <a>Ver Todos os Destinos</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2024 {APP_TITLE}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
