import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

export default function AvaliacoesPage() {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<{ id: number; clientName: string } | null>(null);

    // @ts-expect-error - tRPC types are generated when server is running
    const reviewsQuery = trpc.reviews.list.useQuery(undefined);

    // @ts-expect-error - tRPC types are generated when server is running
    const updateReviewStatusMutation = trpc.reviews.updateStatus.useMutation({
        onSuccess: () => {
            reviewsQuery.refetch();
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteReviewMutation = trpc.reviews.delete.useMutation({
        onSuccess: () => {
            reviewsQuery.refetch();
            setDeleteDialogOpen(false);
            toast.success("Avaliação excluída com sucesso");
        },
        onError: () => {
            toast.error("Erro ao excluir avaliação");
        },
    });

    const reviews = reviewsQuery.data || [];
    const pendingCount = reviews.filter((r: any) => r.status === 'pending').length;

    const handleApprove = (id: number) => {
        updateReviewStatusMutation.mutate(
            { id, status: 'approved' },
            {
                onSuccess: () => toast.success('Avaliação aprovada'),
                onError: () => toast.error('Erro ao aprovar avaliação'),
            }
        );
    };

    const handleReject = (id: number) => {
        updateReviewStatusMutation.mutate(
            { id, status: 'rejected' },
            {
                onSuccess: () => toast.success('Avaliação rejeitada'),
                onError: () => toast.error('Erro ao rejeitar avaliação'),
            }
        );
    };

    const handleDeleteReview = (id: number, clientName: string) => {
        setReviewToDelete({ id, clientName });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (reviewToDelete) {
            deleteReviewMutation.mutate({ id: reviewToDelete.id });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Avaliações</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie as avaliações dos clientes
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-xl border border-amber-200 shadow-md">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                            {pendingCount}
                        </div>
                        <span className="text-sm font-semibold">pendente{pendingCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Reviews Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {reviewsQuery.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando avaliações...
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                                <Star className="w-8 h-8 text-amber-600" />
                            </div>
                            <p className="text-muted-foreground mb-2">Nenhuma avaliação ainda</p>
                            <p className="text-sm text-muted-foreground">
                                As avaliações dos clientes aparecerão aqui
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Avaliação
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Comentário
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">{reviews.map((review: any) => (
                                <tr
                                    key={review.id}
                                    className="hover:bg-amber-50/50 transition-all duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {review.author?.avatarUrl ? (
                                                <img
                                                    src={review.author.avatarUrl}
                                                    alt={review.author.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                                    {(review.author?.name || 'C')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {review.author?.name || 'Cliente'}
                                                </p>
                                                <p className="text-xs text-gray-500">{review.author?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < review.rating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'fill-gray-200 text-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                            {review.comment}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${review.status === 'approved'
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                                : review.status === 'rejected'
                                                    ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                                                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                                                }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                            {review.status === 'approved'
                                                ? 'Aprovada'
                                                : review.status === 'rejected'
                                                    ? 'Rejeitada'
                                                    : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {review.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleApprove(review.id)}
                                                        className="h-9 w-9 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all"
                                                        aria-label="Aprovar avaliação"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleReject(review.id)}
                                                        className="h-9 w-9 rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all"
                                                        aria-label="Rejeitar avaliação"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteReview(review.id, review.author?.name || 'Cliente')}
                                                className="h-9 w-9 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                                                aria-label="Excluir avaliação"
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

                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Excluir Avaliação"
                    description={`Tem certeza que deseja excluir a avaliação de ${reviewToDelete?.clientName}?`}
                    itemName={reviewToDelete?.clientName}
                    onConfirm={handleConfirmDelete}
                    isLoading={deleteReviewMutation.isPending}
                />
            </div>
        </AdminLayout>
    );
}