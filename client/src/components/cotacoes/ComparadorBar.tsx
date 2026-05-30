import { useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    GitCompare,
    Trophy,
    Clock,
    TrendingUp,
    Banknote,
    Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CenarioCompleto, PecaCompleta } from "./types";
import { calcCenarioTotais, fmtCurrencyCompact, fmtDuration } from "@/lib/cotacoes/calc";

interface Props {
    cenarios: CenarioCompleto[];
    pecasById: Map<number, PecaCompleta>;
}

export function ComparadorBar({ cenarios, pecasById }: Props) {
    const [open, setOpen] = useState(false);

    const linhas = useMemo(
        () =>
            cenarios.map((c) => ({
                cenario: c,
                totais: calcCenarioTotais(c, pecasById),
            })),
        [cenarios, pecasById]
    );

    const melhores = useMemo(() => {
        if (linhas.length === 0) {
            return { vendaId: null, lucroId: null, tempoId: null, conexoesId: null };
        }
        const menorVenda = linhas.reduce((a, b) => (a.totais.venda < b.totais.venda ? a : b));
        const maiorLucro = linhas.reduce((a, b) => (a.totais.lucro > b.totais.lucro ? a : b));
        const menorTempo = linhas
            .filter((l) => l.totais.tempoMinutos != null)
            .reduce<typeof linhas[number] | null>(
                (a, b) => (a == null || (b.totais.tempoMinutos ?? Infinity) < (a.totais.tempoMinutos ?? Infinity) ? b : a),
                null
            );
        const menorConexoes = linhas.reduce((a, b) => (a.totais.conexoes < b.totais.conexoes ? a : b));
        return {
            vendaId: menorVenda.cenario.id,
            lucroId: maiorLucro.cenario.id,
            tempoId: menorTempo?.cenario.id ?? null,
            conexoesId: menorConexoes.cenario.id,
        };
    }, [linhas]);

    if (cenarios.length < 2) return null;

    return (
        <div className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-accent/40 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Comparador</span>
                    <Badge variant="secondary" className="text-[10px] py-0 h-5">
                        {cenarios.length} cenários
                    </Badge>
                </div>
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {open && (
                <div className="overflow-x-auto max-h-[40vh]">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/40 sticky top-0">
                            <tr className="text-left">
                                <th className="px-3 py-2 font-medium">Cenário</th>
                                <th className="px-3 py-2 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                        <Banknote className="h-3 w-3" />
                                        Venda
                                    </span>
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Lucro
                                    </span>
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Tempo
                                    </span>
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    <span className="inline-flex items-center gap-1">
                                        <Shuffle className="h-3 w-3" />
                                        Conexões
                                    </span>
                                </th>
                                <th className="px-3 py-2 font-medium">Cias</th>
                                <th className="px-3 py-2 font-medium">Bagagem</th>
                                <th className="px-3 py-2 font-medium">Peças</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linhas.map(({ cenario, totais }) => (
                                <tr key={cenario.id} className="border-t hover:bg-accent/20">
                                    <td className="px-3 py-2 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            {cenario.status === "selecionado_proposta" && (
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                                    title="Selecionado para proposta"
                                                />
                                            )}
                                            <span className="truncate max-w-[200px]">{cenario.nome}</span>
                                        </div>
                                    </td>
                                    <Cell highlight={melhores.vendaId === cenario.id} label="Mais barato">
                                        {fmtCurrencyCompact(totais.venda)}
                                    </Cell>
                                    <Cell highlight={melhores.lucroId === cenario.id} label="Mais lucro">
                                        <span
                                            className={totais.lucro >= 0 ? "text-emerald-700" : "text-rose-700"}
                                        >
                                            {fmtCurrencyCompact(totais.lucro)}
                                        </span>
                                    </Cell>
                                    <Cell highlight={melhores.tempoId === cenario.id} label="Mais rápido">
                                        {totais.tempoMinutos != null ? fmtDuration(totais.tempoMinutos) : "—"}
                                    </Cell>
                                    <Cell highlight={melhores.conexoesId === cenario.id} label="Menos conexões">
                                        {totais.conexoes}
                                    </Cell>
                                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[160px]">
                                        {Array.from(totais.companhiasSet).join(", ") || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[140px]">
                                        {Array.from(totais.bagagemSet).join(" / ") || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground">{totais.pecasOrdenadas.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Cell({
    children,
    highlight,
    label,
}: {
    children: React.ReactNode;
    highlight: boolean;
    label: string;
}) {
    return (
        <td className="px-3 py-2 tabular-nums">
            <span
                className={
                    highlight
                        ? "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-semibold"
                        : ""
                }
                title={highlight ? label : undefined}
            >
                {highlight && <Trophy className="h-3 w-3" />}
                {children}
            </span>
        </td>
    );
}
