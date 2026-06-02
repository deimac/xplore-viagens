import { useEffect, useRef, useState, type DragEvent } from "react";
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
import { Plus, X, Plane, Banknote, ListChecks, Info, Sparkles, Upload, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import type { PecaCompleta } from "./types";
import { calcLucro, fmtCurrencyCompact } from "@/lib/cotacoes/calc";
import {
    combineDateTimeForSubmit,
    splitIsoDatetime,
    splitStoredDatetime,
} from "@/lib/cotacoes/datetimeForm";
import { normalizeBagagemCounts } from "@/lib/cotacoes/bagagem";

type Direcao = "ida" | "volta";

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

type ResumoDirecaoForm = {
    origem: string;
    destino: string;
    dataSaidaDate: string;
    dataSaidaTime: string;
    dataChegadaDate: string;
    dataChegadaTime: string;
    qtdConexoes: number;
    companhias: string;
    classe: string;
};

export type PecaForm = {
    titulo: string;
    temVolta: boolean;
    resumoIda: ResumoDirecaoForm;
    resumoVolta: ResumoDirecaoForm;
    itemPessoal: number;
    bagagemMao: number;
    bagagemDespachada: number;
    tipoFinanceiro: "milhas" | "pagante" | "misto";
    qtdMilhas: string;
    valorMilheiro: string;
    custo: string;
    venda: string;
    fonte: string;
    estrategia: string;
    status: "pesquisa" | "favorita";
    observacoes: string;
    segmentosIda: Segmento[];
    segmentosVolta: Segmento[];
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
    temVolta: false,
    resumoIda: {
        origem: "",
        destino: "",
        dataSaidaDate: "",
        dataSaidaTime: "",
        dataChegadaDate: "",
        dataChegadaTime: "",
        qtdConexoes: 0,
        companhias: "",
        classe: "",
    },
    resumoVolta: {
        origem: "",
        destino: "",
        dataSaidaDate: "",
        dataSaidaTime: "",
        dataChegadaDate: "",
        dataChegadaTime: "",
        qtdConexoes: 0,
        companhias: "",
        classe: "",
    },
    itemPessoal: 1,
    bagagemMao: 0,
    bagagemDespachada: 0,
    tipoFinanceiro: "pagante",
    qtdMilhas: "",
    valorMilheiro: "",
    custo: "",
    venda: "",
    fonte: "",
    estrategia: "",
    status: "pesquisa",
    observacoes: "",
    segmentosIda: [],
    segmentosVolta: [],
});

export function pecaToForm(p: PecaCompleta): PecaForm {
    const idaSaida = splitStoredDatetime(p.dataSaida);
    const idaChegada = splitStoredDatetime(p.dataChegada);
    const voltaSaida = splitStoredDatetime((p as any).dataSaidaVolta);
    const voltaChegada = splitStoredDatetime((p as any).dataChegadaVolta);
    const temVolta =
        Boolean((p as any).temVolta) ||
        Boolean((p as any).origemVolta) ||
        Boolean((p as any).destinoVolta) ||
        Boolean((p as any).dataSaidaVolta) ||
        Boolean((p as any).dataChegadaVolta) ||
        p.segmentos.some((s: any) => s.direcao === "volta");

    const segsIda = p.segmentos.filter((s: any) => (s.direcao ?? "ida") === "ida");
    const segsVolta = p.segmentos.filter((s: any) => s.direcao === "volta");

    const mapSegmento = (s: any, i: number): Segmento => {
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
    };

    return {
        titulo: p.titulo ?? "",
        temVolta,
        resumoIda: {
            origem: p.origem ?? "",
            destino: p.destino ?? "",
            dataSaidaDate: idaSaida.date,
            dataSaidaTime: idaSaida.time,
            dataChegadaDate: idaChegada.date,
            dataChegadaTime: idaChegada.time,
            qtdConexoes: p.qtdConexoes ?? 0,
            companhias: p.companhias ?? "",
            classe: p.classe ?? "",
        },
        resumoVolta: {
            origem: (p as any).origemVolta ?? "",
            destino: (p as any).destinoVolta ?? "",
            dataSaidaDate: voltaSaida.date,
            dataSaidaTime: voltaSaida.time,
            dataChegadaDate: voltaChegada.date,
            dataChegadaTime: voltaChegada.time,
            qtdConexoes: (p as any).qtdConexoesVolta ?? 0,
            companhias: (p as any).companhiasVolta ?? "",
            classe: (p as any).classeVolta ?? "",
        },
        ...normalizeBagagemCounts({
            itemPessoal: p.itemPessoal,
            bagagemMao: p.bagagemMao,
            bagagemDespachada: p.bagagemDespachada,
        }),
        tipoFinanceiro: p.tipoFinanceiro,
        qtdMilhas: formatMilhasInput((p as any).qtdMilhas != null ? String((p as any).qtdMilhas) : ""),
        valorMilheiro: formatCurrencyInput((p as any).valorMilheiro != null ? String((p as any).valorMilheiro) : ""),
        custo: formatCurrencyInput(p.custo != null ? String(p.custo) : ""),
        venda: formatCurrencyInput(p.venda != null ? String(p.venda) : ""),
        fonte: p.fonte ?? "",
        estrategia: p.estrategia ?? "",
        status: p.status,
        observacoes: p.observacoes ?? "",
        segmentosIda: segsIda.map(mapSegmento),
        segmentosVolta: segsVolta.map(mapSegmento),
    };
}

/** Converte o formulário (campos separados) para payload com datetime ISO. */
export function pecaFormToPayload(form: PecaForm) {
    const mapSegs = (segmentos: Segmento[], direcao: Direcao) =>
        segmentos.map((s, idx) => ({
            ...s,
            direcao,
            ordem: idx,
            saida: combineDateTimeForSubmit(s.saidaDate, s.saidaTime),
            chegada: combineDateTimeForSubmit(s.chegadaDate, s.chegadaTime),
        }));

    return {
        titulo: form.titulo,
        temVolta: form.temVolta,
        origem: form.resumoIda.origem,
        destino: form.resumoIda.destino,
        dataSaida: combineDateTimeForSubmit(form.resumoIda.dataSaidaDate, form.resumoIda.dataSaidaTime),
        dataChegada: combineDateTimeForSubmit(form.resumoIda.dataChegadaDate, form.resumoIda.dataChegadaTime),
        qtdConexoes: form.resumoIda.qtdConexoes,
        companhias: form.resumoIda.companhias,
        classe: form.resumoIda.classe,
        origemVolta: form.temVolta ? form.resumoVolta.origem : null,
        destinoVolta: form.temVolta ? form.resumoVolta.destino : null,
        dataSaidaVolta: form.temVolta
            ? combineDateTimeForSubmit(form.resumoVolta.dataSaidaDate, form.resumoVolta.dataSaidaTime)
            : null,
        dataChegadaVolta: form.temVolta
            ? combineDateTimeForSubmit(form.resumoVolta.dataChegadaDate, form.resumoVolta.dataChegadaTime)
            : null,
        qtdConexoesVolta: form.temVolta ? form.resumoVolta.qtdConexoes : 0,
        companhiasVolta: form.temVolta ? form.resumoVolta.companhias : null,
        classeVolta: form.temVolta ? form.resumoVolta.classe : null,
        itemPessoal: form.itemPessoal,
        bagagemMao: form.bagagemMao,
        bagagemDespachada: form.bagagemDespachada,
        tipoFinanceiro: form.tipoFinanceiro,
        qtdMilhas: parseMilhasInput(form.qtdMilhas),
        valorMilheiro: parseCurrencyInput(form.valorMilheiro),
        custo: parseCurrencyInput(form.custo),
        venda: parseCurrencyInput(form.venda),
        fonte: form.fonte,
        estrategia: form.estrategia,
        status: form.status,
        observacoes: form.observacoes,
        segmentos: [
            ...mapSegs(form.segmentosIda, "ida"),
            ...(form.temVolta ? mapSegs(form.segmentosVolta, "volta") : []),
        ],
    };
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingId: number | null;
    initialForm: PecaForm;
    onSubmit: (form: PecaForm) => void;
    onExtractText: (texto: string, target: Direcao) => Promise<Record<string, unknown>>;
    onExtractImage: (file: File, target: Direcao) => Promise<Record<string, unknown>>;
    isExtractingText: boolean;
    isExtractingImage: boolean;
    isSubmitting: boolean;
}

export function PecaSheet({
    open,
    onOpenChange,
    editingId,
    initialForm,
    onSubmit,
    onExtractText,
    onExtractImage,
    isExtractingText,
    isExtractingImage,
    isSubmitting,
}: Props) {
    const [form, setForm] = useState<PecaForm>(initialForm);
    const [dateError, setDateError] = useState<string | null>(null);
    const [resumoTab, setResumoTab] = useState<Direcao>("ida");
    const [mainTab, setMainTab] = useState<"resumo" | "financeiro" | "segmentos">("resumo");

    useEffect(() => {
        if (open) {
            setForm(initialForm);
            setResumoTab("ida");
            setMainTab("resumo");
        }
    }, [open, initialForm]);

    const patch = (p: Partial<PecaForm>) => {
        setForm((f) => {
            const next = { ...f, ...p };
            setDateError(validateDates(next));
            return next;
        });
    };

    const patchResumo = (direcao: Direcao, p: Partial<ResumoDirecaoForm>) => {
        setForm((f) => {
            const key = direcao === "ida" ? "resumoIda" : "resumoVolta";
            const next = {
                ...f,
                [key]: { ...f[key], ...p },
            } as PecaForm;
            setDateError(validateDates(next));
            return next;
        });
    };

    const patchSeg = (direcao: Direcao, idx: number, p: Partial<Segmento>) =>
        setForm((f) => {
            const key = direcao === "ida" ? "segmentosIda" : "segmentosVolta";
            const segs = [...f[key]];
            segs[idx] = { ...segs[idx], ...p };
            return { ...f, [key]: segs } as PecaForm;
        });
    const removeSeg = (direcao: Direcao, idx: number) =>
        setForm((f) => {
            const key = direcao === "ida" ? "segmentosIda" : "segmentosVolta";
            return { ...f, [key]: f[key].filter((_, i) => i !== idx) } as PecaForm;
        });
    const addSeg = (direcao: Direcao) =>
        setForm((f) => {
            const key = direcao === "ida" ? "segmentosIda" : "segmentosVolta";
            return {
                ...f,
                [key]: [...f[key], emptySegmento(f[key].length)],
            } as PecaForm;
        });

    const addVolta = () => {
        setForm((f) => {
            const next: PecaForm = {
                ...f,
                temVolta: true,
                resumoVolta: {
                    ...f.resumoVolta,
                    origem: f.resumoVolta.origem || f.resumoIda.destino,
                    destino: f.resumoVolta.destino || f.resumoIda.origem,
                },
            };
            setDateError(validateDates(next));
            return next;
        });
        setResumoTab("volta");
    };

    const removeVolta = () => {
        setForm((f) => {
            const next: PecaForm = {
                ...f,
                temVolta: false,
                resumoVolta: emptyPeca().resumoVolta,
                segmentosVolta: [],
            };
            setDateError(validateDates(next));
            return next;
        });
        setResumoTab("ida");
    };

    const lucro = calcLucro(parseCurrencyInput(form.custo), parseCurrencyInput(form.venda));
    const milhasEnabled = form.tipoFinanceiro === "milhas";

    const handleExtractText = async (texto: string) => {
        const extracted = await onExtractText(texto, resumoTab);
        setForm((current) => extractedToPecaForm(extracted, resumoTab, current));
    };

    const handleExtractImage = async (file: File) => {
        const extracted = await onExtractImage(file, resumoTab);
        setForm((current) => extractedToPecaForm(extracted, resumoTab, current));
    };

    useEffect(() => {
        setDateError(validateDates(form));
    }, [form]);

    const totalSegmentos = form.segmentosIda.length + (form.temVolta ? form.segmentosVolta.length : 0);

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
                        Bloco indivisível do cenário com resumo por direção (ida e volta opcional).
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "resumo" | "financeiro" | "segmentos")} className="w-full">
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
                                {totalSegmentos > 0 && (
                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                        {totalSegmentos}
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
                            <div className="grid grid-cols-1 gap-3">
                                <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Resumo dos voos
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {!form.temVolta ? (
                                                <Button size="sm" variant="outline" onClick={addVolta} className="h-7">
                                                    Adicionar volta
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-muted-foreground"
                                                    onClick={removeVolta}
                                                >
                                                    Remover volta
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <Tabs value={resumoTab} onValueChange={(v) => setResumoTab(v as Direcao)}>
                                        <TabsList className={`grid w-full ${form.temVolta ? "grid-cols-2" : "grid-cols-1"}`}>
                                            <TabsTrigger value="ida">Ida</TabsTrigger>
                                            {form.temVolta && <TabsTrigger value="volta">Volta</TabsTrigger>}
                                        </TabsList>
                                        <TabsContent value="ida" className="pt-3">
                                            <ResumoDirecaoFields
                                                resumo={form.resumoIda}
                                                onPatch={(p) => patchResumo("ida", p)}
                                                minDate={new Date().toISOString().slice(0, 10)}
                                            />
                                        </TabsContent>
                                        {form.temVolta && (
                                            <TabsContent value="volta" className="pt-3">
                                                <ResumoDirecaoFields
                                                    resumo={form.resumoVolta}
                                                    onPatch={(p) => patchResumo("volta", p)}
                                                />
                                            </TabsContent>
                                        )}
                                    </Tabs>

                                    {dateError && (
                                        <div className="text-xs text-red-600 font-medium -mt-1">{dateError}</div>
                                    )}

                                    <IaInlineImporter
                                        target={resumoTab}
                                        isExtractingText={isExtractingText}
                                        isExtractingImage={isExtractingImage}
                                        onExtractText={handleExtractText}
                                        onExtractImage={handleExtractImage}
                                    />
                                </div>

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
                                <Field label="Qtd. milhas">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Ex: 175.300"
                                        value={form.qtdMilhas}
                                        disabled={!milhasEnabled}
                                        onChange={(e) => patch({ qtdMilhas: formatMilhasInput(e.target.value) })}
                                    />
                                </Field>
                                <Field label="Valor milheiro">
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="R$ 0,00"
                                        value={form.valorMilheiro}
                                        disabled={!milhasEnabled}
                                        onChange={(e) => patch({ valorMilheiro: formatCurrencyInput(e.target.value) })}
                                    />
                                </Field>
                                <Field label="Custo (R$)">
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="R$ 0,00"
                                        value={form.custo}
                                        onChange={(e) => patch({ custo: formatCurrencyInput(e.target.value) })}
                                    />
                                </Field>
                                <Field label="Venda (R$)">
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="R$ 0,00"
                                        value={form.venda}
                                        onChange={(e) => patch({ venda: formatCurrencyInput(e.target.value) })}
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
                            <p className="text-xs text-muted-foreground">
                                Segmentos detalhados separados por direção.
                            </p>

                            <SegmentosDirecaoSection
                                titulo="Segmentos da ida"
                                segmentos={form.segmentosIda}
                                onAdd={() => addSeg("ida")}
                                onRemove={(idx) => removeSeg("ida", idx)}
                                onPatch={(idx, p) => patchSeg("ida", idx, p)}
                            />

                            {form.temVolta && (
                                <SegmentosDirecaoSection
                                    titulo="Segmentos da volta"
                                    segmentos={form.segmentosVolta}
                                    onAdd={() => addSeg("volta")}
                                    onRemove={(idx) => removeSeg("volta", idx)}
                                    onPatch={(idx, p) => patchSeg("volta", idx, p)}
                                />
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
export function extractedToPecaForm(
    extracted: Record<string, unknown>,
    target: Direcao = "ida",
    base?: PecaForm
): PecaForm {
    const start = base ? { ...base } : emptyPeca();
    const saida = splitIsoDatetime(extracted.dataSaida as string | undefined);
    const chegada = splitIsoDatetime(extracted.dataChegada as string | undefined);
    const segmentos = Array.isArray(extracted.segmentos) ? extracted.segmentos : [];
    const idaSegsRaw = segmentos.filter((raw: any) => (raw?.direcao ?? "ida") === "ida");
    const voltaSegsRaw = segmentos.filter((raw: any) => raw?.direcao === "volta");

    const mapSegmento = (raw: Record<string, unknown>, i: number): Segmento => {
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
    };

    const hasBagagemFromExtraction =
        extracted.itemPessoal != null ||
        extracted.bagagemMao != null ||
        extracted.bagagemDespachada != null;
    const bagagemMerged = hasBagagemFromExtraction
        ? normalizeBagagemCounts({
            itemPessoal: extracted.itemPessoal as number | null | undefined,
            bagagemMao: extracted.bagagemMao as number | null | undefined,
            bagagemDespachada: extracted.bagagemDespachada as number | null | undefined,
        })
        : {
            itemPessoal: start.itemPessoal,
            bagagemMao: start.bagagemMao,
            bagagemDespachada: start.bagagemDespachada,
        };

    const baseRes = {
        titulo: (extracted.titulo as string) ?? start.titulo,
        ...bagagemMerged,
        observacoes: (extracted.observacoes as string) ?? start.observacoes,
        qtdMilhas: start.qtdMilhas,
        valorMilheiro: start.valorMilheiro,
        custo: start.custo,
        venda: start.venda,
    };

    const resumoIda = {
        ...start.resumoIda,
        origem: (extracted.origem as string) ?? "",
        destino: (extracted.destino as string) ?? "",
        dataSaidaDate: saida.date,
        dataSaidaTime: saida.time,
        dataChegadaDate: chegada.date,
        dataChegadaTime: chegada.time,
        qtdConexoes:
            (extracted.qtdConexoes as number) ??
            (idaSegsRaw.length > 0 ? Math.max(0, idaSegsRaw.length - 1) : 0),
        companhias: (extracted.companhias as string) ?? "",
        classe: (extracted.classe as string) ?? "",
    };

    const resumoVolta = {
        ...start.resumoVolta,
        origem: (extracted.origem as string) ?? "",
        destino: (extracted.destino as string) ?? "",
        dataSaidaDate: saida.date,
        dataSaidaTime: saida.time,
        dataChegadaDate: chegada.date,
        dataChegadaTime: chegada.time,
        qtdConexoes:
            (extracted.qtdConexoes as number) ??
            (voltaSegsRaw.length > 0 ? Math.max(0, voltaSegsRaw.length - 1) : 0),
        companhias: (extracted.companhias as string) ?? "",
        classe: (extracted.classe as string) ?? "",
    };

    if (target === "volta") {
        return {
            ...start,
            ...baseRes,
            temVolta: true,
            resumoVolta,
            segmentosVolta: (voltaSegsRaw.length ? voltaSegsRaw : idaSegsRaw).map(mapSegmento),
        };
    }

    return {
        ...start,
        ...baseRes,
        temVolta: start.temVolta || Boolean(extracted.temVolta) || voltaSegsRaw.length > 0,
        resumoIda,
        resumoVolta:
            start.temVolta || Boolean(extracted.temVolta) || voltaSegsRaw.length > 0
                ? {
                    ...start.resumoVolta,
                    origem: (extracted.origemVolta as string) ?? start.resumoVolta.origem,
                    destino: (extracted.destinoVolta as string) ?? start.resumoVolta.destino,
                    dataSaidaDate:
                        splitIsoDatetime(extracted.dataSaidaVolta as string | undefined).date ||
                        start.resumoVolta.dataSaidaDate,
                    dataSaidaTime:
                        splitIsoDatetime(extracted.dataSaidaVolta as string | undefined).time ||
                        start.resumoVolta.dataSaidaTime,
                    dataChegadaDate:
                        splitIsoDatetime(extracted.dataChegadaVolta as string | undefined).date ||
                        start.resumoVolta.dataChegadaDate,
                    dataChegadaTime:
                        splitIsoDatetime(extracted.dataChegadaVolta as string | undefined).time ||
                        start.resumoVolta.dataChegadaTime,
                    qtdConexoes:
                        (extracted.qtdConexoesVolta as number) ??
                        (start.resumoVolta.qtdConexoes || (voltaSegsRaw.length ? Math.max(0, voltaSegsRaw.length - 1) : 0)),
                    companhias: (extracted.companhiasVolta as string) ?? start.resumoVolta.companhias,
                    classe: (extracted.classeVolta as string) ?? start.resumoVolta.classe,
                }
                : start.resumoVolta,
        segmentosIda: idaSegsRaw.map(mapSegmento),
        segmentosVolta:
            voltaSegsRaw.length > 0
                ? voltaSegsRaw.map(mapSegmento)
                : start.segmentosVolta,
    };
}

function formatCurrencyInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = Number(digits) / 100;
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(number);
}

function parseCurrencyInput(value: string): number | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    return Number(digits) / 100;
}

function formatMilhasInput(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(digits));
}

function parseMilhasInput(value: string): number | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    return Number(digits);
}

function validateDates(form: PecaForm): string | null {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (form.resumoIda.dataSaidaDate) {
        const ida = new Date(form.resumoIda.dataSaidaDate);
        if (ida < now) return "A data de ida não pode ser anterior a hoje.";
    }
    if (form.temVolta && form.resumoVolta.dataSaidaDate && form.resumoIda.dataSaidaDate) {
        const ida = new Date(form.resumoIda.dataSaidaDate);
        const volta = new Date(form.resumoVolta.dataSaidaDate);
        if (volta < ida) return "A data da volta não pode ser anterior à ida.";
    }
    return null;
}

function ResumoDirecaoFields({
    resumo,
    onPatch,
    minDate,
}: {
    resumo: ResumoDirecaoForm;
    onPatch: (patch: Partial<ResumoDirecaoForm>) => void;
    minDate?: string;
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <Field label="Origem">
                <Input value={resumo.origem} onChange={(e) => onPatch({ origem: e.target.value })} />
            </Field>
            <Field label="Destino">
                <Input value={resumo.destino} onChange={(e) => onPatch({ destino: e.target.value })} />
            </Field>
            <Field label="Data saída">
                <Input
                    type="date"
                    min={minDate}
                    value={resumo.dataSaidaDate}
                    onChange={(e) => onPatch({ dataSaidaDate: e.target.value })}
                />
            </Field>
            <Field label="Hora saída">
                <Input
                    type="time"
                    value={resumo.dataSaidaTime}
                    onChange={(e) => onPatch({ dataSaidaTime: e.target.value })}
                />
            </Field>
            <Field label="Data chegada">
                <Input
                    type="date"
                    value={resumo.dataChegadaDate}
                    onChange={(e) => onPatch({ dataChegadaDate: e.target.value })}
                />
            </Field>
            <Field label="Hora chegada">
                <Input
                    type="time"
                    value={resumo.dataChegadaTime}
                    onChange={(e) => onPatch({ dataChegadaTime: e.target.value })}
                />
            </Field>
            <Field label="Companhias">
                <Input
                    value={resumo.companhias}
                    onChange={(e) => onPatch({ companhias: e.target.value })}
                    placeholder="Gol, TAP..."
                />
            </Field>
            <Field label="Conexões">
                <Input
                    type="number"
                    min={0}
                    value={resumo.qtdConexoes}
                    onChange={(e) => onPatch({ qtdConexoes: Number(e.target.value) || 0 })}
                />
            </Field>
            <Field label="Classe">
                <Select value={resumo.classe} onValueChange={(v) => onPatch({ classe: v })}>
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
        </div>
    );
}

function SegmentosDirecaoSection({
    titulo,
    segmentos,
    onAdd,
    onRemove,
    onPatch,
}: {
    titulo: string;
    segmentos: Segmento[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onPatch: (idx: number, patch: Partial<Segmento>) => void;
}) {
    return (
        <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</p>
                <Button size="sm" variant="outline" onClick={onAdd} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                </Button>
            </div>

            {segmentos.length === 0 ? (
                <div className="rounded-md border-2 border-dashed p-5 text-center text-xs text-muted-foreground">
                    Sem segmentos detalhados.
                </div>
            ) : (
                segmentos.map((s, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2 bg-card">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">
                                Segmento {idx + 1}
                            </Badge>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onRemove(idx)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Input
                                placeholder="De (IATA)"
                                value={s.aeroportoOrigem}
                                onChange={(e) => onPatch(idx, { aeroportoOrigem: e.target.value.toUpperCase() })}
                            />
                            <Input
                                placeholder="Para (IATA)"
                                value={s.aeroportoDestino}
                                onChange={(e) => onPatch(idx, { aeroportoDestino: e.target.value.toUpperCase() })}
                            />
                            <Input
                                placeholder="Cia"
                                value={s.companhia}
                                onChange={(e) => onPatch(idx, { companhia: e.target.value })}
                            />
                            <Input
                                placeholder="Voo"
                                value={s.numeroVoo}
                                onChange={(e) => onPatch(idx, { numeroVoo: e.target.value })}
                            />
                            <Input
                                type="date"
                                value={s.saidaDate}
                                onChange={(e) => onPatch(idx, { saidaDate: e.target.value })}
                            />
                            <Input
                                type="time"
                                value={s.saidaTime}
                                onChange={(e) => onPatch(idx, { saidaTime: e.target.value })}
                            />
                            <Input
                                type="date"
                                value={s.chegadaDate}
                                onChange={(e) => onPatch(idx, { chegadaDate: e.target.value })}
                            />
                            <Input
                                type="time"
                                value={s.chegadaTime}
                                onChange={(e) => onPatch(idx, { chegadaTime: e.target.value })}
                            />
                            <Select value={s.classe} onValueChange={(v) => onPatch(idx, { classe: v })}>
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
                                onChange={(e) => onPatch(idx, { bagagem: e.target.value })}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function IaInlineImporter({
    target,
    isExtractingText,
    isExtractingImage,
    onExtractText,
    onExtractImage,
}: {
    target: Direcao;
    isExtractingText: boolean;
    isExtractingImage: boolean;
    onExtractText: (texto: string) => Promise<void>;
    onExtractImage: (file: File) => Promise<void>;
}) {
    const [modo, setModo] = useState<"print" | "texto">("print");
    const [texto, setTexto] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file?: File) => {
        if (!file) return;
        await onExtractImage(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            void handleFile(file);
        }
    };

    const submitText = async () => {
        const value = texto.trim();
        if (!value) return;
        await onExtractText(value);
        setTexto("");
    };

    return (
        <div className="rounded-md border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Importar com IA na {target}
                </div>
                <div className="text-[11px] text-muted-foreground">Preenche resumo e segmentos da direção atual</div>
            </div>

            <Tabs value={modo} onValueChange={(v) => setModo(v as "print" | "texto")}>
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="print" className="gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Print
                    </TabsTrigger>
                    <TabsTrigger value="texto" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Texto
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="print" className="pt-3 space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        aria-label="Selecionar imagem para importar via IA"
                        title="Selecionar imagem para importar via IA"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleFile(f);
                            e.target.value = "";
                        }}
                    />
                    <div
                        className={`rounded-lg border-2 border-dashed p-4 text-center space-y-2 transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20"}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                    >
                        <div className="text-sm font-medium">
                            {dragActive ? "Solte a imagem para importar" : "Arraste o print aqui"}
                        </div>
                        <div className="text-xs text-muted-foreground">PNG, JPG, WEBP ou GIF</div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2"
                            disabled={isExtractingImage}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isExtractingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {isExtractingImage ? "Extraindo print..." : "Selecionar print para importar"}
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="texto" className="pt-3 space-y-2">
                    <Textarea
                        rows={4}
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Cole o texto da cotação desta direção"
                    />
                    <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={isExtractingText || !texto.trim()}
                        onClick={() => void submitText()}
                    >
                        {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isExtractingText ? "Extraindo texto..." : "Importar texto na direção atual"}
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
