import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapPin, Users, Building2, Moon, MessageCircle, AlertTriangle, Bed } from "lucide-react";
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
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
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

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        const monthMap: Record<string, string> = {
            '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr', '05': 'mai', '06': 'jun',
            '07': 'jul', '08': 'ago', '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
        };
        try {
            const isoMatch = dateStr.match(/^\d{4}-(\d{2})-(\d{2})/);
            if (isoMatch) {
                const day = parseInt(isoMatch[2]).toString().padStart(2, '0');
                const month = monthMap[isoMatch[1]] || isoMatch[1];
                const year = dateStr.slice(0, 4);
                return `${day} ${month} ${year}`;
            }
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const day = date.getUTCDate().toString().padStart(2, '0');
                const monthKey = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                const month = monthMap[monthKey] || monthKey;
                const year = date.getUTCFullYear();
                return `${day} ${month} ${year}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const calculateNights = (dataIda: string | null | undefined, dataVolta: string | null | undefined): number | null => {
        if (!dataIda || !dataVolta) return null;
        const start = new Date(dataIda);
        const end = new Date(dataVolta);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        const diffMs = end.getTime() - start.getTime();
        const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return nights > 0 ? nights : null;
    };

    function buildViagemWhatsAppLink(viagem: any, rawNumber: string): string {
        const number = rawNumber.replace(/\D/g, '');
        const message = `Olá! Tenho interesse na viagem:\n\n` +
            `📋 Código: #${viagem.id}\n` +
            `✈️ ${viagem.titulo}\n` +
            `👥 ${viagem.quantidadePessoas} ${viagem.quantidadePessoas === 1 ? 'viajante' : 'viajantes'}\n` +
            `💰 ${formatCurrency(viagem.valorTotal)}\n\n` +
            `Gostaria de mais informações!`;
        return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    }

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
                            <div key={travel.id} className="bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col h-auto min-h-[420px] md:min-h-[500px]">
                                {/* Imagem + Badges + Título/Origem */}
                                <div className="relative h-[54%] md:h-[52%] overflow-hidden">
                                    <img src={travel.imagemUrl} alt={travel.titulo} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                                    {travel.destaques?.length > 0 && (
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            {travel.destaques.map((d: any) => (
                                                <span key={d.id} className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">{d.nome}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-3 md:px-5 md:pb-3 md:pt-5 text-white">
                                        <h3 className="text-[15px] md:text-lg font-bold leading-tight line-clamp-2">{travel.titulo}</h3>
                                        {travel.tipoViagem === "hospedagem" ? (
                                            <div className="flex items-center gap-1.5 text-white/90 text-[11px] md:text-sm mt-0.5 md:mt-1">
                                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>{travel.hospedagem && String(travel.hospedagem).trim() ? travel.hospedagem : "Hospedagem não informada"}</span>
                                            </div>
                                        ) : travel.origem && (
                                            <div className="flex items-center gap-1.5 text-white/90 text-[11px] md:text-sm mt-0.5 md:mt-1">
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>Saindo de {travel.origem}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Info Section */}
                                <div className="pl-4 pr-4 pb-4 pt-3 md:pl-5 md:pr-5 md:pb-5 md:pt-5 flex flex-col flex-1">
                                    <div className="grid grid-rows-3 gap-1.5 md:gap-2 text-gray-500 text-xs md:text-sm">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Moon className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">
                                                {travel.dataIda && travel.dataVolta
                                                    ? (() => {
                                                        const nights = calculateNights(travel.dataIda, travel.dataVolta);
                                                        const rangeText = `${formatDate(travel.dataIda)} a ${formatDate(travel.dataVolta)}`;
                                                        return nights != null
                                                            ? `${nights} ${nights === 1 ? 'noite' : 'noites'} · ${rangeText}`
                                                            : rangeText;
                                                    })()
                                                    : formatDate(travel.dataIda) || formatDate(travel.dataVolta) || "Data não informada"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">
                                                {travel.quantidadePessoas} {travel.tipoViagem === "hospedagem"
                                                    ? (travel.quantidadePessoas === 1 ? "hóspede" : "hóspedes")
                                                    : (travel.quantidadePessoas === 1 ? "viajante" : "viajantes")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {travel.tipoViagem === "hospedagem" ? (
                                                <>
                                                    <Bed className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {travel.tipoQuarto && String(travel.tipoQuarto).trim()
                                                            ? travel.tipoQuarto
                                                            : "Tipo de quarto não informado"}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {travel.hospedagem && String(travel.hospedagem).trim()
                                                            ? travel.hospedagem
                                                            : "Hospedagem não informada"}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="my-3 md:my-2 border-t border-gray-200/80" />
                                    <div className="mt-0 md:mt-auto flex flex-col md:grid md:grid-cols-[55%_45%] md:gap-4 md:items-end">
                                        <div>
                                            <p className="text-xs md:text-sm text-gray-500">Apartir de</p>
                                            <p className="text-base md:text-xl font-bold text-accent">{formatCurrency(travel.valorTotal)}</p>
                                            {travel.quantidadeParcelas && travel.valorParcela ? (
                                                <p className="text-xs md:text-sm text-gray-500">
                                                    ou {travel.quantidadeParcelas}x de {formatCurrency(travel.valorParcela)} {travel.temJuros ? 'com\u00A0juros' : 'sem\u00A0juros'}
                                                </p>
                                            ) : null}
                                            {travel.xp > 0 && (
                                                <p className="mt-1 text-xs md:text-sm font-semibold text-amber-600">
                                                    Acumule +{Number(travel.xp).toLocaleString('pt-BR')} pontos XP
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex h-full items-end justify-end pr-2">
                                            <a
                                                href={buildViagemWhatsAppLink(travel, travel.whatsappNumber || '5599999999999')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mr-2 inline-flex items-center gap-1.5 bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow px-3 py-1.5 text-xs md:text-sm"
                                            >
                                                <span>Tenho interesse</span>
                                                <MessageCircle className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
