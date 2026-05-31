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
import {
    combineDateTimeForSubmit,
    splitIsoDatetime,
    splitStoredDatetime,
} from "@/lib/cotacoes/datetimeForm";
import { normalizeBagagemCounts } from "@/lib/cotacoes/bagagem";

export type Segmento = {
    ordem: number;
    aeroportoOrigem: string;
    aeroportoDestino: string;
    cidadeOrigem: string;
    cidadeDestino: string;
    saidaDate: string;
    saidaTime: string;
    chegadaDate: string;
    chegadaTime: string;
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
    dataSaidaDate: string;
    dataSaidaTime: string;
    dataChegadaDate: string;
    dataChegadaTime: string;
    qtdConexoes: number;
    companhias: string;
    itemPessoal: number;
    bagagemMao: number;
    bagagemDespachada: number;
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
    saidaDate: "",
    saidaTime: "",
    chegadaDate: "",
    chegadaTime: "",
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
    dataSaidaDate: "",
    dataSaidaTime: "",
    dataChegadaDate: "",
    dataChegadaTime: "",
    qtdConexoes: 0,
    companhias: "",
    itemPessoal: 1,
    bagagemMao: 0,
    bagagemDespachada: 0,
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

export function pecaToForm(p: PecaCompleta): PecaForm {
    const saida = splitStoredDatetime(p.dataSaida);
    const chegada = splitStoredDatetime(p.dataChegada);
    return {
        titulo: p.titulo ?? "",
        origem: p.origem ?? "",
        destino: p.destino ?? "",
        dataSaidaDate: saida.date,
        dataSaidaTime: saida.time,
        dataChegadaDate: chegada.date,
        dataChegadaTime: chegada.time,
        qtdConexoes: p.qtdConexoes ?? 0,
        companhias: p.companhias ?? "",
        ...normalizeBagagemCounts({
            itemPessoal: p.itemPessoal,
            bagagemMao: p.bagagemMao,
            bagagemDespachada: p.bagagemDespachada,
        }),
        classe: p.classe ?? "",
        tipoFinanceiro: p.tipoFinanceiro,
        custo: p.custo != null ? Number(p.custo) : "",
        venda: p.venda != null ? Number(p.venda) : "",
        fonte: p.fonte ?? "",
        estrategia: p.estrategia ?? "",
        status: p.status,
        observacoes: p.observacoes ?? "",
        segmentos: p.segmentos.map((s, i) => {
            const segSaida = splitStoredDatetime(s.saida);
            const segChegada = splitStoredDatetime(s.chegada);
            return {
                ordem: s.ordem ?? i,
                aeroportoOrigem: s.aeroportoOrigem ?? "",
                aeroportoDestino: s.aeroportoDestino ?? "",
                cidadeOrigem: s.cidadeOrigem ?? "",
                cidadeDestino: s.cidadeDestino ?? "",
                saidaDate: segSaida.date,
                saidaTime: segSaida.time,
                chegadaDate: segChegada.date,
                chegadaTime: segChegada.time,
                companhia: s.companhia ?? "",
                numeroVoo: s.numeroVoo ?? "",
                classe: s.classe ?? "",
                bagagem: s.bagagem ?? "",
                duracaoConexaoMinutos: s.duracaoConexaoMinutos ?? "",
            };
        }),
    };
}

/** Converte o formulário (campos separados) para payload com datetime ISO. */
export function pecaFormToPayload(form: PecaForm) {
    return {
        ...form,
        dataSaida: combineDateTimeForSubmit(form.dataSaidaDate, form.dataSaidaTime),
        dataChegada: combineDateTimeForSubmit(form.dataChegadaDate, form.dataChegadaTime),
        segmentos: form.segmentos.map((s) => ({
            ...s,
            saida: combineDateTimeForSubmit(s.saidaDate, s.saidaTime),
            chegada: combineDateTimeForSubmit(s.chegadaDate, s.chegadaTime),
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
            if (next.dataSaidaDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const d = new Date(next.dataSaidaDate);
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

    useEffect(() => {
        if (form.dataSaidaDate) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const d = new Date(form.dataSaidaDate);
            if (d < now) {
                setDateError("A data de ida não pode ser anterior a hoje.");
            } else {
                setDateError(null);
            }
        } else {
            setDateError(null);
        }
    }, [form.dataSaidaDate]);

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
                                        value={form.dataSaidaDate}
                                        onChange={(e) => patch({ dataSaidaDate: e.target.value })}
                                    />
                                </Field>
                                <Field label="Hora saída">
                                    <Input
                                        type="time"
                                        value={form.dataSaidaTime}
                                        onChange={(e) => patch({ dataSaidaTime: e.target.value })}
                                    />
                                </Field>
                                {dateError && (
                                    <div className="col-span-2 text-xs text-red-600 font-medium -mt-2">
                                        {dateError}
                                    </div>
                                )}
                                <Field label="Data chegada">
                                    <Input
                                        type="date"
                                        value={form.dataChegadaDate}
                                        onChange={(e) => patch({ dataChegadaDate: e.target.value })}
                                    />
                                </Field>
                                <Field label="Hora chegada">
                                    <Input
                                        type="time"
                                        value={form.dataChegadaTime}
                                        onChange={(e) => patch({ dataChegadaTime: e.target.value })}
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
                                <div className="col-span-2">
                                    <Field label="Bagagem">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Item pessoal</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={form.itemPessoal}
                                                onChange={(e) =>
                                                    patch({ itemPessoal: Math.max(0, Number(e.target.value) || 0) })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Mão</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={form.bagagemMao}
                                                onChange={(e) =>
                                                    patch({ bagagemMao: Math.max(0, Number(e.target.value) || 0) })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Despachada</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={form.bagagemDespachada}
                                                onChange={(e) =>
                                                    patch({
                                                        bagagemDespachada: Math.max(0, Number(e.target.value) || 0),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </Field>
                                </div>
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
                                                value={s.saidaDate}
                                                onChange={(e) => patchSeg(idx, { saidaDate: e.target.value })}
                                            />
                                            <Input
                                                type="time"
                                                value={s.saidaTime}
                                                onChange={(e) => patchSeg(idx, { saidaTime: e.target.value })}
                                            />
                                            <Input
                                                type="date"
                                                value={s.chegadaDate}
                                                onChange={(e) => patchSeg(idx, { chegadaDate: e.target.value })}
                                            />
                                            <Input
                                                type="time"
                                                value={s.chegadaTime}
                                                onChange={(e) => patchSeg(idx, { chegadaTime: e.target.value })}
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

/** @deprecated use splitStoredDatetime from datetimeForm */
export function toDatetimeLocal(value: string | Date | null | undefined): string {
    const { date, time } = splitStoredDatetime(value);
    if (!date) return "";
    return time ? `${date}T${time}` : date;
}

/** Monta formulário a partir de dados extraídos pela IA. */
export function extractedToPecaForm(extracted: Record<string, unknown>): PecaForm {
    const saida = splitIsoDatetime(extracted.dataSaida as string | undefined);
    const chegada = splitIsoDatetime(extracted.dataChegada as string | undefined);
    const segmentos = Array.isArray(extracted.segmentos) ? extracted.segmentos : [];
    return {
        titulo: (extracted.titulo as string) ?? "",
        origem: (extracted.origem as string) ?? "",
        destino: (extracted.destino as string) ?? "",
        dataSaidaDate: saida.date,
        dataSaidaTime: saida.time,
        dataChegadaDate: chegada.date,
        dataChegadaTime: chegada.time,
        qtdConexoes:
            (extracted.qtdConexoes as number) ??
            (segmentos.length > 0 ? Math.max(0, segmentos.length - 1) : 0),
        companhias: (extracted.companhias as string) ?? "",
        ...normalizeBagagemCounts({
            itemPessoal: extracted.itemPessoal as number | null | undefined,
            bagagemMao: extracted.bagagemMao as number | null | undefined,
            bagagemDespachada: extracted.bagagemDespachada as number | null | undefined,
        }),
        classe: (extracted.classe as string) ?? "",
        tipoFinanceiro: "pagante",
        custo: "",
        venda: "",
        fonte: "",
        estrategia: "",
        status: "pesquisa",
        observacoes: (extracted.observacoes as string) ?? "",
        segmentos: segmentos.map((raw: Record<string, unknown>, i: number) => {
            const segSaida = splitIsoDatetime(raw.saida as string | undefined);
            const segChegada = splitIsoDatetime(raw.chegada as string | undefined);
            return {
                ordem: (raw.ordem as number) ?? i,
                aeroportoOrigem: String(raw.aeroportoOrigem ?? "").toUpperCase(),
                aeroportoDestino: String(raw.aeroportoDestino ?? "").toUpperCase(),
                cidadeOrigem: (raw.cidadeOrigem as string) ?? "",
                cidadeDestino: (raw.cidadeDestino as string) ?? "",
                saidaDate: segSaida.date,
                saidaTime: segSaida.time,
                chegadaDate: segChegada.date,
                chegadaTime: segChegada.time,
                companhia: (raw.companhia as string) ?? "",
                numeroVoo: (raw.numeroVoo as string) ?? "",
                classe: (raw.classe as string) ?? "",
                bagagem: (raw.bagagem as string) ?? "",
                duracaoConexaoMinutos: (raw.duracaoConexaoMinutos as number | "") ?? "",
            };
        }),
    };
}
