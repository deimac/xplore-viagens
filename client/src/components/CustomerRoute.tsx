/**
 * CustomerRoute – Guard de rotas da Minha Conta
 * - Sem sessão → /xp-club/login
 * - Cadastro incompleto → /xp-club/completar-cadastro
 * - Tudo ok → renderiza o componente
 */
import { trpc } from "@/lib/trpc";
import { Redirect } from "wouter";
import CustomerLayout from "./CustomerLayout";
import { Loader2 } from "lucide-react";

interface CustomerRouteProps {
    component: React.ComponentType;
}

export function CustomerRoute({ component: Component }: CustomerRouteProps) {
    const { data: cliente, isLoading, error } = trpc.cliente.me.useQuery();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    // Sem sessão
    if (!cliente || error) {
        return <Redirect to="/xp-club/login" />;
    }

    // Cadastro incompleto
    if (!cliente.cadastroCompleto) {
        return <Redirect to="/xp-club/completar-cadastro" />;
    }

    return (
        <CustomerLayout>
            <Component />
        </CustomerLayout>
    );
}

/**
 * CustomerCadastroRoute – permite acesso apenas se logado (cadastro pode estar incompleto)
 */
export function CustomerCadastroRoute({ component: Component }: CustomerRouteProps) {
    const { data: cliente, isLoading, error } = trpc.cliente.me.useQuery();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!cliente || error) {
        return <Redirect to="/xp-club/login" />;
    }

    // Se já completou o cadastro, manda pro dashboard
    if (cliente.cadastroCompleto) {
        return <Redirect to="/xp-club/dashboard" />;
    }

    return (
        <CustomerLayout>
            <Component />
        </CustomerLayout>
    );
}
