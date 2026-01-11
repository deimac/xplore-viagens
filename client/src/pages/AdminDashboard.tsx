import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Star, Check, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import CategoryModal from "@/components/CategoryModal";
import TravelModal from "@/components/TravelModal";
import HeroSlideModal from "@/components/HeroSlideModal";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Category {
  id?: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Travel {
  id?: number;
  title: string;
  description: string;
  origin: string;
  departureDate: string | null;
  returnDate: string | null;
  travelers: string | null;
  price: string;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

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

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"categories" | "travels" | "slides" | "reviews" | "settings">(
    "categories"
  );
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedTravel, setSelectedTravel] = useState<Travel | undefined>();
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<HeroSlide | undefined>();

  // tRPC queries
  const categoriesQuery = trpc.categories.list.useQuery(undefined);
  const travelsQuery = trpc.travels.list.useQuery(undefined);
  const slidesQuery = trpc.heroSlides.list.useQuery(undefined);
  const reviewsQuery = trpc.reviews.list.useQuery(undefined);

  // Review mutations
  const updateReviewStatusMutation = trpc.reviews.updateStatus.useMutation({
    onSuccess: () => {
      reviewsQuery.refetch();
    },
  });
  const deleteReviewMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      reviewsQuery.refetch();
    },
  });

  // tRPC mutations
  const createCategoryMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      setCategoryModalOpen(false);
      toast.success("Categoria criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar categoria");
    },
  });

  const updateCategoryMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      setCategoryModalOpen(false);
      toast.success("Categoria atualizada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria");
    },
  });

  const deleteCategoryMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch();
      toast.success("Categoria deletada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar categoria");
    },
  });

  const createTravelMutation = trpc.travels.create.useMutation({
    onSuccess: () => {
      travelsQuery.refetch();
      setTravelModalOpen(false);
      toast.success("Viagem criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar viagem");
    },
  });

  const updateTravelMutation = trpc.travels.update.useMutation({
    onSuccess: () => {
      travelsQuery.refetch();
      setTravelModalOpen(false);
      toast.success("Viagem atualizada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar viagem");
    },
  });

  const deleteTravelMutation = trpc.travels.delete.useMutation({
    onSuccess: () => {
      travelsQuery.refetch();
      toast.success("Viagem deletada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar viagem");
    },
  });

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

  const deleteSlideMutation = trpc.heroSlides.delete.useMutation({
    onSuccess: () => {
      slidesQuery.refetch();
      toast.success("Slide deletado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao deletar slide");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  // Category handlers
  const handleAddCategory = () => {
    setSelectedCategory(undefined);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: number | undefined) => {
    if (!id) return;
    if (confirm("Tem certeza que deseja deletar esta categoria?")) {
      deleteCategoryMutation.mutate({ id });
    }
  };

  const handleSaveCategory = (category: Category) => {
    if (category.id) {
      updateCategoryMutation.mutate({
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        icon: category.icon || undefined,
      });
    } else {
      createCategoryMutation.mutate({
        name: category.name,
        description: category.description || undefined,
        icon: category.icon || undefined,
      });
    }
  };

  // Travel handlers
  const handleAddTravel = () => {
    setSelectedTravel(undefined);
    setTravelModalOpen(true);
  };

  const handleEditTravel = (travel: Travel) => {
    setSelectedTravel(travel);
    setTravelModalOpen(true);
  };

  const handleDeleteTravel = (id: number | undefined) => {
    if (!id) return;
    if (confirm("Tem certeza que deseja deletar esta viagem?")) {
      deleteTravelMutation.mutate({ id });
    }
  };

  const handleSaveTravel = (travel: Travel) => {
    if (travel.id) {
      updateTravelMutation.mutate({
        id: travel.id,
        title: travel.title,
        description: travel.description,
        origin: travel.origin,
        departureDate: travel.departureDate || "",
        returnDate: travel.returnDate || "",
        travelers: travel.travelers || "",
        price: travel.price,
        imageUrl: travel.imageUrl || "",
      });
    } else {
      createTravelMutation.mutate({
        title: travel.title,
        description: travel.description,
        origin: travel.origin,
        departureDate: travel.departureDate || "",
        returnDate: travel.returnDate || "",
        travelers: travel.travelers || "",
        price: travel.price,
        imageUrl: travel.imageUrl || "",
      });
    }
  };

  // Hero Slide handlers
  const handleAddSlide = () => {
    setSelectedSlide(undefined);
    setSlideModalOpen(true);
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setSelectedSlide(slide);
    setSlideModalOpen(true);
  };

  const handleDeleteSlide = (id: number | undefined) => {
    if (!id) return;
    if (confirm("Tem certeza que deseja deletar este slide?")) {
      deleteSlideMutation.mutate({ id });
    }
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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem("adminToken");
    navigate("/");
    toast.success("Logout realizado com sucesso");
  };

  const categories: Category[] = (categoriesQuery.data as any)?.json || categoriesQuery.data || [];
  const travels: Travel[] = (travelsQuery.data as any)?.json || travelsQuery.data || [];
  const slides = (slidesQuery.data as any)?.json || slidesQuery.data || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie categorias, viagens e conteúdo do site
          </p>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-muted">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "categories"
                ? "text-accent border-b-2 border-accent"
                : "text-accent/60 hover:text-accent"
            }`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveTab("travels")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "travels"
                ? "text-accent border-b-2 border-accent"
                : "text-accent/60 hover:text-accent"
            }`}
          >
            Viagens
          </button>
          <button
            onClick={() => setActiveTab("slides")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "slides"
                ? "text-accent border-b-2 border-accent"
                : "text-accent/60 hover:text-accent"
            }`}
          >
            Slides Hero
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reviews"
                ? "text-accent border-b-2 border-accent"
                : "text-accent/60 hover:text-accent"
            }`}
          >
            Avaliações
          </button>
          <button
            onClick={() => navigate("/admin/configuracoes")}
            className="px-4 py-2 font-medium text-accent/60 hover:text-accent transition-colors"
          >
            Configurações
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-accent">Categorias</h2>
              <Button
                onClick={handleAddCategory}
                className="flex items-center gap-2 bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </Button>
            </div>

            {/* Categories Table */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              {categoriesQuery.isLoading ? (
                <div className="p-6 text-center text-accent/60">
                  Carregando categorias...
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Nome
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Descrição
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Ícone
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-accent">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b border-muted hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/70">
                          {category.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/70">
                          {category.icon || "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-accent hover:bg-muted/30 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategoryMutation.isPending}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
        )}

        {/* Slides Hero Tab */}
        {activeTab === "slides" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-accent">Slides Hero</h2>
              <Button
                onClick={handleAddSlide}
                className="flex items-center gap-2 bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Novo Slide
              </Button>
            </div>

            {/* Slides Table */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              {slidesQuery.isLoading ? (
                <div className="p-6 text-center text-accent/60">
                  Carregando slides...
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Preview
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Título
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Subtítulo
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-accent">
                        Ordem
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-accent">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-accent">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slides.map((slide: HeroSlide) => (
                      <tr
                        key={slide.id}
                        className="border-b border-muted hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {slide.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/70">
                          {slide.subtitle || "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-accent/70">
                          {slide.order}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              slide.isActive === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {slide.isActive === 1 ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditSlide(slide)}
                              className="p-2 text-accent hover:bg-muted/30 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide.id)}
                              disabled={deleteSlideMutation.isPending}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
        )}

        {/* Travels Tab */}
        {activeTab === "travels" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-accent">Viagens</h2>
              <Button
                onClick={handleAddTravel}
                className="flex items-center gap-2 bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Nova Viagem
              </Button>
            </div>

            {/* Travels Table */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              {travelsQuery.isLoading ? (
                <div className="p-6 text-center text-accent/60">
                  Carregando viagens...
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Título
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Origem
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Data Ida
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Preço
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-accent">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {travels.map((travel) => (
                      <tr
                        key={travel.id}
                        className="border-b border-muted hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {travel.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/70">
                          {travel.origin}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent/70">
                          {travel.departureDate}
                        </td>
                        <td className="px-6 py-4 text-sm text-accent font-medium">
                          {travel.price}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditTravel(travel)}
                              className="p-2 text-accent hover:bg-muted/30 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTravel(travel.id)}
                              disabled={deleteTravelMutation.isPending}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-accent">Avaliações</h2>
              <div className="text-sm text-muted-foreground">
                {reviewsQuery.data?.filter(r => r.status === 'pending').length || 0} pendente{reviewsQuery.data?.filter(r => r.status === 'pending').length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-card rounded-lg shadow-lg overflow-hidden">
              {reviewsQuery.isLoading ? (
                <div className="p-6 text-center text-accent/60">
                  Carregando avaliações...
                </div>
              ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Avaliação
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Comentário
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-accent">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-accent">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsQuery.data.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-muted hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {review.author?.avatarUrl && (
                              <img
                                src={review.author.avatarUrl}
                                alt={review.author.name}
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {review.author?.name || 'Cliente'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {review.author?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-accent/70 line-clamp-2 max-w-md">
                            {review.comment}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              review.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : review.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
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
                                <button
                                  onClick={() => {
                                    updateReviewStatusMutation.mutate(
                                      { id: review.id, status: 'approved' },
                                      {
                                        onSuccess: () => toast.success('Avaliação aprovada'),
                                        onError: () => toast.error('Erro ao aprovar avaliação'),
                                      }
                                    );
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Aprovar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    updateReviewStatusMutation.mutate(
                                      { id: review.id, status: 'rejected' },
                                      {
                                        onSuccess: () => toast.success('Avaliação rejeitada'),
                                        onError: () => toast.error('Erro ao rejeitar avaliação'),
                                      }
                                    );
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Rejeitar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
                                  deleteReviewMutation.mutate(
                                    { id: review.id },
                                    {
                                      onSuccess: () => toast.success('Avaliação excluída'),
                                      onError: () => toast.error('Erro ao excluir avaliação'),
                                    }
                                  );
                                }
                              }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma avaliação ainda</p>
                  <p className="text-sm text-muted-foreground">
                    As avaliações dos clientes aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialData={selectedCategory}
        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      />
      <TravelModal
        isOpen={travelModalOpen}
        onClose={() => setTravelModalOpen(false)}
        onSave={handleSaveTravel}
        initialData={selectedTravel}
        isLoading={createTravelMutation.isPending || updateTravelMutation.isPending}
      />
      <HeroSlideModal
        open={slideModalOpen}
        onClose={() => setSlideModalOpen(false)}
        onSave={handleSaveSlide}
        slide={selectedSlide}
      />
    </div>
    </AdminLayout>
  );
}
