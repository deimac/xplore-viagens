/**
 * Dashboard XP – resumo do programa de fidelidade
 * Layout profissional com métricas, progresso, alertas e ações rápidas
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
    Loader2,
    Star,
    Wallet,
    Gift,
    Lock,
    Unlock,
    Target,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    TicketCheck,
    Receipt,
    HelpCircle,
    CircleHelp,
    CheckCircle2,
    TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { SectionTitle } from "@/components/SectionTitle";
import { getMovimentacaoPresentation } from "@/lib/xpMovimentacaoPresentation";

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

    const saldoResgatavel = Number(data.saldoResgatavel ?? 0);
    const saldoQualificavel = Number(data.saldoQualificavel ?? 0);
    const saldoNaoQualificavel = Number(data.saldoNaoQualificavel ?? 0);
    const xpMinimo = Number(data.xpMinimoResgate ?? 0);
    const bonusDesbloqueado = Boolean(data.bonusDesbloqueado);
    const progressPercent = xpMinimo > 0 ? Math.min(100, Math.round((saldoQualificavel / xpMinimo) * 100)) : 100;
    const faltamDesbloquear = Math.max(0, xpMinimo - saldoQualificavel);
    const totalExpirar = data.pontosExpirar?.reduce((s: number, p: any) => s + Number(p.xp), 0) ?? 0;

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* ── Header ── */}
            <SectionTitle
                title="Meu"
                highlight="Painel XP"
                subtitle="Acompanhe seus pontos, bônus e benefícios do programa"
                align="center"
                className="mb-2 sm:mb-4"
                titleClassName="text-2xl sm:text-3xl"
                subtitleClassName="text-sm sm:text-base"
            />

            {/* ── Ações rápidas ── */}
            <div className="flex flex-wrap justify-center gap-2">
                <Link href="/xp-club/extrato">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/5">
                        <Receipt className="w-3.5 h-3.5" />
                        Ver extrato
                    </Button>
                </Link>
                <Link href="/xp-club/como-funciona">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Como funciona
                    </Button>
                </Link>
            </div>

            {/* ── 4 Cards de métricas ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Resgatável */}
                <MetricCard
                    icon={<Wallet className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label="Resgatável agora"
                    value={formatPontos(saldoResgatavel)}
                    sub={`≈ R$ ${Number(data.valorEmReais).toFixed(2)}`}
                    tooltip="É o saldo que você já pode usar neste momento para resgates. Inclui seus pontos qualificáveis e, se liberados, os pontos de bônus."
                    accent
                />

                {/* Qualificável */}
                <MetricCard
                    icon={<Star className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label="Qualificável"
                    value={formatPontos(saldoQualificavel)}
                    sub="Conta p/ liberar bônus"
                    tooltip="São os pontos acumulados por compras e movimentações oficiais. Esse saldo é a base para desbloquear seus pontos extras de bônus e código."
                />

                {/* Bônus bloqueados / liberados */}
                <MetricCard
                    icon={bonusDesbloqueado ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label={bonusDesbloqueado ? "Bônus liberados" : "Bônus bloqueados"}
                    value={formatPontos(saldoNaoQualificavel)}
                    sub={bonusDesbloqueado ? "Já inclusos no resgatável" : "Libere atingindo o mínimo"}
                    tooltip="São pontos extras ganhos por códigos promocionais ou bônus. Só podem ser usados quando seu saldo qualificável atinge o mínimo exigido."
                    variant={bonusDesbloqueado ? "success" : "muted"}
                />

                {/* Meta de desbloqueio */}
                <MetricCard
                    icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label="Meta de desbloqueio"
                    value={bonusDesbloqueado ? "Liberado" : `Faltam ${formatPontos(faltamDesbloquear)}`}
                    sub={xpMinimo > 0 ? `Mínimo: ${formatPontos(xpMinimo)} XP qualif.` : "Sem mínimo configurado"}
                    tooltip="Mostra quanto ainda falta de XP qualificável para liberar seus bônus e pontos de código. Quando atingir, todos os pontos extras ficam disponíveis."
                    variant={bonusDesbloqueado ? "success" : "warning"}
                />
            </div>

            {/* ── Barra de progresso visual ── */}
            {xpMinimo > 0 && (
                <Card className={bonusDesbloqueado ? "border-green-200 bg-green-50/30" : "border-accent/20 bg-accent/[0.02]"}>
                    <CardContent className="py-4 sm:py-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className={`w-4 h-4 ${bonusDesbloqueado ? "text-green-600" : "text-accent"}`} />
                                <span className="text-xs sm:text-sm font-medium">
                                    {bonusDesbloqueado ? "Bônus desbloqueado!" : "Progresso para liberar bônus"}
                                </span>
                                <InfoTooltip text="Quando a barra atingir 100%, seus pontos de bônus e código ficam liberados para uso." />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold tabular-nums">
                                {formatPontos(saldoQualificavel)} / {formatPontos(xpMinimo)}
                            </span>
                        </div>

                        {/* Barra */}
                        <div className="relative w-full h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${bonusDesbloqueado
                                    ? "bg-gradient-to-r from-green-400 to-green-500"
                                    : "bg-gradient-to-r from-accent/70 to-accent"
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                            {/* Marcador do mínimo */}
                            {!bonusDesbloqueado && progressPercent < 100 && (
                                <div className="absolute inset-y-0 right-0 w-px bg-gray-300" />
                            )}
                        </div>

                        {/* Mensagem contextual */}
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">
                            {bonusDesbloqueado ? (
                                <span className="flex items-center gap-1 text-green-700">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Bônus liberado! Você já pode usar seus {formatPontos(saldoNaoQualificavel)} XP extras.
                                </span>
                            ) : (
                                <>Faltam <strong>{formatPontos(faltamDesbloquear)} XP qualificáveis</strong> para liberar {formatPontos(saldoNaoQualificavel)} XP de bônus.</>
                            )}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Alerta – Pontos a vencer ── */}
            {data.pontosExpirar && data.pontosExpirar.length > 0 && (
                <Card className="border-amber-200/80 bg-amber-50/40">
                    <CardContent className="py-3 sm:py-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className="text-sm font-medium text-amber-800">
                                        {formatPontos(totalExpirar)} XP próximos de vencer
                                    </p>
                                    <InfoTooltip text="Alguns pontos possuem validade. Quando expiram, são retirados do seu saldo automaticamente." />
                                </div>
                                <div className="space-y-1.5">
                                    {data.pontosExpirar.map((item: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-xs bg-white/70 rounded-md px-2.5 py-1.5 border border-amber-100/80"
                                        >
                                            <span className="text-amber-800 font-medium">
                                                {formatPontos(item.xp)} XP
                                            </span>
                                            <span className="text-amber-600/70 text-[10px] sm:text-xs">
                                                vencem em {new Date(item.data_expiracao).toLocaleDateString("pt-BR")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/xp-club/extrato" className="text-[11px] text-amber-700 underline hover:text-amber-900 mt-1.5 inline-block">
                                    Ver detalhes no extrato →
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Aplicar código promocional ── */}
            <Card className="border-accent/15">
                <CardContent className="py-2.5 sm:py-3">
                    <form
                        onSubmit={handleAplicarCodigo}
                        className="flex items-center gap-2 sm:gap-3"
                    >
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <TicketCheck className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <Input
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                placeholder="Código promocional"
                                className="uppercase tracking-wider h-8 text-sm"
                                maxLength={50}
                            />
                        </div>
                        <InfoTooltip text="Digite um código promocional válido para receber pontos extras. Os pontos de código entram como bônus (não qualificáveis)." />
                        <Button type="submit" size="sm" disabled={aplicarCodigo.isPending || !codigo.trim()} className="gap-1.5 h-8">
                            {aplicarCodigo.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Gift className="w-3.5 h-3.5" />
                            )}
                            Aplicar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ── Últimas movimentações ── */}
            <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm sm:text-base text-accent">
                            Últimas Movimentações
                        </CardTitle>
                        <InfoTooltip text="Histórico resumido das suas últimas movimentações de XP. Para ver o extrato completo com filtros, acesse a página de Extrato." />
                    </div>
                    <Link
                        href="/xp-club/extrato"
                        className="text-xs sm:text-sm text-accent underline hover:text-accent/80 transition-colors"
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
                        <p className="text-xs sm:text-sm text-muted-foreground py-6 text-center">
                            Nenhuma movimentação encontrada
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <CircleHelp className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                {text}
            </TooltipContent>
        </Tooltip>
    );
}

function MetricCard({
    icon,
    label,
    value,
    sub,
    tooltip,
    accent,
    variant,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    tooltip?: string;
    accent?: boolean;
    variant?: "success" | "warning" | "muted";
}) {
    const borderClass = variant === "success"
        ? "border-green-200/80 bg-green-50/30"
        : variant === "warning"
            ? "border-amber-200/80 bg-amber-50/30"
            : variant === "muted"
                ? "border-muted/60 bg-muted/5"
                : accent
                    ? "border-accent/30 bg-accent/5"
                    : "";

    const valueClass = variant === "success"
        ? "text-green-700"
        : variant === "warning"
            ? "text-amber-700"
            : accent
                ? "text-accent"
                : "text-foreground";

    return (
        <Card className={borderClass}>
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-4">
                {/* Header com tooltip */}
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="text-muted-foreground">{icon}</div>
                    <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">{label}</span>
                    {tooltip && <InfoTooltip text={tooltip} />}
                </div>

                {/* Valor */}
                <p className={`text-lg sm:text-xl font-bold leading-tight ${valueClass}`}>
                    {value}
                </p>

                {/* Subtexto */}
                {sub && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</p>
                )}
            </CardContent>
        </Card>
    );
}

function MovimentacaoRow({ mov }: { mov: any }) {
    const isPositive = Number(mov.xp) > 0;
    const view = getMovimentacaoPresentation(mov);
    return (
        <div className="flex items-center justify-between py-2 sm:py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-500"
                        }`}
                >
                    {isPositive ? (
                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                        <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                        {view.titulo}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{view.descricao}</p>
                    {view.valor && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{view.valor}</p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                    </p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                <span
                    className={`text-xs sm:text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-500"}`}
                >
                    {isPositive ? "+" : ""}
                    {formatPontos(mov.xp)}
                </span>
                {mov.qualificavel ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 cursor-help">
                                <Star className="w-2.5 h-2.5 mr-0.5" /> Q
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Qualificável — conta para liberar bônus</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-200 text-purple-600 cursor-help">
                                <Gift className="w-2.5 h-2.5 mr-0.5" /> B
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Bônus — liberado ao atingir o mínimo</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}

function formatPontos(n: number | string) {
    return Number(n).toLocaleString("pt-BR");
}
