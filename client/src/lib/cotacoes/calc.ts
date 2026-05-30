// Cálculos e formatadores compartilhados do Workspace de Cotações.

import type { PecaCompleta, CenarioCompleto } from "@/components/cotacoes/types";

export function toNumber(v: string | number | null | undefined): number | null {
    if (v == null || v === "") return null;
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? n : null;
}

export function fmtCurrency(v: string | number | null | undefined): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtCurrencyCompact(v: string | number | null | undefined): string {
    const n = toNumber(v);
    if (n == null) return "—";
    return n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    });
}

export function calcLucro(custo: string | number | null, venda: string | number | null): number | null {
    const c = toNumber(custo);
    const v = toNumber(venda);
    if (c == null || v == null) return null;
    return v - c;
}

export function fmtDuration(minutes: number | null | undefined): string {
    if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, "0")}`;
}

export function diffMinutes(a: Date | string | null | undefined, b: Date | string | null | undefined): number | null {
    if (!a || !b) return null;
    const da = typeof a === "string" ? new Date(a) : a;
    const db = typeof b === "string" ? new Date(b) : b;
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
    return Math.round((db.getTime() - da.getTime()) / 60000);
}

export function pecaDurationMinutes(p: PecaCompleta): number | null {
    if (p.duracaoMinutos != null) return p.duracaoMinutos;
    return diffMinutes(p.dataSaida, p.dataChegada);
}

export function fmtTime(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateShort(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDateTime(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return `${fmtDateShort(d)} ${fmtTime(d)}`;
}

export interface CenarioTotais {
    custo: number;
    venda: number;
    lucro: number;
    tempoMinutos: number | null;
    conexoes: number;
    bagagemSet: Set<string>;
    companhiasSet: Set<string>;
    intervalos: Array<{ pecaAnteriorId: number; pecaPosteriorId: number; minutos: number }>;
    pecasOrdenadas: PecaCompleta[];
}

export function calcCenarioTotais(cenario: CenarioCompleto, pecasById: Map<number, PecaCompleta>): CenarioTotais {
    const ordenadas: PecaCompleta[] = [];
    for (const link of [...cenario.pecas].sort((a, b) => a.ordem - b.ordem)) {
        const p = pecasById.get(link.pecaId);
        if (p) ordenadas.push(p);
    }

    let custo = 0;
    let venda = 0;
    let conexoes = 0;
    let tempoMinutos = 0;
    let temTempo = false;
    const bagagemSet = new Set<string>();
    const companhiasSet = new Set<string>();
    const intervalos: CenarioTotais["intervalos"] = [];

    for (let i = 0; i < ordenadas.length; i++) {
        const p = ordenadas[i];
        const c = toNumber(p.custo);
        const v = toNumber(p.venda);
        if (c != null) custo += c;
        if (v != null) venda += v;
        conexoes += p.qtdConexoes ?? 0;
        const dur = pecaDurationMinutes(p);
        if (dur != null) {
            tempoMinutos += dur;
            temTempo = true;
        }
        if (p.bagagem) bagagemSet.add(p.bagagem);
        if (p.companhias) {
            p.companhias.split(/[,/+]/).forEach((c) => {
                const t = c.trim();
                if (t) companhiasSet.add(t);
            });
        }

        if (i > 0) {
            const anterior = ordenadas[i - 1];
            const intervalo = diffMinutes(anterior.dataChegada, p.dataSaida);
            if (intervalo != null && intervalo > 0) {
                intervalos.push({ pecaAnteriorId: anterior.id, pecaPosteriorId: p.id, minutos: intervalo });
                tempoMinutos += intervalo;
            }
        }
    }

    return {
        custo,
        venda,
        lucro: venda - custo,
        tempoMinutos: temTempo ? tempoMinutos : null,
        conexoes: conexoes + Math.max(0, ordenadas.length - 1),
        bagagemSet,
        companhiasSet,
        intervalos,
        pecasOrdenadas: ordenadas,
    };
}

export function matchesText(p: PecaCompleta, term: string): boolean {
    if (!term) return true;
    const t = term.toLowerCase().trim();
    return [
        p.titulo,
        p.origem,
        p.destino,
        p.companhias,
        p.fonte,
        p.classe,
        p.bagagem,
        ...p.segmentos.flatMap((s) => [s.aeroportoOrigem, s.aeroportoDestino, s.companhia, s.numeroVoo]),
    ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
}
