// Cálculos e formatadores compartilhados do Workspace de Cotações.

import type { PecaCompleta, CenarioCompleto } from "@/components/cotacoes/types";
import { fmtBagagemPeca } from "@/lib/cotacoes/bagagem";
import { splitStoredDatetime } from "@/lib/cotacoes/datetimeForm";

export type DirecaoPeca = "ida" | "volta";

export function hasVolta(p: PecaCompleta): boolean {
    return Boolean(
        p.temVolta ||
        p.origemVolta ||
        p.destinoVolta ||
        p.dataSaidaVolta ||
        p.dataChegadaVolta ||
        p.segmentos.some((s) => s.direcao === "volta")
    );
}

export function getResumoDirecao(p: PecaCompleta, direcao: DirecaoPeca) {
    if (direcao === "volta") {
        return {
            origem: p.origemVolta,
            destino: p.destinoVolta,
            dataSaida: p.dataSaidaVolta,
            dataChegada: p.dataChegadaVolta,
            qtdConexoes: p.qtdConexoesVolta,
            companhias: p.companhiasVolta,
            classe: p.classeVolta,
            duracaoMinutos: p.duracaoMinutosVolta,
        };
    }

    return {
        origem: p.origem,
        destino: p.destino,
        dataSaida: p.dataSaida,
        dataChegada: p.dataChegada,
        qtdConexoes: p.qtdConexoes,
        companhias: p.companhias,
        classe: p.classe,
        duracaoMinutos: p.duracaoMinutos,
    };
}

export function getSegmentosDirecao(p: PecaCompleta, direcao: DirecaoPeca) {
    if (direcao === "volta") {
        return p.segmentos.filter((s) => s.direcao === "volta");
    }
    return p.segmentos.filter((s) => (s.direcao ?? "ida") === "ida");
}

export function getPecaTimelineBounds(p: PecaCompleta) {
    const ida = getResumoDirecao(p, "ida");
    const volta = getResumoDirecao(p, "volta");
    return {
        inicio: ida.dataSaida,
        fim: hasVolta(p) ? (volta.dataChegada || ida.dataChegada) : ida.dataChegada,
    };
}

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
    const da = parseDateForMath(a);
    const db = parseDateForMath(b);
    if (!da || !db) return null;
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
    return Math.round((db.getTime() - da.getTime()) / 60000);
}

export function pecaDurationMinutes(p: PecaCompleta): number | null {
    const ida = getResumoDirecao(p, "ida");
    const volta = getResumoDirecao(p, "volta");
    const idaDur = ida.duracaoMinutos ?? diffMinutes(ida.dataSaida, ida.dataChegada);
    if (!hasVolta(p)) return idaDur;
    const voltaDur = volta.duracaoMinutos ?? diffMinutes(volta.dataSaida, volta.dataChegada);
    if (idaDur == null && voltaDur == null) return null;
    return (idaDur ?? 0) + (voltaDur ?? 0);
}

export function fmtTime(value: Date | string | null | undefined): string {
    if (!value) return "—";

    const { time } = splitStoredDatetime(value);
    if (time) return time;

    const d = parseDateForMath(value);
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateShort(value: Date | string | null | undefined): string {
    if (!value) return "—";

    const { date } = splitStoredDatetime(value);
    if (!date) return "—";

    const [yyyy, mm, dd] = date.split("-").map(Number);
    if (!yyyy || !mm || !dd) return "—";

    const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDateTime(value: Date | string | null | undefined): string {
    if (!value) return "—";

    const date = fmtDateShort(value);
    const time = fmtTime(value);
    if (date === "—") return "—";
    if (time === "—") return date;
    return `${date} ${time}`;
}

function parseDateForMath(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;

    const { date, time } = splitStoredDatetime(value);
    if (date) {
        const [yyyy, mm, dd] = date.split("-").map(Number);
        if (yyyy && mm && dd) {
            const [hh, mi] = (time || "00:00").split(":").map(Number);
            const result = new Date(yyyy, mm - 1, dd, hh || 0, mi || 0, 0, 0);
            if (!isNaN(result.getTime())) return result;
        }
    }

    const fallback = new Date(value);
    if (isNaN(fallback.getTime())) return null;
    return fallback;
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
        const bagagemResumo = fmtBagagemPeca(p);
        if (bagagemResumo) bagagemSet.add(bagagemResumo);
        if (p.companhias) {
            p.companhias.split(/[,/+]/).forEach((c) => {
                const t = c.trim();
                if (t) companhiasSet.add(t);
            });
        }
        if (p.companhiasVolta) {
            p.companhiasVolta.split(/[,/+]/).forEach((c) => {
                const t = c.trim();
                if (t) companhiasSet.add(t);
            });
        }

        if (i > 0) {
            const anterior = ordenadas[i - 1];
            const prevBounds = getPecaTimelineBounds(anterior);
            const curBounds = getPecaTimelineBounds(p);
            const intervalo = diffMinutes(prevBounds.fim, curBounds.inicio);
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
        p.origemVolta,
        p.destinoVolta,
        p.companhias,
        p.companhiasVolta,
        p.fonte,
        p.classe,
        p.classeVolta,
        fmtBagagemPeca(p),
        ...p.segmentos.flatMap((s) => [s.aeroportoOrigem, s.aeroportoDestino, s.companhia, s.numeroVoo]),
    ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
}
