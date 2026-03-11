type MovimentacaoInput = {
    xp: number | string;
    tipo_nome?: string | null;
    tipo_slug?: string | null;
    descricao?: string | null;
};

function normalizeIdentifier(value?: string | null): string {
    if (!value) return "";
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function parseCodigoFromDescricao(descricao?: string | null): string | null {
    if (!descricao) return null;
    const match = descricao.match(/codigo\s+promocional\s*:\s*(.+)$/i);
    return match?.[1]?.trim() || null;
}

function isInternalDescricao(descricao?: string | null): boolean {
    if (!descricao) return false;
    const d = descricao.trim().toLowerCase();
    return (
        d.startsWith("baixa automatica por vencimento") ||
        d.startsWith("expiracao automatica") ||
        d.startsWith("codigo promocional:")
    );
}

export function getMovimentacaoPresentation(mov: MovimentacaoInput) {
    const slug = normalizeIdentifier(mov.tipo_slug || mov.tipo_nome);
    const xpAbs = Math.abs(Number(mov.xp || 0)).toLocaleString("pt-BR");
    const rawDescricao = mov.descricao?.trim() || "";

    if (slug === "vencimento" || slug === "expiracao") {
        return {
            titulo: "Vencimento",
            descricao: "Debito automatico de pontos vencidos",
            valor: `${xpAbs} XP`,
        };
    }

    if (slug === "codigo_promocional") {
        const codigo = parseCodigoFromDescricao(rawDescricao);
        return {
            titulo: "Codigo Promocional",
            descricao: "Bonus aplicado por codigo",
            valor: codigo ? `Codigo: ${codigo}` : null,
        };
    }

    const titulo = mov.tipo_nome?.trim() || "Movimentacao";
    const descricao = Number(mov.xp) >= 0 ? "Credito de pontos" : "Debito de pontos";
    const valor = rawDescricao && !isInternalDescricao(rawDescricao) ? rawDescricao : null;

    return { titulo, descricao, valor };
}
