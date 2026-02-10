import { useState } from "react";
import type { OfertaVooDataFixa } from "@/types/ofertasVoo";
import { textStyles } from "@/types/textStyles";

interface Props {
    oferta: OfertaVooDataFixa;
    selectedFixedIndex?: number | null;
    onSelectFixedIndex?: (idx: number | null) => void;
}

export function DataFixaDisplay({ oferta, selectedFixedIndex: selectedRowProp, onSelectFixedIndex }: Props) {
    const [localSelectedRow, setLocalSelectedRow] = useState<number | null>(null);
    const selectedRow = selectedRowProp !== undefined ? selectedRowProp : localSelectedRow;
    const setSelectedRow = (idx: number | null) => {
        setLocalSelectedRow(idx);
        if (onSelectFixedIndex) {
            onSelectFixedIndex(idx);
        }
    };
    const { trechos, linhasDatas } = oferta;

    return (
        <div>
            {/* Linha de cidades com setas */}
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                {trechos.map((trecho, idx) => (
                    <span key={`city-${idx}`} className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-900">{trecho.origem}</span>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {idx === trechos.length - 1 && (
                            <span className="text-xs font-semibold text-slate-900">{trecho.destino}</span>
                        )}
                    </span>
                ))}
            </div>
            {/* Grid de datas igual para desktop e mobile */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
                <div className="min-w-max">
                    <div className="space-y-2">
                        {linhasDatas.map((linha, linhaIdx) => (
                            <button
                                key={`linha-${linhaIdx}`}
                                onClick={() => setSelectedRow(selectedRow === linhaIdx ? null : linhaIdx)}
                                className={
                                    `group w-full grid grid-flow-col auto-cols-[minmax(110px,1fr)] gap-0 transition-colors ` +
                                    (selectedRow === linhaIdx
                                        ? "border-amber-500 bg-amber-50 text-amber-900 font-semibold border-2 rounded-lg"
                                        : "border-slate-200 bg-slate-50 group-hover:border-amber-300 group-hover:bg-amber-50/50 text-slate-700 border-2 rounded-lg"
                                    )
                                }
                                style={{ minHeight: 40 }}
                            >
                                {linha.map((data, dataIdx) => (
                                    <div
                                        key={`data-${linhaIdx}-${dataIdx}`}
                                        className={
                                            `text-center py-1.5 px-2 transition-all ` +
                                            (selectedRow === linhaIdx
                                                ? "text-amber-900 font-semibold"
                                                : "text-slate-700"
                                            )
                                        }
                                    >
                                        <span className="text-xs font-semibold">{data}</span>
                                    </div>
                                ))}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
