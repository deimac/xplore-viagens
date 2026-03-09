/**
 * CustomerRoute – Guard de rotas da Minha Conta
 * - Sem sessão → /minha-conta/login
 * - Cadastro incompleto → /minha-conta/completar-cadastro
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
        return <Redirect to="/minha-conta/login" />;
    }

    // Cadastro incompleto
    if (!cliente.cadastroCompleto) {
        return <Redirect to="/minha-conta/completar-cadastro" />;
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
        return <Redirect to="/minha-conta/login" />;
    }

    // Se já completou o cadastro, manda pro dashboard
    if (cliente.cadastroCompleto) {
        return <Redirect to="/minha-conta/dashboard" />;
    }

    return (
        <CustomerLayout>
            <Component />
        </CustomerLayout>
    );
}
