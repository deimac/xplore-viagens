import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Star, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function DestinationDetail() {
  const [, params] = useRoute("/destination/:id");
  const destinationId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();

  const { user, loading: authLoading } = useAuth();
  const { data: destination, isLoading } = trpc.destinations.getById.useQuery({ id: destinationId });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Reserva criada com sucesso!");
      setLocation("/my-bookings");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar reserva");
    },
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado para fazer uma reserva");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error("Por favor, preencha as datas de check-in e check-out");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      toast.error("A data de check-out deve ser posterior à data de check-in");
      return;
    }

    const totalPrice = nights * (destination?.pricePerNight || 0);

    createBooking.mutate({
      destinationId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary">{APP_TITLE}</a>
            </Link>
          </div>
        </header>
        <div className="container py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary">{APP_TITLE}</a>
            </Link>
          </div>
        </header>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Destino não encontrado</h1>
          <Button asChild>
            <Link href="/destinations">
              <a>Voltar para Destinos</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights = checkInDate && checkOutDate
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights > 0 ? nights * destination.pricePerNight : 0;

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

      {/* Destination Details */}
      <main className="flex-1 bg-background">
        <div className="relative h-96 overflow-hidden">
          <img
            src={destination.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200"}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0">
            <div className="container">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-md">
                  <span className="text-sm font-medium text-primary-foreground">{destination.category}</span>
                </div>
                <div className="bg-card/90 backdrop-blur-sm px-3 py-1 rounded-md flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{destination.rating}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">{destination.name}</h1>
              <p className="flex items-center gap-2 text-lg text-muted-foreground">
                <MapPin className="h-5 w-5" />
                {destination.city}, {destination.country}
              </p>
            </div>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sobre o Destino</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{destination.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Faça sua Reserva</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-primary">R$ {destination.pricePerNight}</span>
                    <span className="text-muted-foreground"> /noite</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkIn" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Check-in
                      </Label>
                      <Input
                        id="checkIn"
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="checkOut" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Check-out
                      </Label>
                      <Input
                        id="checkOut"
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guests" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Hóspedes
                      </Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max="10"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        required
                      />
                    </div>

                    {nights > 0 && (
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">R$ {destination.pricePerNight} x {nights} noites</span>
                          <span className="font-medium">R$ {totalPrice}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">R$ {totalPrice}</span>
                        </div>
                      </div>
                    )}

                    {user ? (
                      <Button type="submit" className="w-full" disabled={createBooking.isPending}>
                        {createBooking.isPending ? "Processando..." : "Confirmar Reserva"}
                      </Button>
                    ) : (
                      <Button type="button" className="w-full" asChild>
                        <a href={getLoginUrl()}>Entrar para Reservar</a>
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2024 {APP_TITLE}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
