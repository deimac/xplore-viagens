/** Resumo legível das quantidades de bagagem de uma peça. */
export function fmtBagagemPeca(peca: {
    temVolta?: boolean | null;
    itemPessoal?: number | null;
    bagagemMao?: number | null;
    bagagemDespachada?: number | null;
    itemPessoalVolta?: number | null;
    bagagemMaoVolta?: number | null;
    bagagemDespachadaVolta?: number | null;
}): string | null {
    const itemPessoal = peca.itemPessoal ?? 1;
    const bagagemMao = peca.bagagemMao ?? 0;
    const bagagemDespachada = peca.bagagemDespachada ?? 0;
    const itemPessoalVolta = peca.itemPessoalVolta ?? 1;
    const bagagemMaoVolta = peca.bagagemMaoVolta ?? 0;
    const bagagemDespachadaVolta = peca.bagagemDespachadaVolta ?? 0;
    const parts: string[] = [];
    if (itemPessoal > 0) parts.push(`${itemPessoal} pessoal`);
    if (bagagemMao > 0) parts.push(`${bagagemMao} mão`);
    if (bagagemDespachada > 0) parts.push(`${bagagemDespachada} desp.`);
    const idaResumo = parts.length ? parts.join(" · ") : null;

    if (!peca.temVolta) return idaResumo;

    const partsVolta: string[] = [];
    if (itemPessoalVolta > 0) partsVolta.push(`${itemPessoalVolta} pessoal`);
    if (bagagemMaoVolta > 0) partsVolta.push(`${bagagemMaoVolta} mão`);
    if (bagagemDespachadaVolta > 0) partsVolta.push(`${bagagemDespachadaVolta} desp.`);
    const voltaResumo = partsVolta.length ? partsVolta.join(" · ") : null;

    if (!idaResumo && !voltaResumo) return null;
    if (!voltaResumo) return `Ida: ${idaResumo}`;
    if (!idaResumo) return `Volta: ${voltaResumo}`;
    return `Ida: ${idaResumo} / Volta: ${voltaResumo}`;
}

export function normalizeBagagemCounts(input: {
    itemPessoal?: number | null;
    bagagemMao?: number | null;
    bagagemDespachada?: number | null;
}) {
    return {
        itemPessoal: Math.max(0, input.itemPessoal ?? 1),
        bagagemMao: Math.max(0, input.bagagemMao ?? 0),
        bagagemDespachada: Math.max(0, input.bagagemDespachada ?? 0),
    };
}

/** Formata texto livre de bagagem de segmento para o mesmo padrão do resumo. */
export function fmtBagagemSegmento(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const text = raw.trim();
    if (!text) return null;

    const lower = text.toLowerCase();
    const pessoal = lower.match(/(\d+)\s*(pessoal|item)/)?.[1];
    const mao = lower.match(/(\d+)\s*(mão|mao|cabin|hand)/)?.[1];
    const desp = lower.match(/(\d+)\s*(desp|despach|checked|por[aã]o)/)?.[1];

    if (pessoal || mao || desp) {
        const parts: string[] = [];
        if (pessoal && Number(pessoal) > 0) parts.push(`${Number(pessoal)} pessoal`);
        if (mao && Number(mao) > 0) parts.push(`${Number(mao)} mão`);
        if (desp && Number(desp) > 0) parts.push(`${Number(desp)} desp.`);
        return parts.length ? parts.join(" · ") : null;
    }

    const tokens = text
        .split(/[\/,;|\-]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.match(/\d+/)?.[0] ?? "")
        .filter(Boolean);

    if (tokens.length >= 2) {
        const [pessoalN, maoN, despN] = tokens;
        const parts: string[] = [];
        if (pessoalN && Number(pessoalN) > 0) parts.push(`${Number(pessoalN)} pessoal`);
        if (maoN && Number(maoN) > 0) parts.push(`${Number(maoN)} mão`);
        if (despN && Number(despN) > 0) parts.push(`${Number(despN)} desp.`);
        return parts.length ? parts.join(" · ") : null;
    }

    if (/^\d+$/.test(text)) {
        return `${Number(text)} pessoal`;
    }

    return text;
}
