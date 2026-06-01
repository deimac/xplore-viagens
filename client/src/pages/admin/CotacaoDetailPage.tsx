import { useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { toast } from "sonner";
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    rectIntersection,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ExternalLink, Trash2 } from "lucide-react";

import { WorkspaceHeader } from "@/components/cotacoes/WorkspaceHeader";
import { PecaLibrary } from "@/components/cotacoes/PecaLibrary";
import { CenariosMesa } from "@/components/cotacoes/CenariosMesa";
import { ComparadorBar } from "@/components/cotacoes/ComparadorBar";
import { CenarioDialog } from "@/components/cotacoes/CenarioDialog";
import { ImportIaDialog } from "@/components/cotacoes/ImportIaDialog";
import { PropostaDialog } from "@/components/cotacoes/PropostaDialog";
import {
    PecaSheet,
    emptyPeca,
    extractedToPecaForm,
    pecaFormToPayload,
    pecaToForm,
    type PecaForm,
} from "@/components/cotacoes/PecaSheet";
import { PecaCard } from "@/components/cotacoes/PecaCard";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";
import type { CenarioCompleto, PecaCompleta } from "@/components/cotacoes/types";

type DeleteTarget =
    | { type: "peca-library"; peca: PecaCompleta }
    | { type: "peca-cenario"; linkId: number; label: string; cenarioNome: string }
    | { type: "cenario"; cenario: CenarioCompleto }
    | { type: "proposta"; id: number; titulo: string };

interface CotacaoEditState {
    open: boolean;
    clienteNome: string;
    clienteEmail: string;
    clienteTelefone: string;
    origem: string;
    destino: string;
    dataIda: string;
    dataVolta: string;
    paxAdultos: number;
    paxCriancas: number;
    paxBebes: number;
    observacoes: string;
}

function emptyCotacaoEdit(): CotacaoEditState {
    return {
        open: false,
        clienteNome: "",
        clienteEmail: "",
        clienteTelefone: "",
        origem: "",
        destino: "",
        dataIda: "",
        dataVolta: "",
        paxAdultos: 1,
        paxCriancas: 0,
        paxBebes: 0,
        observacoes: "",
    };
}

function dateOnly(value: Date | string | null | undefined): string {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export default function CotacaoDetailPage() {
    const params = useParams<{ id: string }>();
    const cotacaoId = Number(params.id);
    const [, setLocation] = useLocation();

    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.cotacoesWorkspace.getFull.useQuery({ id: cotacaoId });
    const { data: propostas = [] } = trpc.cotacoesWorkspace.listPropostas.useQuery({ cotacaoId });

    // -------- Estados de UI --------
    const [pecaSheet, setPecaSheet] = useState<{
        open: boolean;
        editingId: number | null;
        initialForm: PecaForm;
    }>({ open: false, editingId: null, initialForm: emptyPeca() });

    const [cenarioDialog, setCenarioDialog] = useState<{
        open: boolean;
        editingId: number | null;
        nome: string;
        descricao: string;
    }>({ open: false, editingId: null, nome: "", descricao: "" });

    const [importOpen, setImportOpen] = useState(false);
    const [importTarget, setImportTarget] = useState<"ida" | "volta">("ida");
    const [propostaOpen, setPropostaOpen] = useState(false);
    const [cotacaoEdit, setCotacaoEdit] = useState<CotacaoEditState>(emptyCotacaoEdit);
    const [activeDragPecaId, setActiveDragPecaId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    const closeDeleteDialog = () => setDeleteTarget(null);

    const invalidate = () => {
        utils.cotacoesWorkspace.getFull.invalidate({ id: cotacaoId });
        utils.cotacoesWorkspace.listPropostas.invalidate({ cotacaoId });
    };

    // -------- Mutations --------
    const updateCotacao = trpc.cotacoesWorkspace.update.useMutation({
        onSuccess: () => {
            toast.success("Cotação atualizada");
            invalidate();
            setCotacaoEdit((s) => ({ ...s, open: false }));
        },
        onError: (e) => toast.error(e.message),
    });
    const createPeca = trpc.cotacoesWorkspace.createPeca.useMutation({
        onSuccess: () => {
            toast.success("Peça criada");
            invalidate();
            setPecaSheet({ open: false, editingId: null, initialForm: emptyPeca() });
        },
        onError: (e) => toast.error(e.message),
    });
    const updatePeca = trpc.cotacoesWorkspace.updatePeca.useMutation({
        onSuccess: () => {
            toast.success("Peça atualizada");
            invalidate();
            setPecaSheet({ open: false, editingId: null, initialForm: emptyPeca() });
        },
        onError: (e) => toast.error(e.message),
    });
    const deletePeca = trpc.cotacoesWorkspace.deletePeca.useMutation({
        onSuccess: () => {
            toast.success("Peça excluída");
            invalidate();
            closeDeleteDialog();
        },
        onError: (e) => toast.error(e.message),
    });
    const reorderPecas = trpc.cotacoesWorkspace.reorderPecas.useMutation({ onSuccess: invalidate });

    const createCenario = trpc.cotacoesWorkspace.createCenario.useMutation({
        onSuccess: () => {
            toast.success("Cenário criado");
            invalidate();
            setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" });
        },
    });
    const createCenarioAsync = trpc.cotacoesWorkspace.createCenario.useMutation();
    const updateCenario = trpc.cotacoesWorkspace.updateCenario.useMutation({
        onSuccess: () => {
            invalidate();
            setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" });
        },
    });
    const deleteCenario = trpc.cotacoesWorkspace.deleteCenario.useMutation({
        onSuccess: () => {
            toast.success("Cenário excluído");
            invalidate();
            closeDeleteDialog();
        },
        onError: (e) => toast.error(e.message),
    });
    const addPecaMut = trpc.cotacoesWorkspace.addPecaToCenario.useMutation({
        onSuccess: invalidate,
        onError: (e) => toast.error(e.message),
    });
    const removePecaMut = trpc.cotacoesWorkspace.removePecaFromCenario.useMutation({
        onSuccess: () => {
            toast.success("Peça removida do cenário");
            invalidate();
            closeDeleteDialog();
        },
        onError: (e) => toast.error(e.message),
    });
    const reorderCenarioPecasMut = trpc.cotacoesWorkspace.reorderCenarioPecas.useMutation({
        onSuccess: invalidate,
    });

    const extractText = trpc.cotacoesWorkspace.extractFromText.useMutation({
        onSuccess: (res) => {
            toast.success(`Extraído via ${res.providerUsado}`);
            setImportOpen(false);
            openPecaFromExtraction(res.peca);
        },
        onError: (e) => toast.error(`Falha na extração: ${e.message}`),
    });
    const extractImage = trpc.cotacoesWorkspace.extractFromImage.useMutation({
        onSuccess: (res) => {
            toast.success(`Extraído via ${res.providerUsado}`);
            setImportOpen(false);
            openPecaFromExtraction(res.peca);
        },
        onError: (e) => toast.error(`Falha na extração: ${e.message}`),
    });

    const generateProposta = trpc.cotacoesWorkspace.generateProposta.useMutation({
        onSuccess: (p) => {
            toast.success("Proposta gerada");
            invalidate();
            setPropostaOpen(false);
            setLocation(`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`);
        },
        onError: (e) => toast.error(e.message),
    });
    const deleteProposta = trpc.cotacoesWorkspace.deleteProposta.useMutation({
        onSuccess: () => {
            toast.success("Proposta excluída");
            invalidate();
            closeDeleteDialog();
        },
        onError: (e) => toast.error(e.message),
    });

    // -------- Derivados --------
    const pecasById = useMemo(() => {
        const map = new Map<number, PecaCompleta>();
        data?.pecas.forEach((p) => map.set(p.id, p));
        return map;
    }, [data?.pecas]);

    const cenariosSelecionados = useMemo(
        () => (data?.cenarios ?? []).filter((c) => c.status === "selecionado_proposta"),
        [data?.cenarios]
    );

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    // -------- Handlers --------
    const openNewPeca = () => setPecaSheet({ open: true, editingId: null, initialForm: emptyPeca() });

    const openEditPeca = (peca: PecaCompleta) =>
        setPecaSheet({ open: true, editingId: peca.id, initialForm: pecaToForm(peca) });

    const openPecaFromExtraction = (extracted: Record<string, unknown>) => {
        if (pecaSheet.open) {
            const merged = extractedToPecaForm(extracted, importTarget, pecaSheet.initialForm);
            setPecaSheet({
                open: true,
                editingId: pecaSheet.editingId,
                initialForm: merged,
            });
            return;
        }

        setPecaSheet({
            open: true,
            editingId: null,
            initialForm: extractedToPecaForm(extracted, "ida"),
        });
        setImportTarget("ida");
    };

    const submitPeca = (form: PecaForm) => {
        const dt = pecaFormToPayload(form);
        const payload = {
            titulo: form.titulo || undefined,
            temVolta: form.temVolta,
            origem: form.resumoIda.origem || undefined,
            destino: form.resumoIda.destino || undefined,
            dataSaida: dt.dataSaida || undefined,
            dataChegada: dt.dataChegada || undefined,
            qtdConexoes: Number(form.resumoIda.qtdConexoes) || 0,
            companhias: form.resumoIda.companhias || undefined,
            classe: form.resumoIda.classe || undefined,
            origemVolta: form.temVolta ? form.resumoVolta.origem || undefined : null,
            destinoVolta: form.temVolta ? form.resumoVolta.destino || undefined : null,
            dataSaidaVolta: form.temVolta ? dt.dataSaidaVolta || undefined : null,
            dataChegadaVolta: form.temVolta ? dt.dataChegadaVolta || undefined : null,
            qtdConexoesVolta: form.temVolta ? Number(form.resumoVolta.qtdConexoes) || 0 : 0,
            companhiasVolta: form.temVolta ? form.resumoVolta.companhias || undefined : null,
            classeVolta: form.temVolta ? form.resumoVolta.classe || undefined : null,
            itemPessoal: form.itemPessoal,
            bagagemMao: form.bagagemMao,
            bagagemDespachada: form.bagagemDespachada,
            tipoFinanceiro: form.tipoFinanceiro,
            custo: form.custo === "" ? undefined : Number(form.custo),
            venda: form.venda === "" ? undefined : Number(form.venda),
            fonte: form.fonte || undefined,
            estrategia: form.estrategia || undefined,
            status: form.status,
            observacoes: form.observacoes || undefined,
            segmentos: dt.segmentos.map((s) => ({
                direcao: s.direcao,
                ordem: s.ordem,
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
                duracaoConexaoMinutos:
                    s.duracaoConexaoMinutos === "" ? undefined : Number(s.duracaoConexaoMinutos),
            })),
        };
        if (pecaSheet.editingId) {
            const { segmentos, ...patch } = payload;
            updatePeca.mutate({
                id: pecaSheet.editingId,
                patch: patch as any,
                segmentos: segmentos as any,
            });
        } else {
            createPeca.mutate({ cotacaoId, ...payload } as any);
        }
    };

    const handleToggleFavorita = (peca: PecaCompleta) => {
        updatePeca.mutate({
            id: peca.id,
            patch: { status: peca.status === "favorita" ? "pesquisa" : "favorita" },
        });
    };

    const handleDeletePeca = (peca: PecaCompleta) => {
        setDeleteTarget({
            type: "peca-library",
            peca,
        });
    };

    const handleRemovePecaFromCenario = (cenarioId: number, linkId: number) => {
        const cenario = data?.cenarios.find((c) => c.id === cenarioId);
        const link = cenario?.pecas.find((l) => l.id === linkId);
        const peca = link ? pecasById.get(link.pecaId) : undefined;
        const label = peca?.titulo || `${peca?.origem ?? "?"}→${peca?.destino ?? "?"}`;
        setDeleteTarget({
            type: "peca-cenario",
            linkId,
            label,
            cenarioNome: cenario?.nome ?? "cenário",
        });
    };

    const handleDeleteCenario = (c: CenarioCompleto) => {
        setDeleteTarget({ type: "cenario", cenario: c });
    };

    const handleDeleteProposta = (id: number, titulo: string) => {
        setDeleteTarget({ type: "proposta", id, titulo });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        switch (deleteTarget.type) {
            case "peca-library":
                deletePeca.mutate({ id: deleteTarget.peca.id });
                break;
            case "peca-cenario":
                removePecaMut.mutate({ id: deleteTarget.linkId });
                break;
            case "cenario":
                deleteCenario.mutate({ id: deleteTarget.cenario.id });
                break;
            case "proposta":
                deleteProposta.mutate({ id: deleteTarget.id });
                break;
        }
    };

    const deleteDialogProps = (() => {
        if (!deleteTarget) return null;
        switch (deleteTarget.type) {
            case "peca-library": {
                const nome =
                    deleteTarget.peca.titulo ||
                    `${deleteTarget.peca.origem ?? "?"}→${deleteTarget.peca.destino ?? "?"}`;
                return {
                    title: "Excluir peça",
                    description: `Excluir "${nome}"? A peça será removida da biblioteca e desvinculada de todos os cenários.`,
                };
            }
            case "peca-cenario":
                return {
                    title: "Remover peça do cenário",
                    description: `Remover "${deleteTarget.label}" do cenário "${deleteTarget.cenarioNome}"? A peça continuará na biblioteca.`,
                };
            case "cenario":
                return {
                    title: "Excluir cenário",
                    description: `Excluir o cenário "${deleteTarget.cenario.nome}"? Os vínculos com peças serão removidos.`,
                };
            case "proposta":
                return {
                    title: "Excluir proposta",
                    description: `Excluir a proposta "${deleteTarget.titulo}"? Esta ação não pode ser desfeita.`,
                };
        }
    })();

    const isDeleting =
        deletePeca.isPending ||
        removePecaMut.isPending ||
        deleteCenario.isPending ||
        deleteProposta.isPending;

    const handleAddPecaToCenario = (peca: PecaCompleta, cenarioId: number) => {
        if (!data) return;
        const cenario = data.cenarios.find((c) => c.id === cenarioId);
        if (!cenario) return;
        if (cenario.pecas.some((l) => l.pecaId === peca.id)) {
            toast.info("Esta peça já está no cenário");
            return;
        }
        addPecaMut.mutate({
            cenarioId,
            pecaId: peca.id,
            grupo: "outro",
            ordem: cenario.pecas.length,
        });
        toast.success(`Adicionada em "${cenario.nome}"`);
    };

    const handleCreateCenarioWithPeca = async (peca: PecaCompleta) => {
        if (!data) return;
        const proxLetra = String.fromCharCode(65 + data.cenarios.length);
        try {
            const novo = await createCenarioAsync.mutateAsync({
                cotacaoId,
                nome: `Opção ${proxLetra}`,
            });
            await addPecaMut.mutateAsync({
                cenarioId: novo.id,
                pecaId: peca.id,
                grupo: "outro",
                ordem: 0,
            });
            toast.success(`Cenário "Opção ${proxLetra}" criado com a peça`);
            invalidate();
        } catch (e: any) {
            toast.error(e?.message ?? "Falha ao criar cenário");
        }
    };

    const handleNewCenario = () => {
        const proxLetra = String.fromCharCode(65 + (data?.cenarios.length ?? 0));
        setCenarioDialog({ open: true, editingId: null, nome: `Opção ${proxLetra}`, descricao: "" });
    };

    const handleEditCenario = (c: CenarioCompleto) =>
        setCenarioDialog({ open: true, editingId: c.id, nome: c.nome, descricao: c.descricao ?? "" });

    const handleToggleSelecionado = (c: CenarioCompleto) =>
        updateCenario.mutate({
            id: c.id,
            patch: {
                status: c.status === "selecionado_proposta" ? "rascunho" : "selecionado_proposta",
            },
        });

    const submitCenario = (nome: string, descricao: string) => {
        if (!nome) {
            toast.error("Informe o nome do cenário");
            return;
        }
        if (cenarioDialog.editingId) {
            updateCenario.mutate({
                id: cenarioDialog.editingId,
                patch: { nome, descricao: descricao || null },
            });
        } else {
            createCenario.mutate({ cotacaoId, nome, descricao: descricao || undefined });
        }
    };

    const handleImportText = (texto: string) => {
        if (!texto.trim()) {
            toast.error("Cole o texto da cotação primeiro");
            return;
        }
        extractText.mutate({ texto, target: importTarget });
    };
    const handleImportImage = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] || "";
            extractImage.mutate({ fileData: base64, mimeType: file.type, target: importTarget });
        };
        reader.readAsDataURL(file);
    };

    const openEditCotacao = () => {
        if (!data) return;
        const c = data.cotacao;
        setCotacaoEdit({
            open: true,
            clienteNome: c.clienteNome,
            clienteEmail: c.clienteEmail ?? "",
            clienteTelefone: c.clienteTelefone ?? "",
            origem: c.origem ?? "",
            destino: c.destino ?? "",
            dataIda: dateOnly(c.dataIda),
            dataVolta: dateOnly(c.dataVolta),
            paxAdultos: c.paxAdultos,
            paxCriancas: c.paxCriancas,
            paxBebes: c.paxBebes,
            observacoes: c.observacoes ?? "",
        });
    };

    // -------- DnD --------
    const handleDragStart = (e: DragStartEvent) => {
        const idStr = String(e.active.id);
        if (idStr.startsWith("peca-")) {
            setActiveDragPecaId(Number(idStr.replace("peca-", "")));
        }
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveDragPecaId(null);
        const { active, over } = e;
        if (!over || !data) return;

        const activeData = active.data.current as { kind?: string; pecaId?: number; cenarioId?: number; linkId?: number } | undefined;
        const overData = over.data.current as { kind?: string; cenarioId?: number } | undefined;
        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);
        if (activeIdStr === overIdStr) return;

        const kind = activeData?.kind;

        // Reorder dentro da biblioteca
        if (kind === "peca-library" && overIdStr.startsWith("peca-")) {
            const pecas = data.pecas;
            const oldIndex = pecas.findIndex((p) => `peca-${p.id}` === activeIdStr);
            const newIndex = pecas.findIndex((p) => `peca-${p.id}` === overIdStr);
            if (oldIndex < 0 || newIndex < 0) return;
            const newOrder = arrayMove(pecas, oldIndex, newIndex).map((p) => p.id);
            reorderPecas.mutate({ orderedIds: newOrder });
            return;
        }

        // Da biblioteca para um cenário (drop sobre painel ou bloco existente)
        if (kind === "peca-library") {
            const pecaId = activeData?.pecaId;
            if (pecaId == null) return;
            let targetCenarioId: number | undefined;
            let targetOrdem: number | undefined;
            if (overIdStr.startsWith("cenario-")) {
                targetCenarioId = Number(overIdStr.replace("cenario-", ""));
            } else if (overIdStr.startsWith("link-")) {
                targetCenarioId = overData?.cenarioId;
                const cenario = data.cenarios.find((c) => c.id === targetCenarioId);
                if (cenario) {
                    const ordered = [...cenario.pecas].sort((a, b) => a.ordem - b.ordem);
                    const overLinkId = Number(overIdStr.replace("link-", ""));
                    const idx = ordered.findIndex((l) => l.id === overLinkId);
                    if (idx >= 0) targetOrdem = idx;
                }
            }
            if (targetCenarioId == null) return;
            const cenario = data.cenarios.find((c) => c.id === targetCenarioId);
            if (cenario?.pecas.some((l) => l.pecaId === pecaId)) {
                toast.info("Esta peça já está no cenário");
                return;
            }
            addPecaMut.mutate({
                cenarioId: targetCenarioId,
                pecaId,
                grupo: "outro",
                ordem: targetOrdem ?? cenario?.pecas.length ?? 0,
            });
            return;
        }

        // Reorder dentro de um cenário
        if (kind === "cenario-link") {
            const cenarioId = activeData?.cenarioId;
            if (cenarioId == null) return;
            // só reorder dentro do mesmo cenário
            if (!overIdStr.startsWith("link-") || overData?.cenarioId !== cenarioId) return;
            const cenario = data.cenarios.find((c) => c.id === cenarioId);
            if (!cenario) return;
            const ordered = [...cenario.pecas].sort((a, b) => a.ordem - b.ordem);
            const activeLinkId = Number(activeIdStr.replace("link-", ""));
            const overLinkId = Number(overIdStr.replace("link-", ""));
            const oldIndex = ordered.findIndex((l) => l.id === activeLinkId);
            const newIndex = ordered.findIndex((l) => l.id === overLinkId);
            if (oldIndex < 0 || newIndex < 0) return;
            const reordered = arrayMove(ordered, oldIndex, newIndex).map((l) => l.id);
            reorderCenarioPecasMut.mutate({ orderedIds: reordered });
        }
    };

    // -------- Loading / 404 --------
    if (isLoading) {
        return (
            <AdminLayout>
                <div className="p-6 text-sm text-muted-foreground">Carregando workspace...</div>
            </AdminLayout>
        );
    }
    if (!data) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <p className="text-sm text-muted-foreground">Cotação não encontrada.</p>
                    <Link href="/admin/cotacoes" className="text-primary underline text-sm">
                        Voltar
                    </Link>
                </div>
            </AdminLayout>
        );
    }
    const { cotacao, pecas, cenarios } = data;
    const activeDragPeca = activeDragPecaId != null ? pecasById.get(activeDragPecaId) : null;

    return (
        <AdminLayout>
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col h-[calc(100vh-1px)] -m-6">
                    <WorkspaceHeader
                        cotacao={cotacao}
                        pecasCount={pecas.length}
                        cenariosCount={cenarios.length}
                        selecionadosCount={cenariosSelecionados.length}
                        onChangeStatus={(status) => updateCotacao.mutate({ id: cotacao.id, patch: { status } })}
                        onNewPeca={openNewPeca}
                        onImportIa={() => setImportOpen(true)}
                        onNewCenario={handleNewCenario}
                        onGenerateProposta={() => setPropostaOpen(true)}
                        onEditCotacao={openEditCotacao}
                    />

                    {propostas.length > 0 && (
                        <div className="border-b bg-violet-50/40 px-4 py-2 flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-medium text-violet-900 uppercase tracking-wide">
                                Propostas geradas:
                            </span>
                            {propostas.map((p) => (
                                <div
                                    key={p.id}
                                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5"
                                >
                                    <FileText className="h-3 w-3 text-violet-700" />
                                    <Link
                                        href={`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`}
                                        className="hover:underline font-medium"
                                    >
                                        #{p.id} {p.titulo || "(sem título)"}
                                    </Link>
                                    <span className="text-muted-foreground">
                                        {p.geradaEm ? new Date(p.geradaEm).toLocaleDateString("pt-BR") : ""}
                                    </span>
                                    <Link
                                        href={`/admin/cotacoes/${cotacaoId}/proposta/${p.id}`}
                                        className="text-violet-600 hover:text-violet-900"
                                        title="Abrir proposta"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <button
                                        type="button"
                                        title="Excluir proposta"
                                        onClick={() =>
                                            handleDeleteProposta(p.id, p.titulo || `#${p.id}`)
                                        }
                                        className="text-rose-500 hover:text-rose-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 min-h-0 flex">
                        <div className="w-[340px] shrink-0 h-full">
                            <PecaLibrary
                                pecas={pecas}
                                cenarios={cenarios}
                                onNewPeca={openNewPeca}
                                onImportIa={() => setImportOpen(true)}
                                onToggleFavorita={handleToggleFavorita}
                                onEditPeca={openEditPeca}
                                onDeletePeca={handleDeletePeca}
                                onAddPecaToCenario={handleAddPecaToCenario}
                                onCreateCenarioWithPeca={handleCreateCenarioWithPeca}
                            />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col bg-muted/20">
                            <CenariosMesa
                                cenarios={cenarios}
                                pecasById={pecasById}
                                onNewCenario={handleNewCenario}
                                onEditCenario={handleEditCenario}
                                onDeleteCenario={handleDeleteCenario}
                                onToggleSelecionado={handleToggleSelecionado}
                                onRemoveLink={handleRemovePecaFromCenario}
                                onClickPeca={openEditPeca}
                            />
                            <ComparadorBar cenarios={cenarios} pecasById={pecasById} />
                        </div>
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDragPeca ? (
                        <div className="opacity-90 shadow-xl pointer-events-none rotate-1">
                            <PecaCard
                                peca={activeDragPeca}
                                usadaEmCenarios={0}
                                onToggleFavorita={() => { }}
                                onEdit={() => { }}
                                onDelete={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <PecaSheet
                open={pecaSheet.open}
                onOpenChange={(o) =>
                    !o && setPecaSheet({ open: false, editingId: null, initialForm: emptyPeca() })
                }
                editingId={pecaSheet.editingId}
                initialForm={pecaSheet.initialForm}
                onSubmit={submitPeca}
                isSubmitting={createPeca.isPending || updatePeca.isPending}
            />

            <CenarioDialog
                open={cenarioDialog.open}
                onOpenChange={(o) => !o && setCenarioDialog({ open: false, editingId: null, nome: "", descricao: "" })}
                editingId={cenarioDialog.editingId}
                initialNome={cenarioDialog.nome}
                initialDescricao={cenarioDialog.descricao}
                onSubmit={submitCenario}
                isSubmitting={createCenario.isPending || updateCenario.isPending}
            />

            <ImportIaDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                target={importTarget}
                onTargetChange={setImportTarget}
                allowVoltaTarget={pecaSheet.open}
                onExtractText={handleImportText}
                onExtractImage={handleImportImage}
                isExtractingText={extractText.isPending}
                isExtractingImage={extractImage.isPending}
            />

            <PropostaDialog
                open={propostaOpen}
                onOpenChange={setPropostaOpen}
                defaultTitulo={`Proposta — ${cotacao.clienteNome}`}
                cenariosSelecionados={cenariosSelecionados}
                onSubmit={(titulo, validadeData) =>
                    generateProposta.mutate({
                        cotacaoId,
                        titulo: titulo || undefined,
                        validadeData: validadeData || undefined,
                    })
                }
                isSubmitting={generateProposta.isPending}
            />

            <CotacaoEditDialog
                state={cotacaoEdit}
                setState={setCotacaoEdit}
                onSubmit={() => {
                    updateCotacao.mutate({
                        id: cotacao.id,
                        patch: {
                            clienteNome: cotacaoEdit.clienteNome,
                            clienteEmail: cotacaoEdit.clienteEmail || null,
                            clienteTelefone: cotacaoEdit.clienteTelefone || null,
                            origem: cotacaoEdit.origem || null,
                            destino: cotacaoEdit.destino || null,
                            dataIda: cotacaoEdit.dataIda || null,
                            dataVolta: cotacaoEdit.dataVolta || null,
                            paxAdultos: cotacaoEdit.paxAdultos,
                            paxCriancas: cotacaoEdit.paxCriancas,
                            paxBebes: cotacaoEdit.paxBebes,
                            observacoes: cotacaoEdit.observacoes || null,
                        },
                    });
                }}
                isSubmitting={updateCotacao.isPending}
            />

            {deleteDialogProps && (
                <DeleteConfirmDialog
                    open={deleteTarget != null}
                    onOpenChange={(open) => !open && closeDeleteDialog()}
                    title={deleteDialogProps.title}
                    description={deleteDialogProps.description}
                    onConfirm={confirmDelete}
                    isLoading={isDeleting}
                />
            )}
        </AdminLayout>
    );
}

function CotacaoEditDialog({
    state,
    setState,
    onSubmit,
    isSubmitting,
}: {
    state: CotacaoEditState;
    setState: React.Dispatch<React.SetStateAction<CotacaoEditState>>;
    onSubmit: () => void;
    isSubmitting: boolean;
}) {
    const close = () => setState((s) => ({ ...s, open: false }));
    const patch = (p: Partial<CotacaoEditState>) => setState((s) => ({ ...s, ...p }));
    return (
        <Dialog open={state.open} onOpenChange={(o) => !o && close()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Editar cotação</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Cliente</Label>
                        <Input
                            value={state.clienteNome}
                            onChange={(e) => patch({ clienteNome: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Email</Label>
                            <Input value={state.clienteEmail} onChange={(e) => patch({ clienteEmail: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Telefone</Label>
                            <Input value={state.clienteTelefone} onChange={(e) => patch({ clienteTelefone: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Origem</Label>
                            <Input value={state.origem} onChange={(e) => patch({ origem: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Destino</Label>
                            <Input value={state.destino} onChange={(e) => patch({ destino: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Ida</Label>
                            <Input type="date" value={state.dataIda} onChange={(e) => patch({ dataIda: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Volta</Label>
                            <Input type="date" value={state.dataVolta} onChange={(e) => patch({ dataVolta: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Adultos</Label>
                            <Input
                                type="number"
                                min={0}
                                value={state.paxAdultos}
                                onChange={(e) => patch({ paxAdultos: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Crianças</Label>
                            <Input
                                type="number"
                                min={0}
                                value={state.paxCriancas}
                                onChange={(e) => patch({ paxCriancas: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bebês</Label>
                            <Input
                                type="number"
                                min={0}
                                value={state.paxBebes}
                                onChange={(e) => patch({ paxBebes: Number(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Observações</Label>
                        <Textarea
                            rows={3}
                            value={state.observacoes}
                            onChange={(e) => patch({ observacoes: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={close}>
                        Cancelar
                    </Button>
                    <Button onClick={onSubmit} disabled={isSubmitting || !state.clienteNome.trim()}>
                        {isSubmitting ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// fim
