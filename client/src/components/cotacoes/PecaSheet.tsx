import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, X, Plane, Banknote, ListChecks, Info } from "lucide-react";
import type { PecaCompleta } from "./types";
import { calcLucro, fmtCurrencyCompact } from "@/lib/cotacoes/calc";
import { InputMask, maskHour } from "@/components/ui/InputMask";

export type Segmento = {
    ordem: number;
    aeroportoOrigem: string;
    aeroportoDestino: string;
    cidadeOrigem: string;
    cidadeDestino: string;
    saida: string;
    chegada: string;
    companhia: string;
    numeroVoo: string;
    classe: string;
    bagagem: string;
    duracaoConexaoMinutos: number | "";
};

export type PecaForm = {
    titulo: string;
    origem: string;
    destino: string;
    dataSaida: string;
    dataChegada: string;
    qtdConexoes: number;
    companhias: string;
    bagagem: string;
    classe: string;
    tipoFinanceiro: "milhas" | "pagante" | "misto";
    custo: number | "";
    venda: number | "";
    fonte: string;
    estrategia: string;
    status: "pesquisa" | "favorita";
    observacoes: string;
    segmentos: Segmento[];
};

export const emptySegmento = (ordem = 0): Segmento => ({
    ordem,
    aeroportoOrigem: "",
    aeroportoDestino: "",
    cidadeOrigem: "",
    cidadeDestino: "",
    saida: "",
    chegada: "",
    companhia: "",
    numeroVoo: "",
    classe: "",
    bagagem: "",
    duracaoConexaoMinutos: "",
});

export const emptyPeca = (): PecaForm => ({
    titulo: "",
    origem: "",
    destino: "",
    dataSaida: "",
    dataChegada: "",
    qtdConexoes: 0,
    companhias: "",
    bagagem: "",
    classe: "",
    tipoFinanceiro: "pagante",
    custo: "",
    venda: "",
    fonte: "",
    estrategia: "",
    status: "pesquisa",
    observacoes: "",
    segmentos: [],
});

export function toDatetimeLocal(value: string | Date | null | undefined): string {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function pecaToForm(p: PecaCompleta): PecaForm {
    return {
        titulo: p.titulo ?? "",
        origem: p.origem ?? "",
        destino: p.destino ?? "",
        dataSaida: toDatetimeLocal(p.dataSaida),
        dataChegada: toDatetimeLocal(p.dataChegada),
        qtdConexoes: p.qtdConexoes ?? 0,
        companhias: p.companhias ?? "",
        bagagem: p.bagagem ?? "",
        classe: p.classe ?? "",
        tipoFinanceiro: p.tipoFinanceiro,
        custo: p.custo != null ? Number(p.custo) : "",
        venda: p.venda != null ? Number(p.venda) : "",
        fonte: p.fonte ?? "",
        estrategia: p.estrategia ?? "",
        status: p.status,
        observacoes: p.observacoes ?? "",
        segmentos: p.segmentos.map((s, i) => ({
            ordem: s.ordem ?? i,
            aeroportoOrigem: s.aeroportoOrigem ?? "",
            aeroportoDestino: s.aeroportoDestino ?? "",
            cidadeOrigem: s.cidadeOrigem ?? "",
            cidadeDestino: s.cidadeDestino ?? "",
            saida: toDatetimeLocal(s.saida),
            chegada: toDatetimeLocal(s.chegada),
            companhia: s.companhia ?? "",
            numeroVoo: s.numeroVoo ?? "",
            classe: s.classe ?? "",
            bagagem: s.bagagem ?? "",
            duracaoConexaoMinutos: s.duracaoConexaoMinutos ?? "",
        })),
    };
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingId: number | null;
    initialForm: PecaForm;
    onSubmit: (form: PecaForm) => void;
    isSubmitting: boolean;
}

export function PecaSheet({ open, onOpenChange, editingId, initialForm, onSubmit, isSubmitting }: Props) {
    const [form, setForm] = useState<PecaForm>(initialForm);
    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
        if (open) setForm(initialForm);
    }, [open, initialForm]);

    const patch = (p: Partial<PecaForm>) => {
        setForm((f) => {
            const next = { ...f, ...p };
            // Validação: dataSaida não pode ser anterior a hoje
            if (next.dataSaida) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const d = new Date(next.dataSaida);
                if (d < now) {
                    setDateError("A data de ida não pode ser anterior a hoje.");
                } else {
                    setDateError(null);
                }
            } else {
                setDateError(null);
            }
            return next;
        });
    };
    // Helpers para data/hora
    function splitDateTime(dt: string) {
        if (!dt) return { date: "", time: "" };
        const [d, t] = dt.split("T");
        return { date: d ?? "", time: (t ?? "").slice(0, 5) };
    }
    function joinDateTime(date: string, time: string) {
        if (!date && !time) return "";
        // Se já existe hora válida, mantém, senão usa 00:00
        let t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
        return `${date}${date ? "T" + t : ""}`;
    }
    const patchSeg = (idx: number, p: Partial<Segmento>) =>
        setForm((f) => {
            const segs = [...f.segmentos];
            segs[idx] = { ...segs[idx], ...p };
            return { ...f, segmentos: segs };
        });
    const removeSeg = (idx: number) =>
        setForm((f) => ({ ...f, segmentos: f.segmentos.filter((_, i) => i !== idx) }));
    const addSeg = () =>
        setForm((f) => ({ ...f, segmentos: [...f.segmentos, emptySegmento(f.segmentos.length)] }));

    const lucro = calcLucro(form.custo, form.venda);

    // Validação após extração IA ou edição inicial
    useEffect(() => {
        if (form.dataSaida) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const d = new Date(form.dataSaida);
            if (d < now) {
                setDateError("A data de ida não pode ser anterior a hoje.");
            } else {
                setDateError(null);
            }
        } else {
            setDateError(null);
        }
    }, [form.dataSaida]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col"
            >
                <SheetHeader className="px-6 pt-6 pb-3 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-primary" />
                        {editingId ? "Editar peça" : "Nova peça"}
                    </SheetTitle>
                    <SheetDescription>
                        Bloco indivisível de voos. Pode conter múltiplos segmentos internos.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <Tabs defaultValue="resumo" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="resumo" className="gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                Resumo
                            </TabsTrigger>
                            <TabsTrigger value="financeiro" className="gap-1.5">
                                <Banknote className="h-3.5 w-3.5" />
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger value="segmentos" className="gap-1.5">
                                <ListChecks className="h-3.5 w-3.5" />
                                Segmentos
                                {form.segmentos.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                        {form.segmentos.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumo" className="space-y-3 pt-4">
                            <Field label="Apelido / título">
                                <Input
                                    value={form.titulo}
                                    onChange={(e) => patch({ titulo: e.target.value })}
                                    placeholder="Ex: MGF→LIS Gol Smiles"
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Origem">
                                    <Input value={form.origem} onChange={(e) => patch({ origem: e.target.value })} />
                                </Field>
                                <Field label="Destino">
                                    <Input value={form.destino} onChange={(e) => patch({ destino: e.target.value })} />
                                </Field>
                                <Field label="Data saída">
                                    <Input
                                        type="date"
                                        min={new Date().toISOString().slice(0, 10)}
                                        value={splitDateTime(form.dataSaida).date}
                                        onChange={e => patch({ dataSaida: joinDateTime(e.target.value, splitDateTime(form.dataSaida).time) })}
                                    />
                                </Field>
                                {dateError && (
                                    <div className="text-xs text-red-600 font-medium -mt-2 mb-2">{dateError}</div>
                                )}
                                <Field label="Hora saída">
                                    <InputMask
                                        type="text"
                                        inputMode="numeric"
                                        mask={maskHour}
                                        maxLength={5}
                                        placeholder="00:00"
                                        value={splitDateTime(form.dataSaida).time}
                                        onChange={e => {
                                            const masked = maskHour(e.target.value);
                                            patch({ dataSaida: joinDateTime(splitDateTime(form.dataSaida).date, masked) });
                                        }}
                                    />
                                </Field>
                                <Field label="Data chegada">
                                    <Input
                                        type="date"
                                        value={splitDateTime(form.dataChegada).date}
                                        onChange={e => patch({ dataChegada: joinDateTime(e.target.value, splitDateTime(form.dataChegada).time) })}
                                    />
                                </Field>
                                <Field label="Hora chegada">
                                    <InputMask
                                        type="text"
                                        inputMode="numeric"
                                        mask={maskHour}
                                        maxLength={5}
                                        placeholder="00:00"
                                        value={splitDateTime(form.dataChegada).time}
                                        onChange={e => {
                                            const masked = maskHour(e.target.value);
                                            patch({ dataChegada: joinDateTime(splitDateTime(form.dataChegada).date, masked) });
                                        }}
                                    />
                                </Field>
                                <Field label="Companhias">
                                    <Input
                                        value={form.companhias}
                                        onChange={(e) => patch({ companhias: e.target.value })}
                                        placeholder="Gol, TAP..."
                                    />
                                </Field>
                                <Field label="Conexões">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.qtdConexoes}
                                        onChange={(e) => patch({ qtdConexoes: Number(e.target.value) })}
                                    />
                                </Field>
                                <Field label="Classe">
                                    <Select
                                        value={form.classe}
                                        onValueChange={(v) => patch({ classe: v })}
                                    >
                                        <SelectTrigger className="h-8 w-full text-sm">
                                            <SelectValue placeholder="Selecione a classe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Econômica">Econômica</SelectItem>
                                            <SelectItem value="Econômica Premium">Econômica Premium</SelectItem>
                                            <SelectItem value="Executiva">Executiva</SelectItem>
                                            <SelectItem value="Primeira">Primeira</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Bagagem">
                                    <Input
                                        value={form.bagagem}
                                        onChange={(e) => patch({ bagagem: e.target.value })}
                                        placeholder="23kg + 10kg"
                                    />
                                </Field>
                            </div>
                            <Field label="Observações">
                                <Textarea
                                    rows={3}
                                    value={form.observacoes}
                                    onChange={(e) => patch({ observacoes: e.target.value })}
                                />
                            </Field>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs">Status:</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v) => patch({ status: v as PecaForm["status"] })}
                                >
                                    <SelectTrigger className="h-8 w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pesquisa">Em pesquisa</SelectItem>
                                        <SelectItem value="favorita">Favorita</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="financeiro" className="space-y-3 pt-4">
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Tipo">
                                    <Select
                                        value={form.tipoFinanceiro}
                                        onValueChange={(v) =>
                                            patch({ tipoFinanceiro: v as PecaForm["tipoFinanceiro"] })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pagante">Pagante</SelectItem>
                                            <SelectItem value="milhas">Milhas</SelectItem>
                                            <SelectItem value="misto">Misto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Custo (R$)">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.custo}
                                        onChange={(e) =>
                                            patch({ custo: e.target.value === "" ? "" : Number(e.target.value) })
                                        }
                                    />
                                </Field>
                                <Field label="Venda (R$)">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.venda}
                                        onChange={(e) =>
                                            patch({ venda: e.target.value === "" ? "" : Number(e.target.value) })
                                        }
                                    />
                                </Field>
                            </div>

                            {lucro != null && (
                                <div
                                    className={`rounded-md border p-3 text-sm ${lucro >= 0
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                        : "bg-rose-50 border-rose-200 text-rose-800"
                                        }`}
                                >
                                    <span className="font-medium">Lucro previsto:</span>{" "}
                                    <span className="font-bold tabular-nums">{fmtCurrencyCompact(lucro)}</span>
                                </div>
                            )}

                            <Field label="Fonte">
                                <Input
                                    value={form.fonte}
                                    onChange={(e) => patch({ fonte: e.target.value })}
                                    placeholder="Smiles, Latam Pass, Decolar..."
                                />
                            </Field>
                            <Field label="Estratégia (interno)">
                                <Textarea
                                    rows={3}
                                    value={form.estrategia}
                                    onChange={(e) => patch({ estrategia: e.target.value })}
                                    placeholder="Emitir com cartão X, transferir Y milhas..."
                                />
                            </Field>
                            <p className="text-[11px] text-muted-foreground">
                                Custo, fonte e estratégia são internos — não aparecem na proposta enviada ao cliente.
                            </p>
                        </TabsContent>

                        <TabsContent value="segmentos" className="space-y-3 pt-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Detalhamento por trecho. Opcional, mas útil para conexões.
                                </p>
                                <Button size="sm" variant="outline" onClick={addSeg} className="gap-1">
                                    <Plus className="h-3.5 w-3.5" />
                                    Adicionar
                                </Button>
                            </div>
                            {form.segmentos.length === 0 ? (
                                <div className="rounded-md border-2 border-dashed p-6 text-center text-xs text-muted-foreground">
                                    Sem segmentos detalhados.
                                </div>
                            ) : (
                                form.segmentos.map((s, idx) => (
                                    <div key={idx} className="rounded-md border p-3 space-y-2 bg-card">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-[10px]">
                                                Segmento {idx + 1}
                                            </Badge>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => removeSeg(idx)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <Input
                                                placeholder="De (IATA)"
                                                value={s.aeroportoOrigem}
                                                onChange={(e) =>
                                                    patchSeg(idx, { aeroportoOrigem: e.target.value.toUpperCase() })
                                                }
                                            />
                                            <Input
                                                placeholder="Para (IATA)"
                                                value={s.aeroportoDestino}
                                                onChange={(e) =>
                                                    patchSeg(idx, { aeroportoDestino: e.target.value.toUpperCase() })
                                                }
                                            />
                                            <Input
                                                placeholder="Cia"
                                                value={s.companhia}
                                                onChange={(e) => patchSeg(idx, { companhia: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Voo"
                                                value={s.numeroVoo}
                                                onChange={(e) => patchSeg(idx, { numeroVoo: e.target.value })}
                                            />
                                            <Input
                                                type="date"
                                                value={splitDateTime(s.saida).date}
                                                onChange={e => patchSeg(idx, { saida: joinDateTime(e.target.value, splitDateTime(s.saida).time) })}
                                            />
                                            <InputMask
                                                type="text"
                                                inputMode="numeric"
                                                mask={maskHour}
                                                maxLength={5}
                                                placeholder="00:00"
                                                value={splitDateTime(s.saida).time}
                                                onChange={e => {
                                                    const masked = maskHour(e.target.value);
                                                    patchSeg(idx, { saida: joinDateTime(splitDateTime(s.saida).date, masked) });
                                                }}
                                            />
                                            <Input
                                                type="date"
                                                value={splitDateTime(s.chegada).date}
                                                onChange={e => patchSeg(idx, { chegada: joinDateTime(e.target.value, splitDateTime(s.chegada).time) })}
                                            />
                                            <InputMask
                                                type="text"
                                                inputMode="numeric"
                                                mask={maskHour}
                                                maxLength={5}
                                                placeholder="00:00"
                                                value={splitDateTime(s.chegada).time}
                                                onChange={e => {
                                                    const masked = maskHour(e.target.value);
                                                    patchSeg(idx, { chegada: joinDateTime(splitDateTime(s.chegada).date, masked) });
                                                }}
                                            />
                                            <Select
                                                value={s.classe}
                                                onValueChange={(v) => patchSeg(idx, { classe: v })}
                                            >
                                                <SelectTrigger className="h-8 w-full text-xs" />
                                                <SelectContent>
                                                    <SelectItem value="Econômica">Econômica</SelectItem>
                                                    <SelectItem value="Econômica Premium">Econômica Premium</SelectItem>
                                                    <SelectItem value="Executiva">Executiva</SelectItem>
                                                    <SelectItem value="Primeira">Primeira</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Bagagem"
                                                value={s.bagagem}
                                                onChange={(e) => patchSeg(idx, { bagagem: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <SheetFooter className="px-6 py-3 border-t bg-muted/30">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={() => onSubmit(form)} disabled={isSubmitting || !!dateError}>
                        {isSubmitting ? "Salvando..." : editingId ? "Salvar alterações" : "Criar peça"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}
