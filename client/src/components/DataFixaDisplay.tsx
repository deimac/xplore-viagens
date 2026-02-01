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
            {/* Desktop/Tablet: tabela horizontal */}
            <div className="hidden md:block overflow-x-auto -mx-4 px-4 pb-2">
                <div className="min-w-max">
                    <div className="grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-0 mb-3">
                        {trechos.map((trecho, idx) => (
                            <div key={`${trecho.origem}-${trecho.destino}-${idx}`} className="text-center">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-900">
                                    <span className="truncate">{trecho.origem}</span>
                                    <svg
                                        className="w-4 h-4 text-slate-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span className="truncate">{trecho.destino}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {linhasDatas.map((linha, linhaIdx) => (
                            <button
                                key={`linha-${linhaIdx}`}
                                onClick={() => setSelectedRow(selectedRow === linhaIdx ? null : linhaIdx)}
                                className="group w-full grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-0 transition-colors"
                            >
                                {linha.map((data, dataIdx) => (
                                    <div
                                        key={`data-${linhaIdx}-${dataIdx}`}
                                        className={`text-center py-1.5 px-2 border-y-2 transition-all ${selectedRow === linhaIdx
                                            ? "border-amber-500 bg-amber-50 text-amber-900 font-semibold"
                                            : "border-slate-200 bg-slate-50 group-hover:border-amber-300 group-hover:bg-amber-50/50 text-slate-700"
                                            } ${dataIdx === 0 ? "rounded-l-lg border-l-2" : ""
                                            } ${dataIdx === linha.length - 1 ? "rounded-r-lg border-r-2" : ""
                                            }`}
                                    >
                                        <span className="text-xs font-semibold">{data}</span>
                                    </div>
                                ))}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile: cards por opção */}
            <div className="md:hidden space-y-3">
                {linhasDatas.map((linha, linhaIdx) => (
                    <button
                        key={`card-${linhaIdx}`}
                        onClick={() => setSelectedRow(selectedRow === linhaIdx ? null : linhaIdx)}
                        className={`w-full border-2 rounded-lg p-3 transition-all ${selectedRow === linhaIdx
                            ? "border-amber-500 bg-amber-50"
                            : "border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/50"
                            }`}
                    >
                        <div className={`text-xs font-semibold mb-2 ${selectedRow === linhaIdx ? "text-amber-900" : "text-slate-700"}`}>
                            Opção {linhaIdx + 1}
                        </div>
                        <div className="space-y-2">
                            {trechos.map((trecho, trechoIdx) => (
                                <div key={`trecho-${linhaIdx}-${trechoIdx}`} className="flex items-center justify-between gap-2">
                                    <div className={`text-xs font-medium ${selectedRow === linhaIdx ? "text-amber-900" : "text-slate-700"}`}>
                                        {trecho.origem} → {trecho.destino}
                                    </div>
                                    <div className={`text-xs font-semibold ${selectedRow === linhaIdx ? "text-amber-900" : "text-slate-900"}`}>
                                        {linha[trechoIdx]}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
