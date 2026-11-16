import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AlertTriangle } from "lucide-react";
import { PackageCard } from "@/components/PackageCard";
import { X } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import PackagesCarousel from "@/components/PackagesCarousel";
import { Button } from "@/components/ui/button";
import CategoryFilter from "@/components/CategoryFilter";

interface Props {
    onClose: () => void;
}

export function AllPacotesView({ onClose }: Props) {
    // Utilitários
    const [selectedCategory, setSelectedCategory] = useState<number | string | null>(null);
    const travelsQuery = trpc.viagens.list.useQuery();
    const categoriesQuery = trpc.categorias.list.useQuery();
    const isAllowedByDepartureDate = (travel: any) => {
        if (!travel?.dataIda) return false;
        const departure = new Date(travel.dataIda);
        if (Number.isNaN(departure.getTime())) return false;
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        departure.setHours(0, 0, 0, 0);

        // Check if departure date is in the future
        if (departure <= todayStart) return false;

        // Check if travel is active
        if (!travel.ativo) return false;

        // Check if expiration date is in the future (or not set)
        if (travel.dataExpiracao) {
            const expiration = new Date(travel.dataExpiracao);
            if (!Number.isNaN(expiration.getTime())) {
                expiration.setHours(0, 0, 0, 0);
                if (expiration <= todayStart) return false;
            }
        }

        return true;
    };

    const allTravels = ((travelsQuery.data as any)?.json || travelsQuery.data || []).filter(isAllowedByDepartureDate);
    const allCategories = (categoriesQuery.data as any)?.json || categoriesQuery.data || [];

    const categoriesWithTravels = allCategories.filter((cat: any) => {
        return allTravels.some((travel: any) =>
            travel.categorias?.some((c: any) => c.id === cat.id)
        );
    });

    const filteredTravels = selectedCategory
        ? allTravels.filter((travel: any) =>
            travel.categorias?.some((c: any) => c.id === selectedCategory)
        )
        : allTravels;

    return (
        <div className="w-full mb-12">
            <div className="max-w-7xl mx-auto px-0 md:px-2 py-8">
                <div className="relative mt-40 md:mt-48 mb-2 md:mb-4">
                    {/* Botão de fechar alinhado com o container */}
                    <div className="flex justify-end mx-8 md:mx-16">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                            aria-label="Fechar lista de pacotes"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-start gap-4 md:gap-6 mb-2 mt-1 md:mt-0">
                        <div className="flex-1">
                            <SectionTitle
                                title="Ofertas de"
                                highlight="Destinos"
                                subtitle="Deixe-nos inspirar sua próxima viagem"
                                align="center"
                                className="mb-1"
                            />
                        </div>
                    </div>
                </div>
                {/* Cards de pacotes */}
                <div className="mt-16">
                    {/* Filtros de categorias igual à sessão destinos */}
                    <div className="mb-8 flex justify-center">
                        <div className="max-w-2xl w-full">
                            <CategoryFilter
                                categories={categoriesWithTravels}
                                selectedCategory={selectedCategory}
                                onCategoryChange={setSelectedCategory}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {filteredTravels.map((travel: any) => (
                            <PackageCard
                                key={travel.id}
                                travel={travel}
                                whatsappNumber={travel.whatsappNumber || '5599999999999'}
                                className="shadow-lg h-auto min-h-[420px] md:min-h-[500px]"
                            />
                        ))}
                    </div>
                    {/* Aviso de tarifas */}
                    <div className="mt-8 mb-4 px-2 flex justify-center">
                        <div className="w-full max-w-[280px] md:max-w-md inline-flex items-center justify-center gap-2 text-[11px] md:text-xs text-amber-600 text-center">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                            <p>
                                Tarifas sujeitas a alteração e disponibilidade.<br />
                                Consulte disponibilidade para datas diferentes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
