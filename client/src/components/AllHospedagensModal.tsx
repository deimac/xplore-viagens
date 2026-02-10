import { useState } from "react";
import { X } from "lucide-react";
import { HospedagemCard } from "./HospedagemCard";
import { StandardContainer } from "@/components/StandardContainer";
import { trpc } from "@/lib/trpc";
import type { PropertyGrouped, Property } from "@/types/properties";
import { Button } from "@/components/ui/button";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onPropertySelect: (slug: string) => void;
}

export function AllHospedagensModal({ isOpen, onClose, onPropertySelect }: Props) {
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const { data: propertiesGrouped, isLoading } = trpc.properties.listActive.useQuery();


    if (!isOpen) return null;

    const cities = propertiesGrouped ? Object.keys(propertiesGrouped) : [];
    const visibleCities = selectedCity ? [selectedCity] : cities;

    const handlePropertyClick = (slug: string) => {
        onPropertySelect(slug);
        // Não fechar o modal aqui, pois a lógica de exibição será controlada pelo componente pai
    };

    return (
        <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0 mx-4 md:mx-8">
                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="bg-slate-200 rounded-xl h-48"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Navigation buttons */}
                        {cities.length > 1 && (
                            <div className="mb-6 flex flex-wrap gap-2 mx-4 md:mx-8">
                                <Button
                                    variant={selectedCity === null ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCity(null)}
                                >
                                    Todas
                                </Button>
                                {cities.map((city) => (
                                    <Button
                                        key={city}
                                        variant={selectedCity === city ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCity(city)}
                                    >
                                        Fique em {city.split(',')[0]}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Properties */}
                        <div className="space-y-6">
                            {visibleCities.map((cityCountry) => {
                                const properties = propertiesGrouped?.[cityCountry] || [];
                                return (
                                    <StandardContainer key={cityCountry} padding="default" withOuterBorder={true} className="mx-4 md:mx-8">
                                        <div className="px-4 pt-1 pb-0 bg-white">
                                            <h3 className="text-base md:text-lg font-semibold text-accent mb-1">
                                                Fique em {cityCountry}
                                            </h3>
                                            <hr className="border-t border-slate-200 mb-1" />
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {properties.map((property: Property) => (
                                                    <HospedagemCard
                                                        key={property.id}
                                                        property={property}
                                                        onClick={() => handlePropertyClick(property.slug)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </StandardContainer>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}