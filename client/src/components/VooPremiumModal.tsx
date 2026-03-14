import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

type TipoOferta = 'DATA_FIXA' | 'DATA_FLEXIVEL';
type ClasseVoo = 'PE' | 'BS' | 'FC';
type TipoData = 'IDA' | 'VOLTA';

interface DataFixa {
    datas_opcao: string;
}

interface DataFlexivel {
    tipo: TipoData;
    mes_referencia: string;
    dias_disponiveis: string;
}

interface OfertaVooPremium {
    id?: number;
    tipo_oferta: TipoOferta;
    titulo: string;
    descricao?: string;
    origem_principal: string;
    destinos_resumo?: string;
    companhia_aerea: string;
    classe_voo: ClasseVoo;
    preco: number;
    parcelas?: string;
    rotas_fixas?: string;
    rota_ida?: string;
    rota_volta?: string;
    ativo: boolean;
    mostrarNoSite?: boolean;
    mostrarNaTv?: boolean;
    datas_fixas?: DataFixa[];
    datas_flexiveis?: DataFlexivel[];
}

interface VooPremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (oferta: OfertaVooPremium) => void;
    oferta?: OfertaVooPremium;
}

const MESES_ABREVIADOS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
] as const;

function normalizarMesReferencia(valor?: string): string {
    if (!valor) return "";
    const v = valor.trim();
    if (!v) return "";

    const numeroMes = Number(v.slice(-2));
    if (/^\d{4}-\d{2}$/.test(v) && Number.isInteger(numeroMes) && numeroMes >= 1 && numeroMes <= 12) {
        return MESES_ABREVIADOS[numeroMes - 1];
    }

    const matchAbrev = MESES_ABREVIADOS.find((m) => m.toLowerCase() === v.toLowerCase());
    return matchAbrev || "";
}

export default function VooPremiumModal({ isOpen, onClose, onSave, oferta }: VooPremiumModalProps) {
    const [formData, setFormData] = useState<OfertaVooPremium>({
        tipo_oferta: 'DATA_FIXA',
        titulo: '',
        origem_principal: '',
        companhia_aerea: '',
        classe_voo: 'PE',
        preco: 0,
        ativo: true,
        mostrarNoSite: true,
        mostrarNaTv: false,
        datas_fixas: [],
        datas_flexiveis: [],
    });

    // Estado para o valor formatado visualmente
    const [precoFormatado, setPrecoFormatado] = useState<string>('');

    // Função para formatar o valor em reais
    const formatarValorBrasileiro = (valor: number): string => {
        if (valor === 0) return '';
        return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor);
    };

    // Função para converter string formatada em número
    const parseValorBrasileiro = (valorStr: string): number => {
        if (!valorStr.trim()) return 0;
        // Remove pontos (separadores de milhares) e substitui vírgula por ponto
        const numeroLimpo = valorStr
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.]/g, '');
        return parseFloat(numeroLimpo) || 0;
    };

    // Função para aplicar máscara de valor
    const aplicarMascaraValor = (valor: string): string => {
        // Remove tudo que não é número
        const apenasNumeros = valor.replace(/\D/g, '');

        if (!apenasNumeros) return '';

        // Converte para número (centavos) e depois para reais  
        const valorEmCentavos = parseInt(apenasNumeros);
        const valorEmReais = valorEmCentavos / 100;

        return new Intl.NumberFormat("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valorEmReais);
    };

    useEffect(() => {
        if (oferta) {
            setFormData({
                ...oferta,
                datas_fixas: oferta.datas_fixas || [],
                datas_flexiveis: (oferta.datas_flexiveis || []).map((d) => ({
                    ...d,
                    mes_referencia: normalizarMesReferencia(d.mes_referencia),
                })),
            });
            setPrecoFormatado(formatarValorBrasileiro(oferta.preco));
        } else {
            setFormData({
                tipo_oferta: 'DATA_FIXA',
                titulo: '',
                origem_principal: '',
                companhia_aerea: '',
                classe_voo: 'PE',
                preco: 0,
                ativo: true,
                mostrarNoSite: true,
                mostrarNaTv: false,
                datas_fixas: [],
                datas_flexiveis: [],
            });
            setPrecoFormatado('');
        }
    }, [oferta, isOpen]);

    const handleTipoChange = (tipo: TipoOferta) => {
        setFormData({
            ...formData,
            tipo_oferta: tipo,
            rotas_fixas: undefined,
            rota_ida: undefined,
            rota_volta: undefined,
            datas_fixas: [],
            datas_flexiveis: [],
        });
    };

    const handleAddDataFixa = () => {
        setFormData({
            ...formData,
            datas_fixas: [...(formData.datas_fixas || []), { datas_opcao: '' }],
        });
    };

    const handleRemoveDataFixa = (index: number) => {
        const novasDatas = [...(formData.datas_fixas || [])];
        novasDatas.splice(index, 1);
        setFormData({ ...formData, datas_fixas: novasDatas });
    };

    const handleDataFixaChange = (index: number, value: string) => {
        const novasDatas = [...(formData.datas_fixas || [])];
        novasDatas[index].datas_opcao = value;
        setFormData({ ...formData, datas_fixas: novasDatas });
    };

    const handleAddDataFlexivel = (tipo: TipoData) => {
        setFormData({
            ...formData,
            datas_flexiveis: [...(formData.datas_flexiveis || []), {
                tipo,
                mes_referencia: '',
                dias_disponiveis: ''
            }],
        });
    };

    const handleRemoveDataFlexivel = (index: number) => {
        const novasDatas = [...(formData.datas_flexiveis || [])];
        novasDatas.splice(index, 1);
        setFormData({ ...formData, datas_flexiveis: novasDatas });
    };

    const handleDataFlexivelChange = (index: number, field: 'mes_referencia' | 'dias_disponiveis', value: string) => {
        const novasDatas = [...(formData.datas_flexiveis || [])];
        novasDatas[index][field] = value;
        setFormData({ ...formData, datas_flexiveis: novasDatas });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (!formData.titulo.trim()) {
            toast.error('Título é obrigatório');
            return;
        }
        if (!formData.origem_principal.trim()) {
            toast.error('Origem é obrigatória');
            return;
        }
        if (!formData.companhia_aerea.trim()) {
            toast.error('Companhia aérea é obrigatória');
            return;
        }
        if (formData.preco <= 0) {
            toast.error('Preço deve ser maior que zero');
            return;
        }

        if (formData.tipo_oferta === 'DATA_FIXA') {
            if (!formData.rotas_fixas || formData.rotas_fixas.trim() === '') {
                toast.error('Rotas fixas são obrigatórias');
                return;
            }
            if (!formData.datas_fixas || formData.datas_fixas.length === 0) {
                toast.error('Adicione pelo menos uma opção de datas');
                return;
            }
            const datasVazias = formData.datas_fixas.some(d => !d.datas_opcao.trim());
            if (datasVazias) {
                toast.error('Todas as opções de datas devem ser preenchidas');
                return;
            }
        } else {
            if (!formData.rota_ida || formData.rota_ida.trim() === '') {
                toast.error('Rota de ida é obrigatória');
                return;
            }
            if (!formData.rota_volta || formData.rota_volta.trim() === '') {
                toast.error('Rota de volta é obrigatória');
                return;
            }
            if (!formData.datas_flexiveis || formData.datas_flexiveis.length === 0) {
                toast.error('Adicione datas de ida e volta');
                return;
            }
            const temIda = formData.datas_flexiveis.some(d => d.tipo === 'IDA');
            const temVolta = formData.datas_flexiveis.some(d => d.tipo === 'VOLTA');
            if (!temIda || !temVolta) {
                toast.error('Adicione pelo menos uma data de IDA e uma de VOLTA');
                return;
            }
            const datasVazias = formData.datas_flexiveis.some(d => !d.mes_referencia.trim() || !d.dias_disponiveis.trim());
            if (datasVazias) {
                toast.error('Todas as datas devem ter mês e dias preenchidos');
                return;
            }
        }

        onSave(formData);
    };

    const datasIda = formData.datas_flexiveis?.filter(d => d.tipo === 'IDA') || [];
    const datasVolta = formData.datas_flexiveis?.filter(d => d.tipo === 'VOLTA') || [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {oferta?.id ? 'Editar Oferta Premium' : 'Nova Oferta Premium'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Tipo de Oferta */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Tipo de Oferta *</Label>
                        <Select value={formData.tipo_oferta} onValueChange={handleTipoChange}>
                            <SelectTrigger className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DATA_FIXA">Data Fixa</SelectItem>
                                <SelectItem value="DATA_FLEXIVEL">Data Flexível</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Título */}
                        <div className="space-y-3">
                            <Label htmlFor="titulo" className="text-sm font-semibold">Título *</Label>
                            <Input
                                id="titulo"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                placeholder="Ex: Londres Premium - Business"
                                className="h-11"
                            />
                        </div>

                        {/* Companhia */}
                        <div className="space-y-3">
                            <Label htmlFor="companhia" className="text-sm font-semibold">Companhia Aérea *</Label>
                            <Input
                                id="companhia"
                                value={formData.companhia_aerea}
                                onChange={(e) => setFormData({ ...formData, companhia_aerea: e.target.value })}
                                placeholder="Ex: TAP, British Airways"
                                className="h-11"
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-3">
                        <Label htmlFor="descricao" className="text-sm font-semibold">Descrição</Label>
                        <Textarea
                            id="descricao"
                            value={formData.descricao || ''}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            placeholder="Descrição detalhada da oferta..."
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Origem */}
                        <div className="space-y-3">
                            <Label htmlFor="origem" className="text-sm font-semibold">Origem Principal *</Label>
                            <Input
                                id="origem"
                                value={formData.origem_principal}
                                onChange={(e) => setFormData({ ...formData, origem_principal: e.target.value })}
                                placeholder="Ex: São Paulo (GRU)"
                                className="h-11"
                            />
                        </div>

                        {/* Destinos */}
                        <div className="space-y-3">
                            <Label htmlFor="destinos" className="text-sm font-semibold">Destinos (Resumo)</Label>
                            <Input
                                id="destinos"
                                value={formData.destinos_resumo || ''}
                                onChange={(e) => setFormData({ ...formData, destinos_resumo: e.target.value })}
                                placeholder="Ex: Londres, Paris"
                                className="h-11"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 items-end">
                        {/* Classe */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Classe *</Label>
                            <Select value={formData.classe_voo} onValueChange={(v) => setFormData({ ...formData, classe_voo: v as ClasseVoo })}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PE">Premium Economy</SelectItem>
                                    <SelectItem value="BS">Business Class</SelectItem>
                                    <SelectItem value="FC">First Class</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Preço */}
                        <div className="space-y-2">
                            <Label htmlFor="preco" className="text-sm font-semibold">Preço (R$) *</Label>
                            <Input
                                id="preco"
                                type="text"
                                value={precoFormatado}
                                onChange={(e) => {
                                    const valorMascarado = aplicarMascaraValor(e.target.value);
                                    setPrecoFormatado(valorMascarado);
                                    const valorNumerico = parseValorBrasileiro(valorMascarado);
                                    setFormData({ ...formData, preco: valorNumerico });
                                }}
                                placeholder="10.000,00"
                                className="h-10 w-full"
                            />
                        </div>

                        {/* Parcelas */}
                        <div className="space-y-2">
                            <Label htmlFor="parcelas" className="text-sm font-semibold">Parcelas</Label>
                            <Input
                                id="parcelas"
                                value={formData.parcelas || ''}
                                onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                                placeholder="Ex: 10x sem juros"
                                className="h-10 w-full"
                            />
                        </div>
                    </div>

                    {/* Rotas - Condicional */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Rotas</h3>

                        {formData.tipo_oferta === 'DATA_FIXA' ? (
                            <div className="space-y-3">
                                <Label htmlFor="rotas_fixas" className="text-sm font-semibold">Rotas Fixas *</Label>
                                <Input
                                    id="rotas_fixas"
                                    value={formData.rotas_fixas || ''}
                                    onChange={(e) => setFormData({ ...formData, rotas_fixas: e.target.value })}
                                    placeholder="Ex: São Paulo,Montreal,Madrid,São Paulo"
                                    className="h-11"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Digite as rotas completas separadas por virgula
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <Label htmlFor="rota_ida" className="text-sm font-semibold">Rota de Ida *</Label>
                                    <Input
                                        id="rota_ida"
                                        value={formData.rota_ida || ''}
                                        onChange={(e) => setFormData({ ...formData, rota_ida: e.target.value })}
                                        placeholder="Ex: GRU-LON"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="rota_volta" className="text-sm font-semibold">Rota de Volta *</Label>
                                    <Input
                                        id="rota_volta"
                                        value={formData.rota_volta || ''}
                                        onChange={(e) => setFormData({ ...formData, rota_volta: e.target.value })}
                                        placeholder="Ex: LON-GRU"
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Datas - Condicional */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Datas Disponíveis</h3>

                        {formData.tipo_oferta === 'DATA_FIXA' ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-semibold">Opções de Datas *</Label>
                                    <Button type="button" size="sm" onClick={handleAddDataFixa} variant="outline">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Adicionar Opção
                                    </Button>
                                </div>

                                {formData.datas_fixas && formData.datas_fixas.length > 0 ? (
                                    <div className="space-y-2">
                                        {formData.datas_fixas.map((data, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={data.datas_opcao}
                                                    onChange={(e) => handleDataFixaChange(index, e.target.value)}
                                                    placeholder="Ex: 06/05,13/05,19/05"
                                                    className="h-11"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveDataFixa(index)}
                                                    className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                                        Nenhuma opção de datas adicionada. Clique em "Adicionar Opção".
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Digite as datas separadas por vírgula (formato: DD/MM)
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Datas de IDA */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-semibold">🛫 Datas de IDA *</Label>
                                        <Button type="button" size="sm" onClick={() => handleAddDataFlexivel('IDA')} variant="outline">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Adicionar Mês
                                        </Button>
                                    </div>

                                    {datasIda.length > 0 ? (
                                        <div className="space-y-2">
                                            {datasIda.map((data, idx) => {
                                                const realIndex = formData.datas_flexiveis?.findIndex(d => d === data) || 0;
                                                return (
                                                    <div key={realIndex} className="flex gap-2">
                                                        <Select
                                                            value={data.mes_referencia || "none"}
                                                            onValueChange={(value) => handleDataFlexivelChange(realIndex, 'mes_referencia', value === "none" ? "" : value)}
                                                        >
                                                            <SelectTrigger className="h-11 w-40">
                                                                <SelectValue placeholder="Mês" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Selecione</SelectItem>
                                                                {MESES_ABREVIADOS.map((mes) => (
                                                                    <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            value={data.dias_disponiveis}
                                                            onChange={(e) => handleDataFlexivelChange(realIndex, 'dias_disponiveis', e.target.value)}
                                                            placeholder="Ex: 5,12,19,26"
                                                            className="h-11 flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveDataFlexivel(realIndex)}
                                                            className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                                            Nenhuma data de ida adicionada.
                                        </p>
                                    )}
                                </div>

                                {/* Datas de VOLTA */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-semibold">🛬 Datas de VOLTA *</Label>
                                        <Button type="button" size="sm" onClick={() => handleAddDataFlexivel('VOLTA')} variant="outline">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Adicionar Mês
                                        </Button>
                                    </div>

                                    {datasVolta.length > 0 ? (
                                        <div className="space-y-2">
                                            {datasVolta.map((data, idx) => {
                                                const realIndex = formData.datas_flexiveis?.findIndex(d => d === data) || 0;
                                                return (
                                                    <div key={realIndex} className="flex gap-2">
                                                        <Select
                                                            value={data.mes_referencia || "none"}
                                                            onValueChange={(value) => handleDataFlexivelChange(realIndex, 'mes_referencia', value === "none" ? "" : value)}
                                                        >
                                                            <SelectTrigger className="h-11 w-40">
                                                                <SelectValue placeholder="Mês" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Selecione</SelectItem>
                                                                {MESES_ABREVIADOS.map((mes) => (
                                                                    <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            value={data.dias_disponiveis}
                                                            onChange={(e) => handleDataFlexivelChange(realIndex, 'dias_disponiveis', e.target.value)}
                                                            placeholder="Ex: 12,19,26"
                                                            className="h-11 flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveDataFlexivel(realIndex)}
                                                            className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                                            Nenhuma data de volta adicionada.
                                        </p>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    Selecione o mês no combo (Jan a Dez) e informe os dias separados por vírgula
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                        <Switch
                            id="ativo"
                            checked={formData.ativo}
                            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                        />
                        <Label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
                            Oferta ativa (visível no site)
                        </Label>
                    </div>

                    {/* Visibilidade Site / TV */}
                    <div className="flex gap-6">
                        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg flex-1">
                            <Switch
                                id="mostrarNoSite"
                                checked={formData.mostrarNoSite ?? true}
                                onCheckedChange={(checked) => setFormData({ ...formData, mostrarNoSite: checked })}
                            />
                            <Label htmlFor="mostrarNoSite" className="text-sm font-medium cursor-pointer">
                                Mostrar no Site
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg flex-1">
                            <Switch
                                id="mostrarNaTv"
                                checked={formData.mostrarNaTv ?? false}
                                onCheckedChange={(checked) => setFormData({ ...formData, mostrarNaTv: checked })}
                            />
                            <Label htmlFor="mostrarNaTv" className="text-sm font-medium cursor-pointer">
                                Mostrar na TV
                            </Label>
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {oferta?.id ? 'Atualizar' : 'Criar'} Oferta
                        </Button>
                    </div>
                </form>
            </DialogContent >
        </Dialog >
    );
}
