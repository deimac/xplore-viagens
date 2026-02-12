import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import VooPremiumModal from "@/components/VooPremiumModal";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

type ClasseVoo = 'PE' | 'BS' | 'FC';

const CLASSE_LABEL: Record<ClasseVoo, string> = {
    PE: 'Premium Economy',
    BS: 'Business',
    FC: 'First Class'
};

interface OfertaVooPremium {
    id?: number;
    tipo_oferta: 'DATA_FIXA' | 'DATA_FLEXIVEL';
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
    datas_fixas?: Array<{ datas_opcao: string }>;
    datas_flexiveis?: Array<{ tipo: 'IDA' | 'VOLTA'; mes_referencia: string; dias_disponiveis: string }>;
}

export default function VoosPremiumPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOferta, setSelectedOferta] = useState<OfertaVooPremium | undefined>();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number; titulo?: string }>({
        open: false
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const { data: ofertas = [], refetch } = trpc.ofertasVooPremium.list.useQuery();

    // @ts-expect-error - tRPC types are generated when server is running
    const createMutation = trpc.ofertasVooPremium.create.useMutation({
        onSuccess: () => {
            toast.success("Oferta criada com sucesso!");
            refetch();
            setIsModalOpen(false);
            setSelectedOferta(undefined);
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao criar oferta");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const updateMutation = trpc.ofertasVooPremium.update.useMutation({
        onSuccess: () => {
            toast.success("Oferta atualizada com sucesso!");
            refetch();
            setIsModalOpen(false);
            setSelectedOferta(undefined);
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar oferta");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteMutation = trpc.ofertasVooPremium.delete.useMutation({
        onSuccess: () => {
            toast.success("Oferta excluída com sucesso!");
            refetch();
            setDeleteDialog({ open: false });
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao excluir oferta");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const toggleActiveMutation = trpc.ofertasVooPremium.toggleActive.useMutation({
        onSuccess: () => {
            toast.success("Status atualizado com sucesso!");
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao atualizar status");
        },
    });

    const handleCreate = () => {
        setSelectedOferta(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (oferta: OfertaVooPremium) => {
        if (!oferta.id) return;
        setSelectedOferta(oferta);
        setIsModalOpen(true);
    };

    const handleDelete = (oferta: OfertaVooPremium) => {
        setDeleteDialog({
            open: true,
            id: oferta.id,
            titulo: oferta.titulo,
        });
    };

    const confirmDelete = () => {
        if (deleteDialog.id) {
            deleteMutation.mutate({ id: deleteDialog.id });
        }
    };

    const handleToggleStatus = (oferta: OfertaVooPremium) => {
        if (!oferta.id) return;
        toggleActiveMutation.mutate({
            id: oferta.id,
            ativo: !oferta.ativo,
        });
    };

    const handleSave = (oferta: OfertaVooPremium) => {
        if (oferta.id) {
            updateMutation.mutate(oferta);
        } else {
            createMutation.mutate(oferta);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Voos Premium
                        </h1>
                        <p className="text-muted-foreground mt-1">Gerencie ofertas de voos premium</p>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Oferta
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {ofertas.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Plus className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhuma oferta cadastrada</p>
                            <Button
                                onClick={handleCreate}
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar primeira oferta
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Destinos
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Companhia
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Classe
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Preço
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ofertas.map((oferta: OfertaVooPremium) => (
                                    <tr key={oferta.id} className="hover:bg-blue-50/50 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{oferta.titulo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{oferta.destinos_resumo || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">{oferta.companhia_aerea}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {CLASSE_LABEL[oferta.classe_voo]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                                                {oferta.tipo_oferta === 'DATA_FIXA' ? 'Fixa' : 'Flexível'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                R$ {oferta.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(oferta)}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all hover:shadow-md"
                                                style={{
                                                    background: oferta.ativo
                                                        ? 'linear-gradient(to right, rgb(74, 222, 128), rgb(16, 185, 129))'
                                                        : 'linear-gradient(to right, rgb(156, 163, 175), rgb(107, 114, 128))',
                                                    color: 'white'
                                                }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                {oferta.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(oferta)}
                                                    className="h-9 w-9 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                                    aria-label="Editar oferta"
                                                >
                                                    <SquarePen className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(oferta)}
                                                    className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                    aria-label="Excluir oferta"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            <VooPremiumModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOferta(undefined);
                }}
                onSave={handleSave}
                oferta={selectedOferta}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                onConfirm={confirmDelete}
                title="Excluir Oferta Premium"
                description={`Tem certeza que deseja excluir "${deleteDialog.titulo}"? Esta ação não pode ser desfeita.`}
            />
        </AdminLayout>
    );
}
