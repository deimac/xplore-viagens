import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, User, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery(undefined, {
    enabled: !!user,
  });

  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reserva cancelada com sucesso!");
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar reserva");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary">{APP_TITLE}</a>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Acesso Restrito</h1>
            <p className="text-muted-foreground">Você precisa estar logado para ver suas reservas.</p>
            <Button asChild>
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            <Link href="/my-bookings">
              <a className="text-sm font-medium text-primary">
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
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold text-foreground mb-3">Minhas Reservas</h1>
          <p className="text-lg text-muted-foreground">
            Gerencie suas viagens e reservas
          </p>
        </div>
      </section>

      {/* Bookings List */}
      <section className="py-12 bg-background flex-1">
        <div className="container">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const checkInDate = new Date(booking.checkIn);
                const checkOutDate = new Date(booking.checkOut);
                const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Reserva #{booking.id}</CardTitle>
                          <CardDescription>
                            Criada em {new Date(booking.createdAt).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Check-in</p>
                            <p className="text-sm text-muted-foreground">
                              {checkInDate.toLocaleDateString("pt-BR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Check-out</p>
                            <p className="text-sm text-muted-foreground">
                              {checkOutDate.toLocaleDateString("pt-BR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Hóspedes</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.guests} {booking.guests === 1 ? "pessoa" : "pessoas"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Duração</p>
                            <p className="text-sm text-muted-foreground">
                              {nights} {nights === 1 ? "noite" : "noites"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Valor Total</span>
                          <span className="text-2xl font-bold text-primary">R$ {booking.totalPrice}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 flex justify-between">
                      <Button variant="outline" asChild>
                        <Link href={`/destination/${booking.destinationId}`}>
                          <a>Ver Destino</a>
                        </Link>
                      </Button>
                      {booking.status === "pending" && (
                        <Button
                          variant="destructive"
                          onClick={() => cancelBooking.mutate({ id: booking.id })}
                          disabled={cancelBooking.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {cancelBooking.isPending ? "Cancelando..." : "Cancelar Reserva"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto space-y-4">
                <h2 className="text-2xl font-bold">Nenhuma reserva encontrada</h2>
                <p className="text-muted-foreground">
                  Você ainda não fez nenhuma reserva. Explore nossos destinos e comece a planejar sua próxima viagem!
                </p>
                <Button asChild>
                  <Link href="/destinations">
                    <a>Explorar Destinos</a>
                  </Link>
                </Button>
              </div>
            </div>
          )}
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
