import { useState } from "react";
import { X, MapPin, Users } from "lucide-react";
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
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold">Nossas Hospedagens</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
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
                                <div className="mb-6 flex flex-wrap gap-2">
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
                            <div className="space-y-8">
                                {visibleCities.map((cityCountry) => {
                                    const properties = propertiesGrouped?.[cityCountry] || [];
                                    return (
                                        <div key={cityCountry} className="space-y-6">
                                            {visibleCities.length > 1 && (
                                                <div className="text-center md:text-left">
                                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                        Fique em <span className="text-accent">{cityCountry}</span>
                                                    </h3>
                                                    <div className="w-16 h-1 bg-accent mx-auto md:mx-0 rounded-full"></div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {properties.map((property: Property) => (
                                                    <button
                                                        key={property.id}
                                                        onClick={() => handlePropertyClick(property.slug)}
                                                        className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-accent/20"
                                                    >
                                                        <div className="aspect-video relative overflow-hidden">
                                                            <img
                                                                src={property.primary_image || '/placeholder-property.jpg'}
                                                                alt={property.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                loading="lazy"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        </div>
                                                        <div className="p-4 space-y-3">
                                                            <h4 className="text-base font-semibold text-slate-900 line-clamp-2 text-left">
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
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}