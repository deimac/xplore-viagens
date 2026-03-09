/**
 * Dashboard XP – resumo do programa de fidelidade
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Loader2,
    Star,
    Wallet,
    Gift,
    Clock,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    TicketCheck,
} from "lucide-react";
import { Link } from "wouter";

export default function ClienteDashboard() {
    const dashboard = trpc.xp.dashboard.useQuery();
    const aplicarCodigo = trpc.xp.aplicarCodigo.useMutation();
    const [codigo, setCodigo] = useState("");
    const utils = trpc.useUtils();

    const handleAplicarCodigo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigo.trim()) return;
        try {
            const res = await aplicarCodigo.mutateAsync({ codigo: codigo.trim() });
            toast.success(`Código aplicado! +${res.xp} pontos`);
            setCodigo("");
            utils.xp.dashboard.invalidate();
        } catch (err: any) {
            toast.error(err?.message || "Código inválido");
        }
    };

    if (dashboard.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    const data = dashboard.data;
    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-light text-accent">
                    Meu <span className="font-semibold">Painel XP</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Acompanhe seus pontos e benefícios
                </p>
            </div>

            {/* Saldo cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SaldoCard
                    icon={<Star className="w-5 h-5" />}
                    label="Saldo Total"
                    value={formatPontos(data.saldoTotal)}
                    accent
                />
                <SaldoCard
                    icon={<Wallet className="w-5 h-5" />}
                    label="Disponível"
                    value={formatPontos(data.saldoDisponivel)}
                    sub={`≈ R$ ${Number(data.valorEmReais).toFixed(2)}`}
                />
                <SaldoCard
                    icon={<Gift className="w-5 h-5" />}
                    label="Qualificável"
                    value={formatPontos(data.saldoQualificavel)}
                />
                <SaldoCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Status Resgate"
                    value={data.podeResgatar ? "Liberado" : "Bloqueado"}
                    badge={data.podeResgatar}
                />
            </div>

            {/* Pontos expirando */}
            {data.pontosExpirar && data.pontosExpirar.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                            <AlertTriangle className="w-4 h-4" />
                            Pontos próximos a expirar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.pontosExpirar.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border border-orange-100"
                                >
                                    <span className="text-orange-800 font-medium">
                                        {formatPontos(item.pontos)} pontos
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        Expiram em{" "}
                                        {new Date(item.dataExpiracao).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Aplicar código */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-accent">
                        <TicketCheck className="w-4 h-4" />
                        Aplicar Código Promocional
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleAplicarCodigo}
                        className="flex items-end gap-3"
                    >
                        <div className="flex-1">
                            <Input
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                placeholder="Digite seu código"
                                className="uppercase tracking-wider"
                                maxLength={50}
                            />
                        </div>
                        <Button type="submit" disabled={aplicarCodigo.isPending || !codigo.trim()}>
                            {aplicarCodigo.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Aplicar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Últimas movimentações */}
            <Card>
                <CardHeader className="pb-2 flex flex-row justify-between items-center">
                    <CardTitle className="text-base text-accent">
                        Últimas Movimentações
                    </CardTitle>
                    <Link
                        href="/minha-conta/extrato"
                        className="text-sm text-accent underline hover:text-accent/80 transition-colors"
                    >
                        Ver extrato completo →
                    </Link>
                </CardHeader>
                <CardContent>
                    {data.ultimasMovimentacoes && data.ultimasMovimentacoes.length > 0 ? (
                        <div className="divide-y">
                            {data.ultimasMovimentacoes.map((mov: any) => (
                                <MovimentacaoRow key={mov.id} mov={mov} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            Nenhuma movimentação encontrada
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────

function SaldoCard({
    icon,
    label,
    value,
    sub,
    accent,
    badge,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
    badge?: boolean;
}) {
    return (
        <Card className={accent ? "border-accent/30 bg-accent/5" : ""}>
            <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    {icon}
                    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>
                        {value}
                    </span>
                    {badge !== undefined && (
                        <Badge variant={badge ? "default" : "secondary"}>
                            {badge ? "Ativo" : "Inativo"}
                        </Badge>
                    )}
                </div>
                {sub && <span className="text-xs text-muted-foreground mt-1 block">{sub}</span>}
            </CardContent>
        </Card>
    );
}

function MovimentacaoRow({ mov }: { mov: any }) {
    const isPositive = Number(mov.pontos) > 0;
    return (
        <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                        }`}
                >
                    {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                        {mov.tipoNome || mov.descricao || "Movimentação"}
                    </p>
                    {mov.descricao && mov.tipoNome && (
                        <p className="text-xs text-muted-foreground truncate">{mov.descricao}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {new Date(mov.createdAt || mov.created_at).toLocaleDateString("pt-BR")}
                    </p>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <span
                    className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-500"
                        }`}
                >
                    {isPositive ? "+" : ""}
                    {formatPontos(mov.pontos)}
                </span>
                {mov.qualificavel && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                        Q
                    </Badge>
                )}
            </div>
        </div>
    );
}

function formatPontos(n: number | string) {
    return Number(n).toLocaleString("pt-BR");
}
