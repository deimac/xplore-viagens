import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import HeroSlideModal from "@/components/HeroSlideModal";
import DeleteConfirmDialog from "@/components/admin/common/DeleteConfirmDialog";

interface HeroSlide {
    id?: number;
    imageUrl: string;
    title: string;
    subtitle?: string | null;
    order: number;
    isActive: number;
    createdAt?: string;
    updatedAt?: string;
}

export default function SlidesHeroPage() {
    const [slideModalOpen, setSlideModalOpen] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState<HeroSlide | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [slideToDelete, setSlideToDelete] = useState<{ id: number; title: string } | null>(null);

    // @ts-expect-error - tRPC types are generated when server is running
    const slidesQuery = trpc.heroSlides.list.useQuery(undefined);

    // @ts-expect-error - tRPC types are generated when server is running
    const createSlideMutation = trpc.heroSlides.create.useMutation({
        onSuccess: () => {
            slidesQuery.refetch();
            setSlideModalOpen(false);
            toast.success("Slide criado com sucesso");
        },
        onError: () => {
            toast.error("Erro ao criar slide");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const updateSlideMutation = trpc.heroSlides.update.useMutation({
        onSuccess: () => {
            slidesQuery.refetch();
            setSlideModalOpen(false);
            toast.success("Slide atualizado com sucesso");
        },
        onError: () => {
            toast.error("Erro ao atualizar slide");
        },
    });

    // @ts-expect-error - tRPC types are generated when server is running
    const deleteSlideMutation = trpc.heroSlides.delete.useMutation({
        onSuccess: () => {
            slidesQuery.refetch();
            toast.success("Slide deletado com sucesso");
        },
        onError: () => {
            toast.error("Erro ao deletar slide");
        },
    });

    const handleAddSlide = () => {
        setSelectedSlide(undefined);
        setSlideModalOpen(true);
    };

    const handleEditSlide = (slide: HeroSlide) => {
        setSelectedSlide(slide);
        setSlideModalOpen(true);
    };

    const handleDeleteSlide = (id: number | undefined, title: string) => {
        if (!id) return;
        setSlideToDelete({ id, title });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (slideToDelete?.id) {
            deleteSlideMutation.mutate({ id: slideToDelete.id });
        }
        setSlideToDelete(null);
    };

    const handleSaveSlide = (slide: HeroSlide) => {
        if (slide.id) {
            updateSlideMutation.mutate({
                id: slide.id,
                imageUrl: slide.imageUrl,
                title: slide.title,
                subtitle: slide.subtitle || undefined,
                order: slide.order,
                isActive: slide.isActive,
            });
        } else {
            createSlideMutation.mutate({
                imageUrl: slide.imageUrl,
                title: slide.title,
                subtitle: slide.subtitle || undefined,
                order: slide.order,
                isActive: slide.isActive,
            });
        }
    };

    const slides = slidesQuery.data || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Slides Hero</h1>
                        <p className="text-muted-foreground mt-1">Gerencie os slides da página inicial</p>
                    </div>
                    <Button
                        onClick={handleAddSlide}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Slide
                    </Button>
                </div>

                {/* Slides Table */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {slidesQuery.isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            Carregando slides...
                        </div>
                    ) : slides.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                                <Plus className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-muted-foreground mb-4">Nenhum slide cadastrado</p>
                            <Button onClick={handleAddSlide} variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar primeiro slide
                            </Button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        Preview
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        Título
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                                        Subtítulo
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                        Ordem
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {slides.map((slide: HeroSlide) => (
                                    <tr
                                        key={slide.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <img
                                                src={slide.imageUrl}
                                                alt={slide.title}
                                                className="w-24 h-16 object-cover rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {slide.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {slide.subtitle || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                            {slide.order}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${slide.isActive === 1
                                                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${slide.isActive === 1 ? 'bg-white' : 'bg-gray-500'}`}></span>
                                                {slide.isActive === 1 ? "Ativo" : "Inativo"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditSlide(slide)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    aria-label="Editar slide"
                                                >
                                                    <SquarePen className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSlide(slide.id, slide.title)}
                                                    disabled={deleteSlideMutation.isPending}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    aria-label="Excluir slide"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            <HeroSlideModal
                isOpen={slideModalOpen}
                onClose={() => setSlideModalOpen(false)}
                slide={selectedSlide}
                onSave={handleSaveSlide}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Excluir Slide"
                itemName={slideToDelete?.title}
                onConfirm={handleConfirmDelete}
                isLoading={deleteSlideMutation.isPending}
            />
        </AdminLayout>
    );
}
