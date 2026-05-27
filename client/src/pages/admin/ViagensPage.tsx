import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import TravelModal, { type ViagemFormData } from "@/components/TravelModal";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

type TravelFilter =
    | "all"
    | "really-active"
    | "showing-site"
    | "inactive"
    | "expired"
    | "expiring-soon"
    | "past-departure"
    | "hidden-from-site";

function parseDateOnly(value?: string | null): Date | null {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function addDays(base: Date, days: number): Date {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
}

function formatDateBr(value?: string | null): string {
    const parsed = parseDateOnly(value);
    if (!parsed) return "-";
    return parsed.toLocaleDateString("pt-BR");
}

function daysUntil(date: Date, from: Date): number {
    const diffMs = date.getTime() - from.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function ViagensPage() {
    const [travelModalOpen, setTravelModalOpen] = useState(false);
    const [selectedTravel, setSelectedTravel] = useState<any>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [travelToDelete, setTravelToDelete] = useState<{ id: number; titulo: string } | null>(null);
    const [travelFilter, setTravelFilter] = useState<TravelFilter>("all");

    // @ts-expect-error - tRPC types are generated when server is running
    const travelsQuery = trpc.viagens.listAdmin.useQuery(undefined);

    // @ts-expect-error - tRPC types are generated when server is running
    const createTravelMutation = trpc.viagens.create.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setTravelModalOpen(false);
            toast.success("Viagem criada com sucesso");
        },
        onError: (err: any) => {
            console.error("[viagens.create] error:", err);
            toast.error(`Erro ao criar viagem: ${err?.message || "erro desconhecido"}`);
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const updateTravelMutation = trpc.viagens.update.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setTravelModalOpen(false);
            toast.success("Viagem atualizada com sucesso");
        },
        onError: (err: any) => {
            console.error("[viagens.update] error:", err);
            toast.error(`Erro ao atualizar viagem: ${err?.message || "erro desconhecido"}`);
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteTravelMutation = trpc.viagens.delete.useMutation({
        onSuccess: () => {
            travelsQuery.refetch();
            setDeleteDialogOpen(false);
            toast.success("Viagem deletada com sucesso");
        },
        onError: (err: any) => {
            console.error("[viagens.delete] error:", err);
            toast.error(`Erro ao deletar viagem: ${err?.message || "erro desconhecido"}`);
        },
    });

    const travels: any[] = (travelsQuery.data as any)?.json || travelsQuery.data || [];
    const today = useMemo(() => startOfToday(), []);
    const expiringSoonLimit = useMemo(() => addDays(today, 7), [today]);

    const getTravelStatus = (travel: any) => {
        const departureDate = parseDateOnly(travel.dataIda);
        const expirationDate = parseDateOnly(travel.dataExpiracao);

        const isActive = !!travel.ativo;
        const isShowingOnSite = !!travel.mostrarNoSite;
        const isExpired = !!expirationDate && expirationDate < today;
        const isExpiringSoon = !!expirationDate && expirationDate >= today && expirationDate <= expiringSoonLimit;
        const hasFutureDeparture = !!departureDate && departureDate > today;
        const hasPastDeparture = !!departureDate && departureDate <= today;
        const isReallyActive = isActive && isShowingOnSite && hasFutureDeparture && !isExpired;

        return {
            departureDate,
            expirationDate,
            isActive,
            isShowingOnSite,
            isExpired,
            isExpiringSoon,
            hasFutureDeparture,
            hasPastDeparture,
            isReallyActive,
            daysToExpire: expirationDate ? daysUntil(expirationDate, today) : null,
        };
    };

    const filteredTravels = useMemo(() => {
        return travels.filter((travel) => {
            const status = getTravelStatus(travel);

            switch (travelFilter) {
                case "really-active":
                    return status.isReallyActive;
                case "showing-site":
                    return status.isShowingOnSite;
                case "inactive":
                    return !status.isActive;
                case "expired":
                    return status.isExpired;
                case "expiring-soon":
                    return status.isExpiringSoon;
                case "past-departure":
                    return status.hasPastDeparture;
                case "hidden-from-site":
                    return !status.isShowingOnSite;
                case "all":
                default:
                    return true;
            }
        });
    }, [travels, travelFilter, today, expiringSoonLimit]);

    const handleAddTravel = () => {
        setSelectedTravel(undefined);
        setTravelModalOpen(true);
    };

    const handleEditTravel = (travel: any) => {
        setSelectedTravel(travel);
        setTravelModalOpen(true);
    };

    const handleDeleteTravel = (id: number, titulo: string) => {
        setTravelToDelete({ id, titulo });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (travelToDelete) {
            deleteTravelMutation.mutate({ id: travelToDelete.id });
        }
    };

    const formatCurrency = (val: number) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSaveTravel = (viagem: ViagemFormData) => {
        const quantidadePessoas = Number(viagem.quantidadePessoas);
        const tipoViagem: "pacote" | "hospedagem" =
            viagem.tipoViagem === "hospedagem" ? "hospedagem" : "pacote";
        const payload: any = {
            titulo: viagem.titulo,
            slug: viagem.slug,
            descricao: viagem.descricao,
            tipoViagem,
            origem: viagem.origem,
            dataIda: viagem.dataIda || null,
            dataVolta: viagem.dataVolta || null,
            dataExpiracao: viagem.dataExpiracao || null,
            quantidadePessoas: Number.isFinite(quantidadePessoas) && quantidadePessoas > 0 ? quantidadePessoas : 1,
            valorTotal: viagem.valorTotal,
            quantidadeParcelas: viagem.quantidadeParcelas || null,
            valorParcela: viagem.valorParcela || null,
            temJuros: viagem.temJuros || false,
            xp: viagem.xp || 0,
            hospedagem: viagem.hospedagem || null,
            tipoQuarto: tipoViagem === "hospedagem" ? (viagem.tipoQuarto || null) : null,
            imagemUrl: viagem.imagemUrl,
            ativo: viagem.ativo !== false,
            mostrarNoSite: viagem.mostrarNoSite !== false,
            mostrarNaTv: viagem.mostrarNaTv === true,
            categoriaIds: viagem.categoriaIds || [],
            destaqueIds: viagem.destaqueIds || [],
        };

        // Attach image payload if present
        if (viagem.imagem) {
            payload.imagem = viagem.imagem;
        }

        console.log("[viagens.save] payload:", JSON.parse(JSON.stringify(payload)));

        if (viagem.id) {
            updateTravelMutation.mutate({ id: viagem.id, ...payload });
        } else {
            createTravelMutation.mutate(payload);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Viagens</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie as viagens disponíveis para reserva
                        </p>
                    </div>
                    <Button
                        onClick={handleAddTravel}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Viagem
                    </Button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="text-sm text-gray-600 min-w-fit">
                        Exibindo <span className="font-semibold text-gray-900">{filteredTravels.length}</span> de <span className="font-semibold text-gray-900">{travels.length}</span> viagens
                    </div>
                    <div className="md:ml-auto w-full md:w-[320px]">
                        <Select value={travelFilter} onValueChange={(v: TravelFilter) => setTravelFilter(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar viagens" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="really-active">Realmente ativas</SelectItem>
                                <SelectItem value="showing-site">Mostrando no site</SelectItem>
                                <SelectItem value="inactive">Inativas</SelectItem>
                                <SelectItem value="expired">Expiradas</SelectItem>
                                <SelectItem value="expiring-soon">Para expirar (7 dias)</SelectItem>
                                <SelectItem value="past-departure">Data de ida passada</SelectItem>
                                <SelectItem value="hidden-from-site">Ocultas do site</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Travels Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {travelsQuery.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando viagens...
                        </div>
                    ) : travels.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                                <Plus className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhuma viagem cadastrada</p>
                            <Button onClick={handleAddTravel} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar primeira viagem
                            </Button>
                        </div>
                    ) : filteredTravels.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Nenhuma viagem encontrada para o filtro selecionado.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Origem
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ativo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Expiração
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTravels.map((travel: any) => {
                                    const status = getTravelStatus(travel);
                                    return (
                                        <tr
                                            key={travel.id}
                                            className="hover:bg-blue-50/50 transition-all duration-200"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{travel.titulo}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${travel.tipoViagem === 'hospedagem' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {travel.tipoViagem === 'hospedagem' ? 'Hospedagem' : 'Pacote'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">{travel.origem || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-blue-600">{formatCurrency(travel.valorTotal)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${travel.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {travel.ativo ? 'Sim' : 'Não'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-gray-700">{formatDateBr(travel.dataExpiracao)}</span>
                                                    {status.isExpired && (
                                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            Expirada
                                                        </span>
                                                    )}
                                                    {!status.isExpired && status.isExpiringSoon && (
                                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                            Expira em {status.daysToExpire} dia{status.daysToExpire === 1 ? '' : 's'}
                                                        </span>
                                                    )}
                                                    {!travel.dataExpiracao && (
                                                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            Sem expiração
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditTravel(travel)}
                                                        className="h-9 w-9 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                                        aria-label="Editar viagem"
                                                    >
                                                        <SquarePen className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteTravel(travel.id!, travel.titulo)}
                                                        className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                        aria-label="Excluir viagem"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modals */}
                <TravelModal
                    isOpen={travelModalOpen}
                    onClose={() => setTravelModalOpen(false)}
                    onSave={handleSaveTravel}
                    initialData={selectedTravel}
                    isLoading={createTravelMutation.isPending || updateTravelMutation.isPending}
                />

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Excluir Viagem"
                    itemName={travelToDelete?.titulo}
                    onConfirm={handleConfirmDelete}
                    isLoading={deleteTravelMutation.isPending}
                />
            </div>
        </AdminLayout>
    );
}
