/**
 * Como funciona – Página educativa do programa XP Club
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/SectionTitle";
import {
    Wallet,
    Star,
    Gift,
    Lock,
    Unlock,
    Target,
    AlertTriangle,
    Receipt,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    ShoppingBag,
    TicketCheck,
    TrendingUp,
    HelpCircle,
    ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ComoFunciona() {
    return (
        <div className="space-y-8 sm:space-y-10">
            {/* ── Header ── */}
            <SectionTitle
                title="Entenda como seu"
                highlight="XP funciona"
                subtitle="Veja o que você já pode usar, o que está bloqueado e como liberar seus bônus"
                align="center"
                className="mb-2 sm:mb-4"
                titleClassName="text-2xl sm:text-3xl"
                subtitleClassName="text-sm sm:text-base"
            />

            {/* ── Seção 1 – Seu saldo em 3 partes ── */}
            <section>
                <SectionHeader
                    icon={<Wallet className="w-5 h-5" />}
                    title="Seu saldo em 3 partes"
                    description="Cada tipo de ponto funciona de um jeito diferente"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                    <ExplainCard
                        icon={<Wallet className="w-6 h-6 text-accent" />}
                        title="Resgatável agora"
                        description="É o XP que você já pode usar neste momento. Inclui seus pontos qualificáveis e, se liberados, também os pontos de bônus."
                        color="accent"
                    />
                    <ExplainCard
                        icon={<Star className="w-6 h-6 text-blue-600" />}
                        title="Qualificável"
                        description="São os pontos ganhos por compras. Esse saldo é a base para desbloquear seus pontos extras de bônus e código."
                        color="blue"
                    />
                    <ExplainCard
                        icon={<Gift className="w-6 h-6 text-purple-600" />}
                        title="Bônus e códigos"
                        description="São pontos extras ganhos por promoções e códigos. Só ficam liberados quando seu saldo qualificável atinge o mínimo exigido."
                        color="purple"
                    />
                </div>
            </section>

            {/* ── Seção 2 – Como liberar bônus ── */}
            <section>
                <SectionHeader
                    icon={<Target className="w-5 h-5" />}
                    title="Como liberar bônus"
                    description="Entenda a regra de desbloqueio em 3 passos"
                />
                <div className="mt-4 space-y-3">
                    <StepCard
                        step={1}
                        icon={<ShoppingBag className="w-5 h-5 text-accent" />}
                        title="Acumule XP qualificável"
                        description="Cada compra ou movimentação oficial gera XP qualificável no seu saldo."
                    />
                    <StepCard
                        step={2}
                        icon={<TrendingUp className="w-5 h-5 text-accent" />}
                        title="Atinja o mínimo exigido"
                        description="Quando seu saldo qualificável atingir o mínimo configurado, seus pontos de bônus e código ficam automaticamente liberados."
                    />
                    <StepCard
                        step={3}
                        icon={<Unlock className="w-5 h-5 text-green-600" />}
                        title="Use tudo junto"
                        description="Com o bônus desbloqueado, seu saldo resgatável soma qualificável + bônus. Se o saldo qualificável cair abaixo do mínimo, os bônus voltam a ficar bloqueados."
                    />
                </div>
            </section>

            {/* ── Seção 3 – Exemplo prático ── */}
            <section>
                <SectionHeader
                    icon={<Sparkles className="w-5 h-5" />}
                    title="Exemplo prático"
                    description="Veja como funciona na prática"
                />
                <Card className="mt-4 border-accent/15 bg-accent/[0.02]">
                    <CardContent className="py-5 sm:py-6">
                        <div className="space-y-4">
                            {/* Cenário */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
                                <ExampleBadge icon={<Star className="w-4 h-4" />} label="Qualificável" value="800 XP" color="blue" />
                                <ExampleBadge icon={<Gift className="w-4 h-4" />} label="Bônus" value="300 XP" color="purple" />
                                <ExampleBadge icon={<Target className="w-4 h-4" />} label="Mínimo" value="1.000 XP" color="amber" />
                            </div>

                            <div className="border-t border-dashed border-muted pt-4 space-y-3">
                                {/* Antes */}
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Lock className="w-3 h-3 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Antes de atingir o mínimo</p>
                                        <p className="text-xs text-muted-foreground">
                                            Faltam <strong>200 XP qualificáveis</strong> para liberar os 300 XP de bônus.
                                            Resgatável agora: <strong>800 XP</strong>.
                                        </p>
                                    </div>
                                </div>

                                {/* Depois */}
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-700">Depois de atingir o mínimo</p>
                                        <p className="text-xs text-muted-foreground">
                                            Bônus desbloqueado! Agora você pode usar <strong>1.300 XP</strong> (1.000 qualificáveis + 300 de bônus).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Seção 4 – Pontos com validade ── */}
            <section>
                <SectionHeader
                    icon={<AlertTriangle className="w-5 h-5" />}
                    title="Pontos com validade"
                    description="Alguns pontos podem expirar"
                />
                <Card className="mt-4 border-amber-200/60 bg-amber-50/20">
                    <CardContent className="py-4 sm:py-5">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-800">Fique atento!</p>
                                <p className="text-xs sm:text-sm text-amber-700/80 mt-1 leading-relaxed">
                                    Alguns tipos de pontos possuem validade. Quando estiverem próximos de vencer,
                                    você verá um alerta no seu Dashboard. Pontos expirados são removidos
                                    automaticamente do saldo.
                                </p>
                                <p className="text-xs text-amber-600/70 mt-2">
                                    Acompanhe no Extrato a data de vencimento de cada movimentação.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Seção 5 – FAQ ── */}
            <section>
                <SectionHeader
                    icon={<HelpCircle className="w-5 h-5" />}
                    title="Perguntas frequentes"
                    description="Tire suas principais dúvidas sobre o programa"
                />
                <div className="mt-4 space-y-2">
                    <FaqItem
                        question="O que é XP qualificável?"
                        answer="São os pontos acumulados por compras oficiais e movimentações registradas pela agência. Esse saldo é o que conta para atingir o mínimo e liberar pontos de bônus."
                    />
                    <FaqItem
                        question="Bônus e código contam para liberar resgate?"
                        answer="Não. Apenas o saldo qualificável conta para atingir o mínimo de desbloqueio. Pontos de bônus e código são liberados como consequência de atingir o mínimo."
                    />
                    <FaqItem
                        question="O que acontece se eu usar pontos e cair abaixo do mínimo?"
                        answer="Se seu saldo qualificável cair abaixo do mínimo após um resgate, os pontos de bônus voltam a ficar bloqueados até que o mínimo seja atingido novamente."
                    />
                    <FaqItem
                        question="Como sei se meus pontos vão vencer?"
                        answer="No seu Dashboard, um alerta aparece quando há pontos próximos de vencer. No Extrato, cada movimentação mostra a data de validade quando aplicável."
                    />
                    <FaqItem
                        question="Posso usar meus pontos qualificáveis mesmo sem atingir o mínimo?"
                        answer="Sim! Os pontos qualificáveis estão sempre disponíveis para uso. O mínimo só afeta a liberação dos pontos extras de bônus e código."
                    />
                    <FaqItem
                        question="Posso aplicar mais de um código promocional ao mesmo tempo?"
                        answer="Não. Você só pode ter um código promocional ativo por vez. Enquanto ainda houver saldo não resgatado de um código aplicado anteriormente, não será possível adicionar um novo código. Para liberar a aplicação de outro código, resgate os pontos do código ativo ou aguarde sua expiração. Códigos já totalmente resgatados ou expirados não bloqueiam a aplicação de novos códigos."
                    />
                </div>
            </section>

            {/* ── Navegação inferior ── */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 pb-4">
                <Link href="/xp-club/dashboard">
                    <Button className="gap-2 w-full sm:w-auto">
                        <LayoutDashboard className="w-4 h-4" />
                        Ir para o Dashboard
                    </Button>
                </Link>
                <Link href="/xp-club/extrato">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto border-accent/30 text-accent hover:bg-accent/5">
                        <Receipt className="w-4 h-4" />
                        Ver meu extrato
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                {icon}
            </div>
            <div>
                <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function ExplainCard({ icon, title, description, color }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: "accent" | "blue" | "purple";
}) {
    const bgMap = { accent: "bg-accent/5 border-accent/20", blue: "bg-blue-50/50 border-blue-200/50", purple: "bg-purple-50/50 border-purple-200/50" };
    return (
        <Card className={`${bgMap[color]} transition-shadow hover:shadow-sm`}>
            <CardContent className="pt-4 pb-4 sm:pt-5 sm:pb-5 flex flex-col items-center text-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-white/80 border border-muted/30 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
}

function StepCard({ step, icon, title, description }: {
    step: number;
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
            <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    {icon}
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {step}
                </span>
            </div>
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function ExampleBadge({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: "blue" | "purple" | "amber";
}) {
    const bgMap = { blue: "bg-blue-50 border-blue-200/60 text-blue-700", purple: "bg-purple-50 border-purple-200/60 text-purple-700", amber: "bg-amber-50 border-amber-200/60 text-amber-700" };
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${bgMap[color]}`}>
            {icon}
            <span className="text-xs text-muted-foreground">{label}:</span>
            <span className="font-semibold tabular-nums">{value}</span>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/5 transition-colors"
            >
                <span className="text-sm font-medium pr-4">{question}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="px-4 pb-3 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    );
}
