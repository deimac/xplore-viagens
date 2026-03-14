import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Image, Video, Award, Phone } from "lucide-react";

interface TvItem {
    id?: number;
    tipo: string;
    titulo: string;
    ativo: boolean;
    ordem: number;
    duracaoMs: number;
    transicao: string;
    orientacao: string;
    payload: string | null;
}

interface XploreTvItemModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    item?: TvItem;
    nextOrder: number;
}

const TIPOS = [
    { value: "imagem", label: "Imagem", icon: Image, desc: "Exibe uma imagem em tela cheia com legendas" },
    { value: "video", label: "Vídeo", icon: Video, desc: "Reproduz um vídeo automaticamente" },
    { value: "marca", label: "Marca", icon: Award, desc: "Apresentação da marca com logo e tagline" },
    { value: "contato", label: "Contato", icon: Phone, desc: "Exibe informações de contato" },
];

function parsePayload(payload: string | null | undefined): Record<string, any> {
    try {
        return payload ? JSON.parse(payload) : {};
    } catch {
        return {};
    }
}

export default function XploreTvItemModal({ open, onClose, onSave, item, nextOrder }: XploreTvItemModalProps) {
    const [tipo, setTipo] = useState("imagem");
    const [titulo, setTitulo] = useState("");
    const [ativo, setAtivo] = useState(true);
    const [duracaoMs, setDuracaoMs] = useState(8000);
    const [transicao, setTransicao] = useState("fade");
    const [orientacao, setOrientacao] = useState("horizontal");
    const [payloadFields, setPayloadFields] = useState<Record<string, string>>({});

    useEffect(() => {
        if (item) {
            setTipo(item.tipo);
            setTitulo(item.titulo);
            setAtivo(item.ativo);
            setDuracaoMs(item.duracaoMs);
            setTransicao(item.transicao);
            setOrientacao(item.orientacao);
            setPayloadFields(
                Object.fromEntries(
                    Object.entries(parsePayload(item.payload)).map(([k, v]) => [k, String(v ?? "")])
                )
            );
        } else {
            setTipo("imagem");
            setTitulo("");
            setAtivo(true);
            setDuracaoMs(8000);
            setTransicao("fade");
            setOrientacao("horizontal");
            setPayloadFields({});
        }
    }, [item, open]);

    const updatePayload = (key: string, value: string) => {
        setPayloadFields(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = JSON.stringify(
            Object.fromEntries(
                Object.entries(payloadFields).filter(([, v]) => v.trim() !== "")
            )
        );
        const data: any = {
            tipo,
            titulo,
            ativo,
            ordem: item ? item.ordem : nextOrder,
            duracaoMs,
            transicao,
            orientacao,
            payload,
        };
        if (item?.id) data.id = item.id;
        onSave(data);
    };

    const renderPayloadFields = () => {
        switch (tipo) {
            case "imagem":
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payload-url">URL da Imagem</Label>
                            <Input
                                id="payload-url"
                                value={payloadFields.url || ""}
                                onChange={e => updatePayload("url", e.target.value)}
                                placeholder="https://... ou /uploads/..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-titulo">Título sobre a imagem</Label>
                            <Input
                                id="payload-titulo"
                                value={payloadFields.titulo || ""}
                                onChange={e => updatePayload("titulo", e.target.value)}
                                placeholder="Texto principal na imagem"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-subtitulo">Subtítulo</Label>
                            <Input
                                id="payload-subtitulo"
                                value={payloadFields.subtitulo || ""}
                                onChange={e => updatePayload("subtitulo", e.target.value)}
                                placeholder="Texto secundário"
                            />
                        </div>
                        {payloadFields.url && (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={payloadFields.url}
                                    alt="Preview"
                                    className="w-full h-40 object-cover"
                                    onError={e => (e.currentTarget.style.display = "none")}
                                />
                            </div>
                        )}
                    </div>
                );
            case "video":
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payload-video-url">URL do Vídeo</Label>
                            <Input
                                id="payload-video-url"
                                value={payloadFields.url || ""}
                                onChange={e => updatePayload("url", e.target.value)}
                                placeholder="https://... ou /uploads/..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Formatos recomendados: MP4 (H.264). Será reproduzido em mudo automaticamente.
                            </p>
                        </div>
                    </div>
                );
            case "marca":
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payload-logo">URL do Logo</Label>
                            <Input
                                id="payload-logo"
                                value={payloadFields.logoUrl || ""}
                                onChange={e => updatePayload("logoUrl", e.target.value)}
                                placeholder="https://... ou /uploads/..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-nome">Nome da Marca</Label>
                            <Input
                                id="payload-nome"
                                value={payloadFields.nome || ""}
                                onChange={e => updatePayload("nome", e.target.value)}
                                placeholder="Xplore Viagens"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-tagline">Tagline</Label>
                            <Input
                                id="payload-tagline"
                                value={payloadFields.tagline || ""}
                                onChange={e => updatePayload("tagline", e.target.value)}
                                placeholder="Sua próxima aventura começa aqui"
                            />
                        </div>
                        {payloadFields.logoUrl && (
                            <div className="rounded-lg p-4 bg-gray-900 flex items-center justify-center">
                                <img
                                    src={payloadFields.logoUrl}
                                    alt="Logo Preview"
                                    className="max-h-20 object-contain"
                                    onError={e => (e.currentTarget.style.display = "none")}
                                />
                            </div>
                        )}
                    </div>
                );
            case "contato":
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="payload-contato-titulo">Título da seção</Label>
                            <Input
                                id="payload-contato-titulo"
                                value={payloadFields.titulo || ""}
                                onChange={e => updatePayload("titulo", e.target.value)}
                                placeholder="Entre em Contato"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-telefone">Telefone</Label>
                            <Input
                                id="payload-telefone"
                                value={payloadFields.telefone || ""}
                                onChange={e => updatePayload("telefone", e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-whatsapp">WhatsApp</Label>
                            <Input
                                id="payload-whatsapp"
                                value={payloadFields.whatsapp || ""}
                                onChange={e => updatePayload("whatsapp", e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-email">E-mail</Label>
                            <Input
                                id="payload-email"
                                value={payloadFields.email || ""}
                                onChange={e => updatePayload("email", e.target.value)}
                                placeholder="contato@empresa.com.br"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-instagram">Instagram</Label>
                            <Input
                                id="payload-instagram"
                                value={payloadFields.instagram || ""}
                                onChange={e => updatePayload("instagram", e.target.value)}
                                placeholder="@empresa"
                            />
                        </div>
                        <div>
                            <Label htmlFor="payload-endereco">Endereço</Label>
                            <Textarea
                                id="payload-endereco"
                                value={payloadFields.endereco || ""}
                                onChange={e => updatePayload("endereco", e.target.value)}
                                placeholder="Rua Exemplo, 123 - Cidade/UF"
                                rows={2}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {item?.id ? "Editar Bloco TV" : "Novo Bloco TV"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo Selection */}
                    <div>
                        <Label className="mb-3 block">Tipo do bloco</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPOS.map(t => {
                                const Icon = t.icon;
                                const selected = tipo === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => {
                                            setTipo(t.value);
                                            setPayloadFields({});
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${selected
                                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 shrink-0 ${selected ? "text-cyan-600" : "text-gray-400"}`} />
                                        <div>
                                            <p className="font-medium text-sm">{t.label}</p>
                                            <p className="text-xs opacity-60">{t.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Basic Fields */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="titulo">Título (identificação interna)</Label>
                            <Input
                                id="titulo"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                placeholder="Ex: Slide praia de Cancún"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="duracao">Duração (segundos)</Label>
                            <Input
                                id="duracao"
                                type="number"
                                min={1}
                                value={duracaoMs / 1000}
                                onChange={e => setDuracaoMs(Math.max(1000, Number(e.target.value) * 1000))}
                            />
                        </div>
                        <div>
                            <Label>Transição</Label>
                            <Select value={transicao} onValueChange={setTransicao}>
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
                            <Label>Orientação</Label>
                            <Select value={orientacao} onValueChange={setOrientacao}>
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
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="ativo"
                            checked={ativo}
                            onCheckedChange={setAtivo}
                        />
                        <Label htmlFor="ativo" className="cursor-pointer">
                            Ativo na vitrine
                        </Label>
                    </div>

                    {/* Payload Fields (dynamic per type) */}
                    <div className="border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Conteúdo do bloco
                        </h3>
                        {renderPayloadFields()}
                    </div>

                    <DialogFooter className="gap-3 sm:gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        >
                            {item?.id ? "Salvar" : "Criar Bloco"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
