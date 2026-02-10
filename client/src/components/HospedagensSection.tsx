import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";
import { useState } from "react";
import { AllHospedagensModal } from "@/components/AllHospedagensModal";
import { PropertyView } from "@/components/PropertyView";
import { Users, MapPin } from "lucide-react";

interface Props {
    onPropertySelect: (slug: string) => void;
    onShowAllHospedagens: () => void;
}

export function HospedagensSection({ onPropertySelect, onShowAllHospedagens }: Props) {
    const { data: featuredProperties, isLoading } = trpc.properties.listFeatured.useQuery();

    if (isLoading) {
        return (
            <section className="py-8 md:py-12">
                <div className="container">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-xl p-4 space-y-3">
                                        <div className="aspect-video bg-slate-200 rounded-lg"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!featuredProperties || featuredProperties.length === 0) {
        return null;
    }

    return (
        <section className="py-16 md:py-24 bg-gray-50">
            <div className="container">
                <FadeInContainer>
                    <SectionTitle
                        title="Lugares Únicos para"
                        highlight="Se Hospedar"
                        subtitle="Descubra acomodações especiais de acordos exclusivos em destinos incríveis"
                    />
                </FadeInContainer>

                <FadeInContainer delay="1">
                    <div className="max-w-6xl mx-auto px-6">
                        {/* Grid responsivo de propriedades */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {featuredProperties.slice(0, 4).map((property: any) => (
                                <button
                                    key={property.id}
                                    onClick={() => onPropertySelect(property.slug)}
                                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-accent/20"
                                >
                                    {/* Imagem */}
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src={property.primary_image || '/placeholder-property.jpg'}
                                            alt={property.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="p-4 space-y-3">
                                        <h4 className="text-base lg:text-lg font-semibold text-slate-900 line-clamp-2 leading-tight text-left">
                                            {property.name}
                                        </h4>

                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-accent" />
                                            <span className="truncate">{property.city}, {property.country}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Users className="w-4 h-4 text-accent" />
                                            <span>Até {property.max_guests} hóspedes</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Link para ver todas */}
                        <div className="text-center">
                            <Button
                                onClick={onShowAllHospedagens}
                                variant="outline"
                                className="text-accent hover:bg-accent hover:text-white border-accent"
                            >
                                Ver todas as nossas hospedagens
                            </Button>
                        </div>
                    </div>
                </FadeInContainer>
            </div>

        </section>
    );
}