import { useMemo, useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Plus,
    Star,
    StarOff,
    Pencil,
    Trash2,
    Plane,
    Layers,
    GripVertical,
    X,
    Sparkles,
    Image as ImageIcon,
    FileText,
    Upload,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ----------------------------------------------------------------------
// Tipos auxiliares
// ----------------------------------------------------------------------
type Segmento = {
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

type PecaForm = {
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

const emptySegmento = (ordem = 0): Segmento => ({
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

const emptyPeca = (): PecaForm => ({
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

const STATUS_COTACAO: Record<string, string> = {
    rascunho: "Rascunho",
    em_pesquisa: "Em pesquisa",
    em_montagem: "Em montagem",
    proposta_enviada: "Proposta enviada",
    fechada: "Fechada",
    cancelada: "Cancelada",
};

function toDatetimeLocal(value: string | Date | null | undefined): string {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtCurrency(v: string | number | null | undefined): string {
    if (v == null || v === "") return "-";
    const n = typeof v === "string" ? Number(v) : v;
    if (isNaN(n)) return "-";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcLucro(custo: string | number | null, venda: string | number | null): number | null {
    if (custo == null || venda == null || custo === "" || venda === "") return null;
    const c = Number(custo);
    const v = Number(venda);
    if (isNaN(c) || isNaN(v)) return null;
    return v - c;
}

// ----------------------------------------------------------------------
// Sortable wrappers (dnd-kit)
// ----------------------------------------------------------------------
function SortableWrapper({ id, children }: { id: string | number; children: (handleProps: any) => React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    return (
        <div ref={setNodeRef} style={style}>
            {children({ ...attributes, ...listeners })}
        </div>
    );
}

// ----------------------------------------------------------------------
// Página
// ----------------------------------------------------------------------
export default function CotacaoDetailPage() {
    const params = useParams<{ id: string }>();
    const cotacaoId = Number(params.id);
    const [, setLocation] = useLocation();

    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.cotacoesWorkspace.getFull.useQuery({ id: cotacaoId });
    const { data: propostas = [] } = trpc.cotacoesWorkspace.listPropostas.useQuery({ cotacaoId });

    const [pecaDialog, setPecaDialog] = useState<{ open: boolean; editingId: number | null; form: PecaForm }>({
        open: false,
        editingId: null,
        form: emptyPeca(),
    });
    const [cenarioDialog, setCenarioDialog] = useState<{ open: boolean; editingId: number | null; nome: string; descricao: string }>({
        open: false,
        editingId: null,
        nome: "",
        descricao: "",
    });
    const [addPecaState, setAddPecaState] = useState<{ cenarioId: number; pecaId: string; grupo: "ida" | "volta" | "outro" } | null>(null);

    const [importDialog, setImportDialog] = useState<{ open: boolean; texto: string }>({ open: false, texto: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [propostaDialog, setPropostaDialog] = useState<{ open: boolean; titulo: string; validadeData: string }>({
        open: false,
        titulo: "",
        validadeData: "",
    });

    const invalidate = () => {
        utils.cotacoesWorkspace.getFull.invalidate({ id: cotacaoId });
        utils.cotacoesWorkspace.listPropostas.invalidate({ cotacaoId });
    };

    // -------- Mutations --------
    const updateCotacao = trpc.cotacoesWorkspace.update.useMutation({ onSuccess: invalidate });
    const createPeca = trpc.cotacoesWorkspace.createPeca.useMutation({
        onSuccess: () => {
            toast.success("Peça criada");
            invalidate();
            setPecaDialog({ open: false, editingId: null, form: emptyPeca() });
        },
        onError: (e) => toast.error(e.message),
    });
    const updatePeca = trpc.cotacoesWorkspace.updatePeca.useMutation({
        onSuccess: () => {
            toast.success("Peça atualizada");
            invalidate();
            setPecaDialog({ open: false, editingId: null, form: emptyPeca() });
        },
        onError: (e) => toast.error(e.message),
    });
    const deletePeca = trpc.cotacoesWorkspace.deletePeca.useMutation({
        onSuccess: () => { toast.success("Peça removida"); invalidate(); },
    });
    const reorderPecas = trpc.cotacoesWorkspace.reorderPecas.useMutation({ onSuccess: invalidate });

    const createCenario = trpc.cotacoesWorkspace.createCenario.useMutation({
        onSuccess: () => {
            toast.success("Cenário criado");
            invalidate();
            setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" });
        },
    });
    const updateCenario = trpc.cotacoesWorkspace.updateCenario.useMutation({
        onSuccess: () => {
            toast.success("Cenário atualizado");
            invalidate();
            setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" });
        },
    });
    const deleteCenario = trpc.cotacoesWorkspace.deleteCenario.useMutation({
        onSuccess: () => { toast.success("Cenário removido"); invalidate(); },
    });
    const addPecaMut = trpc.cotacoesWorkspace.addPecaToCenario.useMutation({
        onSuccess: () => { invalidate(); setAddPecaState(null); },
        onError: (e) => toast.error(e.message),
    });
    const removePecaMut = trpc.cotacoesWorkspace.removePecaFromCenario.useMutation({ onSuccess: invalidate });
    const reorderCenarioPecasMut = trpc.cotacoesWorkspace.reorderCenarioPecas.useMutation({ onSuccess: invalidate });

    const extractText = trpc.cotacoesWorkspace.extractFromText.useMutation({
        onSuccess: (res) => {
            toast.success(`Extraído via ${res.providerUsado}`);
            setImportDialog({ open: false, texto: "" });
            openPecaFromExtraction(res.peca);
        },
        onError: (e) => toast.error(`Falha na extração: ${e.message}`),
    });
    const extractImage = trpc.cotacoesWorkspace.extractFromImage.useMutation({
        onSuccess: (res) => {
            toast.success(`Extraído via ${res.providerUsado}`);
            setImportDialog({ open: false, texto: "" });
            openPecaFromExtraction(res.peca);
        },
        onError: (e) => toast.error(`Falha na extração: ${e.message}`),
    });

    const generateProposta = trpc.cotacoesWorkspace.generateProposta.useMutation({
        onSuccess: (p) => {
            toast.success("Proposta gerada");
            invalidate();
            setPropostaDialog({ open: false, titulo: "", validadeData: "" });
            setLocation(`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`);
        },
        onError: (e) => toast.error(e.message),
    });
    const deleteProposta = trpc.cotacoesWorkspace.deleteProposta.useMutation({ onSuccess: invalidate });

    // -------- Derivados --------
    const pecasById = useMemo(() => {
        const map = new Map<number, NonNullable<typeof data>["pecas"][number]>();
        data?.pecas.forEach((p) => map.set(p.id, p));
        return map;
    }, [data?.pecas]);

    const temCenarioSelecionado = (data?.cenarios ?? []).some((c) => c.status === "selecionado_proposta");

    // -------- Loading / 404 --------
    if (isLoading) {
        return (
            <AdminLayout>
                <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            </AdminLayout>
        );
    }
    if (!data) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <p className="text-sm text-muted-foreground">Cotação não encontrada.</p>
                    <Link href="/admin/cotacoes" className="text-primary underline text-sm">Voltar</Link>
                </div>
            </AdminLayout>
        );
    }
    const { cotacao, pecas, cenarios } = data;

    // -------- Helpers UI --------
    const openNewPeca = () => setPecaDialog({ open: true, editingId: null, form: emptyPeca() });
    const openEditPeca = (pecaId: number) => {
        const p = pecasById.get(pecaId);
        if (!p) return;
        setPecaDialog({
            open: true,
            editingId: pecaId,
            form: {
                titulo: p.titulo ?? "",
                origem: p.origem ?? "",
                destino: p.destino ?? "",
                dataSaida: toDatetimeLocal(p.dataSaida),
                dataChegada: toDatetimeLocal(p.dataChegada),
                qtdConexoes: p.qtdConexoes ?? 0,
                companhias: p.companhias ?? "",
                bagagem: p.bagagem ?? "",
                classe: p.classe ?? "",
                tipoFinanceiro: (p.tipoFinanceiro as any) ?? "pagante",
                custo: p.custo != null ? Number(p.custo) : "",
                venda: p.venda != null ? Number(p.venda) : "",
                fonte: p.fonte ?? "",
                estrategia: p.estrategia ?? "",
                status: (p.status as any) ?? "pesquisa",
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
            },
        });
    };

    const openPecaFromExtraction = (extracted: any) => {
        setPecaDialog({
            open: true,
            editingId: null,
            form: {
                titulo: extracted.titulo ?? "",
                origem: extracted.origem ?? "",
                destino: extracted.destino ?? "",
                dataSaida: toDatetimeLocal(extracted.dataSaida),
                dataChegada: toDatetimeLocal(extracted.dataChegada),
                qtdConexoes: extracted.qtdConexoes ?? (Array.isArray(extracted.segmentos) ? Math.max(0, extracted.segmentos.length - 1) : 0),
                companhias: extracted.companhias ?? "",
                bagagem: extracted.bagagem ?? "",
                classe: extracted.classe ?? "",
                tipoFinanceiro: "pagante",
                custo: "",
                venda: "",
                fonte: "",
                estrategia: "",
                status: "pesquisa",
                observacoes: extracted.observacoes ?? "",
                segmentos: (extracted.segmentos ?? []).map((s: any, i: number) => ({
                    ordem: s.ordem ?? i,
                    aeroportoOrigem: (s.aeroportoOrigem ?? "").toUpperCase(),
                    aeroportoDestino: (s.aeroportoDestino ?? "").toUpperCase(),
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
            },
        });
    };

    const submitPeca = () => {
        const f = pecaDialog.form;
        const payload = {
            titulo: f.titulo || undefined,
            origem: f.origem || undefined,
            destino: f.destino || undefined,
            dataSaida: f.dataSaida || undefined,
            dataChegada: f.dataChegada || undefined,
            qtdConexoes: Number(f.qtdConexoes) || 0,
            companhias: f.companhias || undefined,
            bagagem: f.bagagem || undefined,
            classe: f.classe || undefined,
            tipoFinanceiro: f.tipoFinanceiro,
            custo: f.custo === "" ? undefined : Number(f.custo),
            venda: f.venda === "" ? undefined : Number(f.venda),
            fonte: f.fonte || undefined,
            estrategia: f.estrategia || undefined,
            status: f.status,
            observacoes: f.observacoes || undefined,
            segmentos: f.segmentos.map((s, i) => ({
                ordem: i,
                aeroportoOrigem: s.aeroportoOrigem || undefined,
                aeroportoDestino: s.aeroportoDestino || undefined,
                cidadeOrigem: s.cidadeOrigem || undefined,
                cidadeDestino: s.cidadeDestino || undefined,
                saida: s.saida || undefined,
                chegada: s.chegada || undefined,
                companhia: s.companhia || undefined,
                numeroVoo: s.numeroVoo || undefined,
                classe: s.classe || undefined,
                bagagem: s.bagagem || undefined,
                duracaoConexaoMinutos: s.duracaoConexaoMinutos === "" ? undefined : Number(s.duracaoConexaoMinutos),
            })),
        };
        if (pecaDialog.editingId) {
            const { segmentos, ...patch } = payload;
            updatePeca.mutate({ id: pecaDialog.editingId, patch: patch as any, segmentos: segmentos as any });
        } else {
            createPeca.mutate({ cotacaoId, ...payload } as any);
        }
    };

    const toggleFavorita = (peca: typeof pecas[number]) => {
        updatePeca.mutate({
            id: peca.id,
            patch: { status: peca.status === "favorita" ? "pesquisa" : "favorita" },
        });
    };

    const submitCenario = () => {
        if (!cenarioDialog.nome.trim()) {
            toast.error("Informe o nome do cenário");
            return;
        }
        if (cenarioDialog.editingId) {
            updateCenario.mutate({
                id: cenarioDialog.editingId,
                patch: { nome: cenarioDialog.nome.trim(), descricao: cenarioDialog.descricao || null },
            });
        } else {
            createCenario.mutate({
                cotacaoId,
                nome: cenarioDialog.nome.trim(),
                descricao: cenarioDialog.descricao || undefined,
            });
        }
    };

    // -------- DnD handlers --------
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const handlePecasDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = pecas.findIndex((p) => p.id === Number(active.id));
        const newIndex = pecas.findIndex((p) => p.id === Number(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        const newOrder = arrayMove(pecas, oldIndex, newIndex).map((p) => p.id);
        reorderPecas.mutate({ orderedIds: newOrder });
    };

    const handleCenarioPecasDragEnd = (cenarioId: number) => (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const c = cenarios.find((x) => x.id === cenarioId);
        if (!c) return;
        const ordered = [...c.pecas].sort((a, b) => a.ordem - b.ordem);
        const oldIndex = ordered.findIndex((cp) => cp.id === Number(active.id));
        const newIndex = ordered.findIndex((cp) => cp.id === Number(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        const reordered = arrayMove(ordered, oldIndex, newIndex).map((cp) => cp.id);
        reorderCenarioPecasMut.mutate({ orderedIds: reordered });
    };

    // -------- Import handlers --------
    const handleImportText = () => {
        if (!importDialog.texto.trim()) {
            toast.error("Cole o texto da cotação primeiro");
            return;
        }
        extractText.mutate({ texto: importDialog.texto });
    };

    const handleImportImage = async (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || "";
            extractImage.mutate({ fileData: base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    };

    // -------- Render --------
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <Link href="/admin/cotacoes" className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" /> Voltar para Cotações
                        </Link>
                        <h1 className="text-2xl font-bold">{cotacao.clienteNome}</h1>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <span>#{cotacao.id}</span>
                            {cotacao.origem || cotacao.destino ? <span>{cotacao.origem || "?"} → {cotacao.destino || "?"}</span> : null}
                            {cotacao.dataIda ? <span>Ida: {new Date(cotacao.dataIda).toLocaleDateString("pt-BR")}</span> : null}
                            {cotacao.dataVolta ? <span>Volta: {new Date(cotacao.dataVolta).toLocaleDateString("pt-BR")}</span> : null}
                            <span>{(cotacao.paxAdultos || 0) + (cotacao.paxCriancas || 0) + (cotacao.paxBebes || 0)} pax</span>
                            {cotacao.clienteTelefone && <span>{cotacao.clienteTelefone}</span>}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="default"
                            disabled={!temCenarioSelecionado}
                            onClick={() => setPropostaDialog({ open: true, titulo: `Proposta — ${cotacao.clienteNome}`, validadeData: "" })}
                            title={!temCenarioSelecionado ? "Selecione ao menos um cenário para proposta" : "Gerar proposta"}
                            className="gap-2"
                        >
                            <FileText className="h-4 w-4" /> Gerar proposta
                        </Button>
                        <Select
                            value={cotacao.status}
                            onValueChange={(v) => updateCotacao.mutate({ id: cotacao.id, patch: { status: v as any } })}
                        >
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(STATUS_COTACAO).map(([k, label]) => (
                                    <SelectItem key={k} value={k}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Propostas geradas */}
                {propostas.length > 0 && (
                    <div className="rounded-lg border bg-card p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Propostas geradas ({propostas.length})</div>
                        <div className="flex flex-wrap gap-2">
                            {propostas.map((p) => (
                                <div key={p.id} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    <Link href={`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`} className="hover:underline">
                                        #{p.id} {p.titulo || ""}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">{p.geradaEm ? new Date(p.geradaEm).toLocaleDateString("pt-BR") : ""}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                                        <Link href={`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`}>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                        if (confirm("Excluir esta proposta?")) deleteProposta.mutate({ id: p.id });
                                    }}>
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid 2 colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Coluna Peças */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Plane className="h-5 w-5 text-primary" /> Peças <span className="text-sm text-muted-foreground font-normal">({pecas.length})</span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setImportDialog({ open: true, texto: "" })} className="gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" /> Importar IA
                                </Button>
                                <Button size="sm" onClick={openNewPeca} className="gap-1.5">
                                    <Plus className="h-4 w-4" /> Nova peça
                                </Button>
                            </div>
                        </div>
                        {pecas.length === 0 && (
                            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                                Nenhuma peça ainda. Cadastre manualmente ou cole um texto/print da cotação no botão "Importar IA".
                            </div>
                        )}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePecasDragEnd}>
                            <SortableContext items={pecas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {pecas.map((p) => {
                                        const lucro = calcLucro(p.custo, p.venda);
                                        return (
                                            <SortableWrapper key={p.id} id={p.id}>
                                                {(handleProps) => (
                                                    <div className="rounded-lg border bg-card p-3 space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <button {...handleProps} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
                                                                <GripVertical className="h-4 w-4" />
                                                            </button>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium truncate flex items-center gap-2">
                                                                    {p.status === "favorita" && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                                                    {p.titulo || `${p.origem || "?"} → ${p.destino || "?"}`}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {p.origem || "?"} → {p.destino || "?"}
                                                                    {p.companhias ? ` · ${p.companhias}` : ""}
                                                                    {p.qtdConexoes > 0 ? ` · ${p.qtdConexoes} conexão${p.qtdConexoes > 1 ? "ões" : ""}` : " · direto"}
                                                                </div>
                                                                {(p.dataSaida || p.dataChegada) && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {p.dataSaida ? new Date(p.dataSaida).toLocaleString("pt-BR") : "?"} → {p.dataChegada ? new Date(p.dataChegada).toLocaleString("pt-BR") : "?"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <Button size="icon" variant="ghost" onClick={() => toggleFavorita(p)}>
                                                                    {p.status === "favorita" ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" onClick={() => openEditPeca(p.id)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" onClick={() => {
                                                                    if (confirm("Remover esta peça? Será desvinculada de todos os cenários.")) deletePeca.mutate({ id: p.id });
                                                                }}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs pl-6">
                                                            <Badge variant="outline" className="capitalize">{p.tipoFinanceiro}</Badge>
                                                            {p.classe && <Badge variant="outline">{p.classe}</Badge>}
                                                            {p.bagagem && <Badge variant="outline">{p.bagagem}</Badge>}
                                                            <div className="ml-auto flex items-center gap-3">
                                                                <span className="text-muted-foreground">Custo: <span className="font-medium text-foreground">{fmtCurrency(p.custo)}</span></span>
                                                                <span className="text-muted-foreground">Venda: <span className="font-medium text-foreground">{fmtCurrency(p.venda)}</span></span>
                                                                {lucro != null && (
                                                                    <span className={`font-semibold ${lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                                                        {fmtCurrency(lucro)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </SortableWrapper>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Coluna Cenários */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" /> Cenários <span className="text-sm text-muted-foreground font-normal">({cenarios.length})</span>
                            </h2>
                            <Button
                                size="sm"
                                onClick={() => setCenarioDialog({ open: true, editingId: null, nome: `Opção ${String.fromCharCode(65 + cenarios.length)}`, descricao: "" })}
                                className="gap-1.5"
                            >
                                <Plus className="h-4 w-4" /> Novo cenário
                            </Button>
                        </div>
                        {cenarios.length === 0 && (
                            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                                Crie cenários para combinar peças e comparar opções.
                            </div>
                        )}
                        <div className="space-y-3">
                            {cenarios.map((c) => {
                                const pecasOrdenadas = [...c.pecas].sort((a, b) => a.ordem - b.ordem);
                                const pecasCenario = pecasOrdenadas
                                    .map((cp) => ({ ...cp, peca: pecasById.get(cp.pecaId) }))
                                    .filter((cp) => cp.peca);
                                const totalCusto = pecasCenario.reduce((acc, cp) => acc + (cp.peca?.custo ? Number(cp.peca.custo) : 0), 0);
                                const totalVenda = pecasCenario.reduce((acc, cp) => acc + (cp.peca?.venda ? Number(cp.peca.venda) : 0), 0);
                                const lucro = totalVenda - totalCusto;
                                const totalConexoes = pecasCenario.reduce((acc, cp) => acc + (cp.peca?.qtdConexoes ?? 0), 0);
                                return (
                                    <div key={c.id} className="rounded-lg border bg-card p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {c.nome}
                                                    {c.status === "selecionado_proposta" && <Badge>Proposta</Badge>}
                                                </div>
                                                {c.descricao && <div className="text-xs text-muted-foreground">{c.descricao}</div>}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant={c.status === "selecionado_proposta" ? "default" : "outline"}
                                                    onClick={() =>
                                                        updateCenario.mutate({
                                                            id: c.id,
                                                            patch: { status: c.status === "selecionado_proposta" ? "rascunho" : "selecionado_proposta" },
                                                        })
                                                    }
                                                >
                                                    {c.status === "selecionado_proposta" ? "Remover da proposta" : "Selecionar p/ proposta"}
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setCenarioDialog({ open: true, editingId: c.id, nome: c.nome, descricao: c.descricao ?? "" })}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => {
                                                    if (confirm("Remover este cenário?")) deleteCenario.mutate({ id: c.id });
                                                }}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Peças do cenário (sortable) */}
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCenarioPecasDragEnd(c.id)}>
                                            <SortableContext items={pecasOrdenadas.map((cp) => cp.id)} strategy={verticalListSortingStrategy}>
                                                <div className="space-y-1.5">
                                                    {pecasCenario.length === 0 && (
                                                        <div className="text-xs text-muted-foreground italic">Nenhuma peça neste cenário ainda.</div>
                                                    )}
                                                    {pecasCenario.map((cp) => (
                                                        <SortableWrapper key={cp.id} id={cp.id}>
                                                            {(handleProps) => (
                                                                <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm">
                                                                    <button {...handleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
                                                                        <GripVertical className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <Badge variant="outline" className="text-[10px] uppercase">{cp.grupo}</Badge>
                                                                    <div className="flex-1 min-w-0 truncate">
                                                                        {cp.peca!.titulo || `${cp.peca!.origem || "?"} → ${cp.peca!.destino || "?"}`}
                                                                        <span className="text-xs text-muted-foreground ml-1">
                                                                            {cp.peca!.companhias ? `· ${cp.peca!.companhias}` : ""}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">{fmtCurrency(cp.peca!.venda)}</span>
                                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removePecaMut.mutate({ id: cp.id })}>
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </SortableWrapper>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>

                                        {/* Adicionar peça */}
                                        {addPecaState?.cenarioId === c.id ? (
                                            <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-2">
                                                <div className="flex-1 min-w-[180px]">
                                                    <Label className="text-xs">Peça</Label>
                                                    <Select value={addPecaState.pecaId} onValueChange={(v) => setAddPecaState({ ...addPecaState, pecaId: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                        <SelectContent>
                                                            {pecas.map((p) => (
                                                                <SelectItem key={p.id} value={String(p.id)}>
                                                                    {p.titulo || `${p.origem || "?"} → ${p.destino || "?"}`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-32">
                                                    <Label className="text-xs">Grupo</Label>
                                                    <Select value={addPecaState.grupo} onValueChange={(v) => setAddPecaState({ ...addPecaState, grupo: v as any })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ida">Ida</SelectItem>
                                                            <SelectItem value="volta">Volta</SelectItem>
                                                            <SelectItem value="outro">Outro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button size="sm" onClick={() => {
                                                    if (!addPecaState.pecaId) return;
                                                    addPecaMut.mutate({
                                                        cenarioId: c.id,
                                                        pecaId: Number(addPecaState.pecaId),
                                                        grupo: addPecaState.grupo,
                                                        ordem: pecasCenario.length,
                                                    });
                                                }}>
                                                    Adicionar
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setAddPecaState(null)}>Cancelar</Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddPecaState({ cenarioId: c.id, pecaId: "", grupo: "outro" })}>
                                                <Plus className="h-3.5 w-3.5" /> Adicionar peça
                                            </Button>
                                        )}

                                        {/* Totais */}
                                        {pecasCenario.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs">
                                                <span className="text-muted-foreground">Custo: <span className="font-medium text-foreground">{fmtCurrency(totalCusto)}</span></span>
                                                <span className="text-muted-foreground">Venda: <span className="font-medium text-foreground">{fmtCurrency(totalVenda)}</span></span>
                                                <span className={`font-semibold ${lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>Lucro: {fmtCurrency(lucro)}</span>
                                                <span className="text-muted-foreground">Conexões: {totalConexoes}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog Peça */}
            <Dialog open={pecaDialog.open} onOpenChange={(o) => !o && setPecaDialog({ open: false, editingId: null, form: emptyPeca() })}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{pecaDialog.editingId ? "Editar peça" : "Nova peça"}</DialogTitle>
                        <DialogDescription>Bloco indivisível de voos. Pode conter múltiplos segmentos internos.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div>
                            <h3 className="text-sm font-semibold mb-2">Resumo operacional</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <Label>Título (apelido)</Label>
                                    <Input value={pecaDialog.form.titulo} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, titulo: e.target.value } })} placeholder="Ex: MGF→LIS Gol Smiles" />
                                </div>
                                <div><Label>Origem</Label><Input value={pecaDialog.form.origem} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, origem: e.target.value } })} /></div>
                                <div><Label>Destino</Label><Input value={pecaDialog.form.destino} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, destino: e.target.value } })} /></div>
                                <div><Label>Saída</Label><Input type="datetime-local" value={pecaDialog.form.dataSaida} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, dataSaida: e.target.value } })} /></div>
                                <div><Label>Chegada</Label><Input type="datetime-local" value={pecaDialog.form.dataChegada} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, dataChegada: e.target.value } })} /></div>
                                <div><Label>Companhias</Label><Input value={pecaDialog.form.companhias} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, companhias: e.target.value } })} placeholder="Gol, TAP..." /></div>
                                <div><Label>Conexões</Label><Input type="number" min={0} value={pecaDialog.form.qtdConexoes} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, qtdConexoes: Number(e.target.value) } })} /></div>
                                <div><Label>Classe</Label><Input value={pecaDialog.form.classe} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, classe: e.target.value } })} placeholder="Econômica, Executiva..." /></div>
                                <div><Label>Bagagem</Label><Input value={pecaDialog.form.bagagem} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, bagagem: e.target.value } })} placeholder="23kg + 10kg" /></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">Financeiro (interno, não aparece na proposta)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <Label>Tipo</Label>
                                    <Select value={pecaDialog.form.tipoFinanceiro} onValueChange={(v) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, tipoFinanceiro: v as any } })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pagante">Pagante</SelectItem>
                                            <SelectItem value="milhas">Milhas</SelectItem>
                                            <SelectItem value="misto">Misto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={pecaDialog.form.custo} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, custo: e.target.value === "" ? "" : Number(e.target.value) } })} /></div>
                                <div><Label>Venda (R$)</Label><Input type="number" step="0.01" value={pecaDialog.form.venda} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, venda: e.target.value === "" ? "" : Number(e.target.value) } })} /></div>
                                <div><Label>Fonte</Label><Input value={pecaDialog.form.fonte} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, fonte: e.target.value } })} placeholder="Smiles, Latam Pass..." /></div>
                                <div className="sm:col-span-2"><Label>Estratégia</Label><Input value={pecaDialog.form.estrategia} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, estrategia: e.target.value } })} placeholder="Emitir com cartão X, transferir Y milhas..." /></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">Segmentos internos ({pecaDialog.form.segmentos.length})</h3>
                                <Button size="sm" variant="outline" onClick={() => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: [...pecaDialog.form.segmentos, emptySegmento(pecaDialog.form.segmentos.length)] } })}>
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar segmento
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {pecaDialog.form.segmentos.map((s, idx) => (
                                    <div key={idx} className="rounded-md border p-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-muted-foreground">Segmento {idx + 1}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: pecaDialog.form.segmentos.filter((_, i) => i !== idx) } })}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <Input placeholder="De (IATA)" value={s.aeroportoOrigem} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, aeroportoOrigem: e.target.value.toUpperCase() }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input placeholder="Para (IATA)" value={s.aeroportoDestino} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, aeroportoDestino: e.target.value.toUpperCase() }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input placeholder="Cia" value={s.companhia} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, companhia: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input placeholder="Voo" value={s.numeroVoo} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, numeroVoo: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input type="datetime-local" value={s.saida} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, saida: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input type="datetime-local" value={s.chegada} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, chegada: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input placeholder="Classe" value={s.classe} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, classe: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                            <Input placeholder="Bagagem" value={s.bagagem} onChange={(e) => { const segs = [...pecaDialog.form.segmentos]; segs[idx] = { ...s, bagagem: e.target.value }; setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, segmentos: segs } }); }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Observações</Label>
                            <Textarea rows={2} value={pecaDialog.form.observacoes} onChange={(e) => setPecaDialog({ ...pecaDialog, form: { ...pecaDialog.form, observacoes: e.target.value } })} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPecaDialog({ open: false, editingId: null, form: emptyPeca() })}>Cancelar</Button>
                        <Button onClick={submitPeca} disabled={createPeca.isPending || updatePeca.isPending}>
                            {pecaDialog.editingId ? "Salvar alterações" : "Criar peça"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Cenario */}
            <Dialog open={cenarioDialog.open} onOpenChange={(o) => !o && setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{cenarioDialog.editingId ? "Editar cenário" : "Novo cenário"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div><Label>Nome</Label><Input value={cenarioDialog.nome} onChange={(e) => setCenarioDialog({ ...cenarioDialog, nome: e.target.value })} autoFocus /></div>
                        <div><Label>Descrição</Label><Textarea rows={3} value={cenarioDialog.descricao} onChange={(e) => setCenarioDialog({ ...cenarioDialog, descricao: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" })}>Cancelar</Button>
                        <Button onClick={submitCenario} disabled={createCenario.isPending || updateCenario.isPending}>
                            {cenarioDialog.editingId ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Import IA */}
            <Dialog open={importDialog.open} onOpenChange={(o) => !o && setImportDialog({ open: false, texto: "" })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Importar com IA</DialogTitle>
                        <DialogDescription>Cole um texto ou envie um print da cotação. A IA extrai os dados; você revisa antes de salvar.</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="texto">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="texto"><FileText className="h-4 w-4 mr-1" /> Texto</TabsTrigger>
                            <TabsTrigger value="print"><ImageIcon className="h-4 w-4 mr-1" /> Print</TabsTrigger>
                        </TabsList>
                        <TabsContent value="texto" className="space-y-3 pt-3">
                            <Textarea
                                rows={10}
                                value={importDialog.texto}
                                onChange={(e) => setImportDialog({ ...importDialog, texto: e.target.value })}
                                placeholder="Cole aqui o texto da cotação (Smiles, Latam Pass, Decolar, e-mail...)"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setImportDialog({ open: false, texto: "" })}>Cancelar</Button>
                                <Button onClick={handleImportText} disabled={extractText.isPending} className="gap-2">
                                    {extractText.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Extraindo...</> : <><Sparkles className="h-4 w-4" /> Extrair</>}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="print" className="space-y-3 pt-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                aria-label="Enviar print da cotação"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleImportImage(f);
                                    e.target.value = "";
                                }}
                            />
                            <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-3">
                                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                                <div className="text-sm text-muted-foreground">PNG, JPG, WEBP ou GIF</div>
                                <Button onClick={() => fileInputRef.current?.click()} disabled={extractImage.isPending} className="gap-2">
                                    {extractImage.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Extraindo...</> : <><Upload className="h-4 w-4" /> Escolher imagem</>}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Dialog Gerar Proposta */}
            <Dialog open={propostaDialog.open} onOpenChange={(o) => !o && setPropostaDialog({ open: false, titulo: "", validadeData: "" })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerar proposta</DialogTitle>
                        <DialogDescription>Cria um snapshot cliente-safe dos cenários marcados. Custo, fonte e estratégia internos ficam ocultos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Título (opcional)</Label>
                            <Input value={propostaDialog.titulo} onChange={(e) => setPropostaDialog({ ...propostaDialog, titulo: e.target.value })} />
                        </div>
                        <div>
                            <Label>Validade (opcional)</Label>
                            <Input type="date" value={propostaDialog.validadeData} onChange={(e) => setPropostaDialog({ ...propostaDialog, validadeData: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPropostaDialog({ open: false, titulo: "", validadeData: "" })}>Cancelar</Button>
                        <Button
                            onClick={() => generateProposta.mutate({
                                cotacaoId,
                                titulo: propostaDialog.titulo || undefined,
                                validadeData: propostaDialog.validadeData || undefined,
                            })}
                            disabled={generateProposta.isPending}
                        >
                            {generateProposta.isPending ? "Gerando..." : "Gerar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
