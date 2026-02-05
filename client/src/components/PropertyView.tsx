import { useState, useEffect, useRef } from "react";
import { X, MapPin, Users, Bed, Bath, Home, ExternalLink, CheckCircle, Sofa, Ruler, DoorOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { trpc } from "@/lib/trpc";
import { SectionTitle } from "@/components/SectionTitle";
import { PropertyMap } from "@/components/PropertyMap";
import { SleepingArrangements } from "@/components/SleepingArrangements";
import type { PropertyWithDetails, PropertyImage, PropertyAmenity } from "@/types/properties";
import { BookingDatePicker } from "@/components/BookingDatePicker";
import { Button } from "@/components/ui/button";

interface Props {
    slug: string;
    onClose: () => void;
}

export function PropertyView({ slug, onClose }: Props) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const { data: property, isLoading } = trpc.properties.getBySlug.useQuery({ slug });
    const { data: companySettings } = trpc.companySettings.get.useQuery();
    const { data: propertyRooms = [] } = trpc.propertyRooms.listByProperty.useQuery(
        { propertyId: property?.id || 0 },
        { enabled: !!property?.id }
    );

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    if (isLoading) {
        return (
            <div className="w-full mt-24 mb-12">
                <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 relative">
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8 animate-pulse" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-8 bg-slate-200 rounded w-48"></div>
                            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="aspect-video bg-slate-200 rounded-xl mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="w-full mt-24 mb-12">
                <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 relative">
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8 text-center" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Propriedade não encontrada</h2>
                        <Button onClick={onClose}>Voltar</Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleWhatsAppClick = () => {
        if (!companySettings?.whatsapp) return;

        const checkIn = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'A definir';
        const checkOut = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'A definir';

        const message = `Olá! Tenho interesse na hospedagem:

                🏠 ${property.name}
                📍 ${property.city}, ${property.country}
                📅 Check-in: ${checkIn}
                📅 Check-out: ${checkOut}
                👥 ${property.max_guests} hóspedes

                Gostaria de mais informações!`;

        const phoneNumber = companySettings.whatsapp.replace(/\D/g, "");
        const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    return (
        <div className="w-full mt-24 mb-12">
            <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 relative">
                {/* Botão de fechar */}
                <button
                    onClick={onClose}
                    className="absolute -top-8 right-0 w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                    aria-label="Fechar detalhes da propriedade"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Cabeçalho */}
                <div className="flex items-start gap-4 md:gap-6 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 blur-2xl bg-accent/20 -z-10" />
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 text-white shadow-lg ring-4 ring-accent/15 flex items-center justify-center">
                            <Home className="w-7 h-7 md:w-8 md:h-8" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <SectionTitle
                            title={property.name.split(' ').slice(0, -1).join(' ')}
                            highlight={property.name.split(' ').slice(-1)[0]}
                            subtitle={`${property.city}${property.state_region ? `, ${property.state_region}` : ''} - ${property.country}`}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Container 1: Galeria de Imagens */}
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                        {property.images && property.images.length > 0 ? (
                            <div className="space-y-4">
                                <div className="aspect-video relative rounded-lg overflow-hidden bg-slate-100">
                                    <img
                                        src={property.images[currentImageIndex]?.image_url || '/placeholder-property.jpg'}
                                        alt={property.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                {property.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {property.images.map((image: PropertyImage, index: number) => (
                                            <button
                                                key={image.id}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index ? 'border-accent' : 'border-transparent'}`}
                                            >
                                                <img
                                                    src={image.image_url}
                                                    alt={`${property.name} - Foto ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                                <span className="text-slate-500">Sem imagens disponíveis</span>
                            </div>
                        )}
                    </div>

                    {/* Descrição curta e informações resumidas */}
                    {property.description_short && (
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {property.description_short}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-slate-600">
                                {/* Hóspedes */}
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{property.max_guests} hóspede{property.max_guests !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Área em m² */}
                                {property.area_m2 && (
                                    <>
                                        <span>·</span>
                                        <div className="flex items-center gap-1">
                                            <Ruler className="w-4 h-4" />
                                            <span>{property.area_m2} m²</span>
                                        </div>
                                    </>
                                )}

                                {/* Total de camas */}
                                {property.beds > 0 && (
                                    <>
                                        <span>·</span>
                                        <div className="flex items-center gap-1">
                                            <Bed className="w-4 h-4" />
                                            <span>{property.beds} cama{property.beds !== 1 ? 's' : ''}</span>
                                        </div>
                                    </>
                                )}

                                {/* Espaços agrupados por tipo */}
                                {propertyRooms.length > 0 && (() => {
                                    const roomCounts = propertyRooms.reduce((acc: Record<string, number>, room: any) => {
                                        const typeName = room.roomTypeName;
                                        acc[typeName] = (acc[typeName] || 0) + 1;
                                        return acc;
                                    }, {});

                                    const getRoomIcon = (type: string) => {
                                        const lowerType = type.toLowerCase();
                                        if (lowerType.includes('sala')) return <Sofa className="w-4 h-4" />;
                                        if (lowerType.includes('quarto') || lowerType.includes('suíte')) return <DoorOpen className="w-4 h-4" />;
                                        if (lowerType.includes('banheiro')) return <Bath className="w-4 h-4" />;
                                        return <Home className="w-4 h-4" />;
                                    };

                                    return Object.entries(roomCounts).map(([type, count], index) => (
                                        <div key={type} className="flex items-center gap-1">
                                            <span>·</span>
                                            {getRoomIcon(type)}
                                            <span>{count} {type}{count > 1 ? 's' : ''}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Container 2.5: Onde você vai dormir */}
                    <SleepingArrangements
                        propertyId={property.id}
                        primaryImage={property.images?.[0]?.image_url}
                    />

                    {/* Container 3: Comodidades */}
                    {property.amenities && property.amenities.length > 0 && (
                        <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                            <h3 className="text-lg font-semibold text-accent mb-4">Comodidades</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {property.amenities.map((amenity: PropertyAmenity) => (
                                    <div key={amenity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-muted/20">
                                        {amenity.icon && (
                                            <span className="text-accent text-lg">{amenity.icon}</span>
                                        )}
                                        <span className="text-sm text-slate-700">{amenity.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Container 5: Localização */}
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                        <h3 className="text-lg font-semibold text-accent mb-4">Localização</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-700">
                                <MapPin className="w-4 h-4 text-accent" />
                                <span className="text-sm">
                                    {property.city}{property.state_region ? `, ${property.state_region}` : ''} - {property.country}
                                </span>
                            </div>

                            {/* Mapa interativo */}
                            <PropertyMap
                                property={{
                                    address_street: property.address_street || undefined,
                                    address_number: property.address_number || undefined,
                                    city: property.city || undefined,
                                    state_region: property.state_region || undefined,
                                    country: property.country || undefined,
                                }}
                                height="400px"
                            />
                        </div>
                    </div>

                    {/* Container 5: Reserva */}
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                        <h3 className="text-lg font-semibold text-accent mb-4">Faça sua Reserva</h3>
                        <div className="space-y-4">
                            <BookingDatePicker
                                value={dateRange}
                                onChange={setDateRange}
                                mode="accommodation"
                            />

                            {/* Espaço reservado para texto de interesse */}
                            <div className="min-h-[44px] flex items-center">
                                {dateRange?.from && dateRange?.to && (
                                    <div className="w-full px-3 py-2 rounded-md bg-amber-50 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <div className="text-xs text-slate-700">
                                            <span className="font-semibold">Interesse:</span>{" "}
                                            {differenceInDays(dateRange.to, dateRange.from)} Noites - Check-in: {format(dateRange.from, "dd MMM", { locale: ptBR }).toUpperCase()} Check-out: {format(dateRange.to, "dd MMM", { locale: ptBR }).toUpperCase()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleWhatsAppClick}
                                className="bg-accent hover:bg-accent/90 text-white"
                                disabled={!companySettings?.whatsapp}
                            >
                                Solicitar Reserva via WhatsApp
                            </Button>

                            {!companySettings?.whatsapp && (
                                <p className="text-xs text-center text-slate-500">
                                    WhatsApp não configurado
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}