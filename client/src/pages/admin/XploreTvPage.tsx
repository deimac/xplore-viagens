import { useState, useCallback, useRef, useMemo } from "react";
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
    Video,
    Upload,
    Trash2,
    Film,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const SECAO_META: Record<string, { label: string; icon: any; color: string }> = {
    slider: { label: "Slider / Carrossel", icon: ImageIcon, color: "from-blue-500 to-cyan-500" },
    viagens: { label: "Viagens", icon: MapPin, color: "from-emerald-500 to-teal-500" },
    hospedagens: { label: "Hospedagens", icon: Building2, color: "from-amber-500 to-orange-500" },
    voos_premium: { label: "Voos Premium", icon: Plane, color: "from-purple-500 to-pink-500" },
    contato_empresa: { label: "Empresa", icon: Phone, color: "from-green-500 to-emerald-500" },
};

const FULL_SCREEN_ONLY = ['slider', 'contato_empresa', 'voos_premium'];

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

interface TvVideo {
    id: number;
    nome: string;
    videoUrl: string;
    ativo: boolean;
    ordem: number;
    transicao: "fade" | "slide";
    orientacao: "horizontal" | "vertical" | "ambos";
    criadoEm?: string | null;
    atualizadoEm?: string | null;
}

type UnifiedItem =
    | { _type: 'secao'; data: TvSecao }
    | { _type: 'video'; data: TvVideo };

export default function XploreTvPage() {
    const [editingId, setEditingId] = useState<string | null>(null); // "secao-1" or "video-2"
    const [editForm, setEditForm] = useState<Partial<TvSecao>>({});
    const [videoManageId, setVideoManageId] = useState<number | null>(null);
    const [videoUploading, setVideoUploading] = useState(false);
    const [addingVideo, setAddingVideo] = useState(false);
    const [addVideoTitle, setAddVideoTitle] = useState("");
    const [addVideoDialogOpen, setAddVideoDialogOpen] = useState(false);
    const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
    const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
    const [deleteVideoName, setDeleteVideoName] = useState("");
    const videoInputRef = useRef<HTMLInputElement>(null);
    const addVideoInputRef = useRef<HTMLInputElement>(null);

    const secoesQuery = trpc.xploreTv.listSecoes.useQuery(undefined);
    const videosQuery = trpc.xploreTv.listVideos.useQuery(undefined);

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

    const reorderUnifiedMutation = trpc.xploreTv.reorderUnified.useMutation({
        onSuccess: () => {
            secoesQuery.refetch();
            videosQuery.refetch();
        },
        onError: () => {
            toast.error("Erro ao reordenar");
        },
    });

    // Video mutations
    const uploadVideoMutation = trpc.xploreTv.uploadVideo.useMutation();
    const createVideoMutation = trpc.xploreTv.createVideoSection.useMutation({
        onSuccess: () => {
            videosQuery.refetch();
            secoesQuery.refetch();
            toast.success("Vídeo adicionado");
        },
        onError: () => {
            toast.error("Erro ao criar seção de vídeo");
        },
    });
    const updateVideoMutation = trpc.xploreTv.updateVideoSection.useMutation({
        onSuccess: () => {
            videosQuery.refetch();
            setEditingId(null);
            toast.success("Vídeo atualizado");
        },
        onError: () => {
            toast.error("Erro ao atualizar vídeo");
        },
    });
    const deleteVideoMutation = trpc.xploreTv.deleteVideoSection.useMutation({
        onSuccess: () => {
            videosQuery.refetch();
            toast.success("Vídeo removido");
        },
        onError: () => {
            toast.error("Erro ao remover vídeo");
        },
    });
    const toggleVideoMutation = trpc.xploreTv.toggleVideoSection.useMutation({
        onSuccess: () => {
            videosQuery.refetch();
        },
        onError: () => {
            toast.error("Erro ao alterar status");
        },
    });

    const handleAddVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("Arquivo muito grande. Máximo 200 MB.");
            if (addVideoInputRef.current) addVideoInputRef.current.value = '';
            return;
        }
        const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!allowed.includes(file.type)) {
            toast.error("Formato não suportado. Use MP4, WebM ou OGG.");
            if (addVideoInputRef.current) addVideoInputRef.current.value = '';
            return;
        }
        setPendingVideoFile(file);
        setAddVideoTitle("");
        setAddVideoDialogOpen(true);
    };

    const handleConfirmAddVideo = async () => {
        if (!pendingVideoFile || !addVideoTitle.trim()) return;
        setAddVideoDialogOpen(false);
        setAddingVideo(true);
        try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pendingVideoFile);
            });
            const { url } = await uploadVideoMutation.mutateAsync({
                fileName: pendingVideoFile.name,
                fileData: base64,
                mimeType: pendingVideoFile.type,
            });
            await createVideoMutation.mutateAsync({
                nome: addVideoTitle.trim(),
                videoUrl: url,
                ativo: true,
            });
        } catch (err: any) {
            toast.error(err?.message || "Erro ao fazer upload");
        } finally {
            setAddingVideo(false);
            setPendingVideoFile(null);
            setAddVideoTitle("");
            if (addVideoInputRef.current) addVideoInputRef.current.value = '';
        }
    };

    const handleReplaceVideoUpload = async (videoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("Arquivo muito grande. Máximo 200 MB.");
            return;
        }
        const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!allowed.includes(file.type)) {
            toast.error("Formato não suportado. Use MP4, WebM ou OGG.");
            return;
        }
        setVideoUploading(true);
        try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const { url } = await uploadVideoMutation.mutateAsync({
                fileName: file.name,
                fileData: base64,
                mimeType: file.type,
            });
            await updateVideoMutation.mutateAsync({
                id: videoId,
                nome: file.name.replace(/\.[^/.]+$/, ''),
                videoUrl: url,
            });
            videosQuery.refetch();
        } catch (err: any) {
            toast.error(err?.message || "Erro ao fazer upload");
        } finally {
            setVideoUploading(false);
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    };

    const secoes: TvSecao[] = (secoesQuery.data as TvSecao[]) || [];
    const videos: TvVideo[] = (videosQuery.data as TvVideo[]) || [];

    // Unified list sorted by ordem
    const unifiedList: UnifiedItem[] = useMemo(() => {
        const items: UnifiedItem[] = [
            ...secoes.map(s => ({ _type: 'secao' as const, data: s })),
            ...videos.map(v => ({ _type: 'video' as const, data: v })),
        ];
        items.sort((a, b) => a.data.ordem - b.data.ordem);
        return items;
    }, [secoes, videos]);

    const handleToggle = (item: UnifiedItem) => {
        if (item._type === 'secao') {
            toggleMutation.mutate({ id: item.data.id, ativo: !item.data.ativo });
        } else {
            toggleVideoMutation.mutate({ id: item.data.id, ativo: !item.data.ativo });
        }
    };

    const handleEdit = (item: UnifiedItem) => {
        const key = `${item._type}-${item.data.id}`;
        setEditingId(key);
        if (item._type === 'secao') {
            setEditForm({
                transicao: item.data.transicao,
                orientacao: item.data.orientacao,
                duracaoSecaoMs: item.data.duracaoSecaoMs,
                duracaoItemMs: item.data.duracaoItemMs,
                fullScreen: item.data.fullScreen,
            });
        } else {
            setEditForm({
                transicao: item.data.transicao,
                orientacao: item.data.orientacao,
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = (item: UnifiedItem) => {
        if (item._type === 'secao') {
            updateMutation.mutate({ id: item.data.id, ...editForm });
        } else {
            updateVideoMutation.mutate({
                id: item.data.id,
                transicao: editForm.transicao,
                orientacao: editForm.orientacao,
            });
        }
    };

    const handleMoveUp = useCallback((index: number) => {
        if (index <= 0) return;
        const items = unifiedList.map(i => ({ type: i._type as 'secao' | 'video', id: i.data.id }));
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        reorderUnifiedMutation.mutate({ items });
    }, [unifiedList, reorderUnifiedMutation]);

    const handleMoveDown = useCallback((index: number) => {
        if (index >= unifiedList.length - 1) return;
        const items = unifiedList.map(i => ({ type: i._type as 'secao' | 'video', id: i.data.id }));
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        reorderUnifiedMutation.mutate({ items });
    }, [unifiedList, reorderUnifiedMutation]);

    const handleOpenPreview = () => {
        window.open("/xplore-tv", "_blank");
    };

    const activeCount = unifiedList.filter(i => i.data.ativo).length;

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
                                <p className="text-2xl font-bold text-gray-900">{unifiedList.length}</p>
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
                            <div className="p-2 rounded-lg bg-rose-100">
                                <Film className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                                <p className="text-sm text-gray-500">Vídeos</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4 text-sm text-blue-700">
                    <strong>Como funciona:</strong> As seções da TV são fixas. Para escolher quais itens aparecem na TV, ative a opção
                    {" "}&quot;Mostrar na TV&quot; diretamente na edição de cada slide, viagem, hospedagem ou voo premium.
                    Use &quot;Adicionar Vídeo&quot; para criar seções de vídeo e posicioná-las na ordem desejada.
                </div>

                {/* Add Video Button */}
                <div className="flex justify-end">
                    <input
                        ref={addVideoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        className="hidden"
                        onChange={handleAddVideoFileSelect}
                        title="Selecionar vídeo"
                    />
                    <Button
                        onClick={() => addVideoInputRef.current?.click()}
                        disabled={addingVideo}
                        className="bg-gradient-to-r from-rose-500 to-red-500 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {addingVideo ? 'Enviando...' : 'Adicionar Vídeo'}
                    </Button>
                </div>

                {/* Unified Sections List */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {(secoesQuery.isLoading || videosQuery.isLoading) ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando seções...
                        </div>
                    ) : unifiedList.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mb-4">
                                <Monitor className="w-8 h-8 text-cyan-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">Nenhuma seção encontrada</p>
                            <p className="text-muted-foreground">Execute a migration para criar as seções iniciais</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {unifiedList.map((item, index) => {
                                const isVideo = item._type === 'video';
                                const itemKey = `${item._type}-${item.data.id}`;
                                const isEditing = editingId === itemKey;

                                // For fixed sections
                                const secao = item._type === 'secao' ? item.data : null;
                                const video = item._type === 'video' ? item.data : null;

                                const meta = isVideo
                                    ? { label: video!.nome || "Vídeo", icon: Video, color: "from-rose-500 to-red-500" }
                                    : (SECAO_META[secao!.codigo] || { label: secao!.nome, icon: Monitor, color: "from-gray-400 to-gray-500" });
                                const ItemIcon = meta.icon;

                                return (
                                    <div key={itemKey}>
                                        <div
                                            className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 ${!item.data.ativo ? "opacity-50" : ""}`}
                                        >
                                            {/* Drag handle + order */}
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0 || reorderUnifiedMutation.isPending}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Mover para cima"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <GripVertical className="w-4 h-4 text-gray-300" />
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === unifiedList.length - 1 || reorderUnifiedMutation.isPending}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Mover para baixo"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Section icon */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} text-white shrink-0`}>
                                                <ItemIcon className="w-5 h-5" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-medium text-gray-900 truncate">{meta.label}</h3>
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {isVideo ? 'vídeo' : secao!.codigo}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{TRANSICAO_LABELS[item.data.transicao] || item.data.transicao}</span>
                                                    <span>&bull;</span>
                                                    <span>{ORIENTACAO_LABELS[item.data.orientacao] || item.data.orientacao}</span>
                                                    {!isVideo && secao && (
                                                        <>
                                                            <span>&bull;</span>
                                                            <span>{Math.round(secao.duracaoSecaoMs / 1000)}s seção</span>
                                                            <span>&bull;</span>
                                                            <span>{Math.round(secao.duracaoItemMs / 1000)}s/item</span>
                                                            <span>&bull;</span>
                                                            <span>{secao.fullScreen ? 'Tela cheia' : 'Carrossel'}</span>
                                                        </>
                                                    )}
                                                    {isVideo && (
                                                        <>
                                                            <span>&bull;</span>
                                                            <span>Duração do vídeo</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleToggle(item)}
                                                    className={`p-2 rounded-lg transition-colors ${item.data.ativo ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                                    title={item.data.ativo ? "Desativar seção" : "Ativar seção"}
                                                >
                                                    {item.data.ativo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => isEditing ? handleCancelEdit() : handleEdit(item)}
                                                    className={`p-2 rounded-lg transition-colors ${isEditing ? "text-cyan-600 bg-cyan-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                                                    title="Configurar seção"
                                                >
                                                    {isEditing ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                                                </button>
                                                {isVideo && (
                                                    <button
                                                        onClick={() => setVideoManageId(videoManageId === item.data.id ? null : item.data.id)}
                                                        className={`p-2 rounded-lg transition-colors ${videoManageId === item.data.id ? "text-rose-600 bg-rose-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                                                        title="Gerenciar vídeo"
                                                    >
                                                        <Film className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {isVideo && (
                                                    <button
                                                        onClick={() => {
                                                            setDeleteVideoId(item.data.id);
                                                            setDeleteVideoName(video!.nome || 'Vídeo');
                                                        }}
                                                        className="p-2 rounded-lg transition-colors text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                        title="Excluir seção de vídeo"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inline Edit Panel */}
                                        {isEditing && (
                                            <div className="px-5 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100">
                                                <div className={`grid grid-cols-1 sm:grid-cols-2 ${!isVideo ? 'lg:grid-cols-4' : ''} gap-4`}>
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
                                                    {!isVideo && (
                                                        <>
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
                                                        </>
                                                    )}
                                                </div>
                                                {!isVideo && secao && (
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
                                                )}
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(item)}
                                                        disabled={updateMutation.isPending || updateVideoMutation.isPending}
                                                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                                                    >
                                                        Salvar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Video Management Panel */}
                                        {isVideo && videoManageId === item.data.id && (
                                            <div className="px-5 pb-5 pt-3 bg-rose-50/50 border-t border-rose-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Film className="w-4 h-4 text-rose-600" />
                                                    <h4 className="text-sm font-medium text-rose-700">Gerenciar Vídeo</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Video className="w-8 h-8 text-rose-500 shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{video!.nome}</p>
                                                                <p className="text-xs text-gray-500 truncate">{video!.videoUrl}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <input
                                                            ref={videoInputRef}
                                                            type="file"
                                                            accept="video/mp4,video/webm,video/ogg"
                                                            className="hidden"
                                                            onChange={(e) => handleReplaceVideoUpload(item.data.id, e)}
                                                            title="Selecionar vídeo"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => videoInputRef.current?.click()}
                                                            disabled={videoUploading}
                                                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            {videoUploading ? 'Enviando...' : 'Substituir vídeo'}
                                                        </Button>
                                                        <p className="text-xs text-gray-400 mt-2">MP4, WebM ou OGG · Máximo 200 MB</p>
                                                    </div>
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

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteVideoId !== null}
                onOpenChange={(open) => { if (!open) setDeleteVideoId(null); }}
                title="Excluir seção de vídeo"
                itemName={deleteVideoName}
                onConfirm={() => {
                    if (deleteVideoId !== null) {
                        deleteVideoMutation.mutate({ id: deleteVideoId });
                        setDeleteVideoId(null);
                    }
                }}
                isLoading={deleteVideoMutation.isPending}
            />

            {/* Add Video Title Dialog */}
            <Dialog open={addVideoDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setAddVideoDialogOpen(false);
                    setPendingVideoFile(null);
                    setAddVideoTitle("");
                    if (addVideoInputRef.current) addVideoInputRef.current.value = '';
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Título do Vídeo</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-sm text-gray-600 mb-2 block">
                            Informe um título para identificar este vídeo na playlist
                        </Label>
                        <Input
                            value={addVideoTitle}
                            onChange={(e) => setAddVideoTitle(e.target.value)}
                            placeholder="Ex: Vídeo Institucional, Promo Verão..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && addVideoTitle.trim()) {
                                    handleConfirmAddVideo();
                                }
                            }}
                        />
                        {pendingVideoFile && (
                            <p className="text-xs text-gray-400 mt-2">
                                Arquivo: {pendingVideoFile.name}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => {
                            setAddVideoDialogOpen(false);
                            setPendingVideoFile(null);
                            setAddVideoTitle("");
                            if (addVideoInputRef.current) addVideoInputRef.current.value = '';
                        }}>
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmAddVideo}
                            disabled={!addVideoTitle.trim()}
                            className="bg-gradient-to-r from-rose-500 to-red-500 text-white"
                        >
                            Enviar Vídeo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
