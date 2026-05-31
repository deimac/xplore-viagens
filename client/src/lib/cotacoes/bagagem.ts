/** Resumo legível das quantidades de bagagem de uma peça. */
export function fmtBagagemPeca(peca: {
    itemPessoal?: number | null;
    bagagemMao?: number | null;
    bagagemDespachada?: number | null;
}): string | null {
    const itemPessoal = peca.itemPessoal ?? 1;
    const bagagemMao = peca.bagagemMao ?? 0;
    const bagagemDespachada = peca.bagagemDespachada ?? 0;
    const parts: string[] = [];
    if (itemPessoal > 0) parts.push(`${itemPessoal} pessoal`);
    if (bagagemMao > 0) parts.push(`${bagagemMao} mão`);
    if (bagagemDespachada > 0) parts.push(`${bagagemDespachada} desp.`);
    return parts.length ? parts.join(" · ") : null;
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
