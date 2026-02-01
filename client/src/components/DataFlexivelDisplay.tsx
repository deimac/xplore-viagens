import type { OfertaVooDataFlexivel, OfertaVooFlexDate } from "@/types/ofertasVoo";

interface Props {
    oferta: OfertaVooDataFlexivel;
    selectedIda?: OfertaVooFlexDate | null;
    selectedVolta?: OfertaVooFlexDate | null;
    onSelectIda?: (data: OfertaVooFlexDate | null) => void;
    onSelectVolta?: (data: OfertaVooFlexDate | null) => void;
}

const MONTH_ORDER: Record<string, number> = {
    jan: 1,
    fev: 2,
    mar: 3,
    abr: 4,
    mai: 5,
    jun: 6,
    jul: 7,
    ago: 8,
    set: 9,
    out: 10,
    nov: 11,
    dez: 12,
};

const normalizeMonth = (mes: string) =>
    mes
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(".", "")
        .trim();

const getMonthKey = (mes: string) => {
    const normalized = normalizeMonth(mes);
    if (MONTH_ORDER[normalized]) return normalized;
    const short = normalized.slice(0, 3);
    return MONTH_ORDER[short] ? short : normalized;
};

const toKey = (data?: OfertaVooFlexDate | null) => {
    if (!data) return null;
    const monthKey = getMonthKey(data.mes);
    const monthValue = MONTH_ORDER[monthKey] ?? 0;
    const dayValue = Number.parseInt(data.dia, 10);
    if (!monthValue || Number.isNaN(dayValue)) return null;
    return monthValue * 100 + dayValue;
};

const isSameDate = (a?: OfertaVooFlexDate | null, b?: OfertaVooFlexDate | null) =>
    !!a && !!b && getMonthKey(a.mes) === getMonthKey(b.mes) && a.dia === b.dia;

const cx = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ");

export function DataFlexivelDisplay({
    oferta,
    selectedIda,
    selectedVolta,
    onSelectIda,
    onSelectVolta,
}: Props) {
    const { ida, volta } = oferta;
    const idaKey = toKey(selectedIda);
    const voltaKey = toKey(selectedVolta);

    const handleSelectIda = (mes: string, dia: string) => {
        const dataSelecionada = { mes, dia };
        const isSelected = isSameDate(selectedIda, dataSelecionada);
        const novaIda = isSelected ? null : dataSelecionada;
        onSelectIda?.(novaIda);

        if (selectedVolta) {
            const novaIdaKey = toKey(novaIda);
            const voltaAtualKey = toKey(selectedVolta);
            if (novaIdaKey && voltaAtualKey && voltaAtualKey <= novaIdaKey) {
                onSelectVolta?.(null);
            }
        }
    };

    const handleSelectVolta = (mes: string, dia: string) => {
        const dataSelecionada = { mes, dia };
        const isSelected = isSameDate(selectedVolta, dataSelecionada);
        const novaVolta = isSelected ? null : dataSelecionada;
        onSelectVolta?.(novaVolta);

        if (selectedIda) {
            const novaVoltaKey = toKey(novaVolta);
            const idaAtualKey = toKey(selectedIda);
            if (novaVoltaKey && idaAtualKey && idaAtualKey >= novaVoltaKey) {
                onSelectIda?.(null);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase w-14 flex items-center justify-center">
                        Ida
                    </div>
                    <span className="text-xs font-medium text-slate-700">{ida.rota}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {ida.datasPorMes.map((grupo, idx) => (
                        <div
                            key={`ida-${idx}`}
                            className="inline-flex items-center gap-1.5 bg-slate-50 rounded-md px-1.5 py-1 border-2 border-slate-200"
                        >
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{grupo.mes}:</span>
                            <div className="flex gap-0.5">
                                {grupo.dias.map((dia, diaIdx) => {
                                    const dataAtual = { mes: grupo.mes, dia };
                                    const isSelected = isSameDate(selectedIda, dataAtual);
                                    const dataKey = toKey(dataAtual);
                                    const isDisabled = !!voltaKey && !!dataKey && dataKey >= voltaKey;
                                    return (
                                        <button
                                            key={`ida-${idx}-${diaIdx}`}
                                            type="button"
                                            onClick={() => handleSelectIda(grupo.mes, dia)}
                                            disabled={isDisabled}
                                            className={cx(
                                                "inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold border-2 transition-colors",
                                                isSelected
                                                    ? "bg-emerald-500 text-white border-emerald-500"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50",
                                                isDisabled && "opacity-40 cursor-not-allowed hover:border-slate-200 hover:bg-white"
                                            )}
                                        >
                                            {dia}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase w-14 flex items-center justify-center">
                        Volta
                    </div>
                    <span className="text-xs font-medium text-slate-700">{volta.rota}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {volta.datasPorMes.map((grupo, idx) => (
                        <div
                            key={`volta-${idx}`}
                            className="inline-flex items-center gap-1.5 bg-slate-50 rounded-md px-1.5 py-1 border-2 border-slate-200"
                        >
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{grupo.mes}:</span>
                            <div className="flex gap-0.5">
                                {grupo.dias.map((dia, diaIdx) => {
                                    const dataAtual = { mes: grupo.mes, dia };
                                    const isSelected = isSameDate(selectedVolta, dataAtual);
                                    const dataKey = toKey(dataAtual);
                                    const isDisabled = !!idaKey && !!dataKey && dataKey <= idaKey;
                                    return (
                                        <button
                                            key={`volta-${idx}-${diaIdx}`}
                                            type="button"
                                            onClick={() => handleSelectVolta(grupo.mes, dia)}
                                            disabled={isDisabled}
                                            className={cx(
                                                "inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold border-2 transition-colors",
                                                isSelected
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                                                isDisabled && "opacity-40 cursor-not-allowed hover:border-slate-200 hover:bg-white"
                                            )}
                                        >
                                            {dia}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
