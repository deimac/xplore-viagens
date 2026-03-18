import { useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Monitor,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    ExternalLink,
    Settings2,
    X,
    ImageIcon,
    Plane,
    Building2,
    Phone,
    MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const SECAO_META: Record<string, { label: string; icon: any; color: string }> = {
    slider: { label: "Slider / Carrossel", icon: ImageIcon, color: "from-blue-500 to-cyan-500" },
    viagens: { label: "Viagens", icon: MapPin, color: "from-emerald-500 to-teal-500" },
    hospedagens: { label: "Hospedagens", icon: Building2, color: "from-amber-500 to-orange-500" },
    voos_premium: { label: "Voos Premium", icon: Plane, color: "from-purple-500 to-pink-500" },
    contato_empresa: { label: "Empresa", icon: Phone, color: "from-green-500 to-emerald-500" },
};

const TRANSICAO_LABELS: Record<string, string> = {
    fade: "Fade",
    slide: "Slide",
};

const ORIENTACAO_LABELS: Record<string, string> = {
    horizontal: "Horizontal",
    vertical: "Vertical",
    ambos: "Ambos",
};

interface TvSecao {
    id: number;
    codigo: string;
    nome: string;
    ativo: boolean;
    ordem: number;
    transicao: "fade" | "slide";
    orientacao: "horizontal" | "vertical" | "ambos";
    duracaoSecaoMs: number;
    duracaoItemMs: number;
    fullScreen: boolean;
    criadoEm?: string | null;
    atualizadoEm?: string | null;
}

const FULL_SCREEN_ONLY = ['slider', 'contato_empresa', 'voos_premium'];

export default function XploreTvPage() {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<TvSecao>>({});

    const secoesQuery = trpc.xploreTv.listSecoes.useQuery(undefined);

    const updateMutation = trpc.xploreTv.updateSecao.useMutation({
        onSuccess: () => {
            secoesQuery.refetch();
            setEditingId(null);
            toast.success("Seção atualizada");
        },
        onError: () => {
            toast.error("Erro ao atualizar seção");
        },
    });

    const toggleMutation = trpc.xploreTv.toggleSecao.useMutation({
        onSuccess: () => {
            secoesQuery.refetch();
        },
        onError: () => {
            toast.error("Erro ao alterar status");
        },
    });

    const reorderMutation = trpc.xploreTv.reorderSecoes.useMutation({
        onSuccess: () => {
            secoesQuery.refetch();
        },
        onError: () => {
            toast.error("Erro ao reordenar seções");
        },
    });

    const secoes: TvSecao[] = (secoesQuery.data as TvSecao[]) || [];

    const handleToggle = (secao: TvSecao) => {
        toggleMutation.mutate({ id: secao.id, ativo: !secao.ativo });
    };

    const handleEdit = (secao: TvSecao) => {
        setEditingId(secao.id);
        setEditForm({
            transicao: secao.transicao,
            orientacao: secao.orientacao,
            duracaoSecaoMs: secao.duracaoSecaoMs,
            duracaoItemMs: secao.duracaoItemMs,
            fullScreen: secao.fullScreen,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        updateMutation.mutate({
            id: editingId,
            ...editForm,
        });
    };

    const handleMoveUp = useCallback((index: number) => {
        if (index <= 0) return;
        const ids = secoes.map(s => s.id);
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
        reorderMutation.mutate({ orderedIds: ids });
    }, [secoes, reorderMutation]);

    const handleMoveDown = useCallback((index: number) => {
        if (index >= secoes.length - 1) return;
        const ids = secoes.map(s => s.id);
        [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
        reorderMutation.mutate({ orderedIds: ids });
    }, [secoes, reorderMutation]);

    const handleOpenPreview = () => {
        window.open("/xplore-tv", "_blank");
    };

    const activeCount = secoes.filter(s => s.ativo).length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Xplore TV
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Configure as seções da vitrine digital para TV
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleOpenPreview}
                        className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview TV
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-100">
                                <Monitor className="w-5 h-5 text-cyan-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{secoes.length}</p>
                                <p className="text-sm text-gray-500">Seções disponíveis</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100">
                                <Eye className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                                <p className="text-sm text-gray-500">Seções ativas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Monitor className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {activeCount > 0 ? Math.round(secoes.filter(s => s.ativo).reduce((acc, s) => acc + s.duracaoSecaoMs, 0) / 1000) + "s" : "\u2014"}
                                </p>
                                <p className="text-sm text-gray-500">Duração total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4 text-sm text-blue-700">
                    <strong>Como funciona:</strong> As seções da TV são fixas. Para escolher quais itens aparecem na TV, ative a opção
                    {" "}&quot;Mostrar na TV&quot; diretamente na edição de cada slide, viagem, hospedagem ou voo premium.
                    Aqui você controla a ordem, duração e transição de cada seção.
                </div>

                {/* Sections List */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {secoesQuery.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando seções...
                        </div>
                    ) : secoes.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mb-4">
                                <Monitor className="w-8 h-8 text-cyan-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">Nenhuma seção encontrada</p>
                            <p className="text-muted-foreground">Execute a migration para criar as seções iniciais</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {secoes.map((secao, index) => {
                                const meta = SECAO_META[secao.codigo] || { label: secao.nome, icon: Monitor, color: "from-gray-400 to-gray-500" };
                                const SecaoIcon = meta.icon;
                                const isEditing = editingId === secao.id;

                                return (
                                    <div key={secao.id}>
                                        <div
                                            className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 ${!secao.ativo ? "opacity-50" : ""}`}
                                        >
                                            {/* Drag handle + order */}
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0 || reorderMutation.isPending}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Mover para cima"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <GripVertical className="w-4 h-4 text-gray-300" />
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === secoes.length - 1 || reorderMutation.isPending}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Mover para baixo"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Section icon */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} text-white shrink-0`}>
                                                <SecaoIcon className="w-5 h-5" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-medium text-gray-900 truncate">{meta.label}</h3>
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {secao.codigo}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{TRANSICAO_LABELS[secao.transicao] || secao.transicao}</span>
                                                    <span>&bull;</span>
                                                    <span>{ORIENTACAO_LABELS[secao.orientacao] || secao.orientacao}</span>
                                                    <span>&bull;</span>
                                                    <span>{Math.round(secao.duracaoSecaoMs / 1000)}s seção</span>
                                                    <span>&bull;</span>
                                                    <span>{Math.round(secao.duracaoItemMs / 1000)}s/item</span>
                                                    <span>&bull;</span>
                                                    <span>{secao.fullScreen ? 'Tela cheia' : 'Carrossel'}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggle(secao)}
                                                    className={`p-2 rounded-lg transition-colors ${secao.ativo ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                                    title={secao.ativo ? "Desativar seção" : "Ativar seção"}
                                                >
                                                    {secao.ativo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => isEditing ? handleCancelEdit() : handleEdit(secao)}
                                                    className={`p-2 rounded-lg transition-colors ${isEditing ? "text-cyan-600 bg-cyan-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                                                    title="Configurar seção"
                                                >
                                                    {isEditing ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline Edit Panel */}
                                        {isEditing && (
                                            <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">Transição</Label>
                                                        <Select
                                                            value={editForm.transicao}
                                                            onValueChange={(v) => setEditForm({ ...editForm, transicao: v as "fade" | "slide" })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="fade">Fade</SelectItem>
                                                                <SelectItem value="slide">Slide</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">Orientação</Label>
                                                        <Select
                                                            value={editForm.orientacao}
                                                            onValueChange={(v) => setEditForm({ ...editForm, orientacao: v as "horizontal" | "vertical" | "ambos" })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="horizontal">Horizontal</SelectItem>
                                                                <SelectItem value="vertical">Vertical</SelectItem>
                                                                <SelectItem value="ambos">Ambos</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">Duração seção (seg)</Label>
                                                        <Input
                                                            type="number"
                                                            min={5}
                                                            value={Math.round((editForm.duracaoSecaoMs || 30000) / 1000)}
                                                            onChange={(e) => setEditForm({ ...editForm, duracaoSecaoMs: Math.max(5000, Number(e.target.value) * 1000) })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">Duração item (seg)</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={Math.round((editForm.duracaoItemMs || 8000) / 1000)}
                                                            onChange={(e) => setEditForm({ ...editForm, duracaoItemMs: Math.max(1000, Number(e.target.value) * 1000) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-700">Modo tela cheia</Label>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {FULL_SCREEN_ONLY.includes(secao.codigo)
                                                                    ? 'Esta seção exibe apenas em tela cheia'
                                                                    : 'Desativado: exibe carrossel composto. Ativado: exibe cada item em tela cheia.'}
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={editForm.fullScreen ?? false}
                                                            onCheckedChange={(v) => setEditForm({ ...editForm, fullScreen: v })}
                                                            disabled={FULL_SCREEN_ONLY.includes(secao.codigo)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveEdit}
                                                        disabled={updateMutation.isPending}
                                                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                                                    >
                                                        Salvar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
