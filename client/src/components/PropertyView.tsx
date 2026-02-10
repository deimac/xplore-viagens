import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { X, Share2 } from "lucide-react";
import { Home, Users, Ruler, Bed, MapPin, CheckCircle } from "lucide-react";
import { iconsMap, getIconByName } from "@/lib/iconsMap";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { trpc } from "@/lib/trpc";
import { SectionTitle } from "@/components/SectionTitle";
import { PropertyMap } from "@/components/PropertyMap";
import { CossSeparator } from "@/components/ui/coss-separator";
import { SleepingArrangements } from "@/components/SleepingArrangements";
import type { PropertyWithDetails, PropertyImage, PropertyAmenity } from "@/types/properties";
import { BookingDatePicker } from "@/components/BookingDatePicker";
import { Button } from "@/components/ui/button";

interface Props {
    slug: string;
    onClose: () => void;
    origin?: 'home' | 'list';
}

export function PropertyView({ slug, onClose }: Props) {
    // Share handler
    const handleShare = () => {
        const shareUrl = window.location.origin + `/hospedagem/${slug}`;
        if (navigator.share) {
            navigator.share({
                title: 'Veja esta hospedagem',
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copiado para a área de transferência!');
        }
    };
    const isMobile = useIsMobile();
    // Função para fechar e rolar para a seção correta
    const handleClose = () => {
        onClose();
        // Não altera hash nem faz scroll, apenas troca a view instantaneamente
    };
    // Truncar texto e controlar expansão
    const [showFullDescription, setShowFullDescription] = useState(false);
    const truncateText = (text: string, maxLength: number) => {
        if (showFullDescription || !text) return text;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const { data: property, isLoading } = trpc.properties.getBySlug.useQuery({ slug });
    const { data: companySettings } = trpc.companySettings.get.useQuery();
    const { data: roomsSummaryData } = trpc.properties.roomsSummary.useQuery(
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

    if (isMobile) {
        return (
            <div className="w-full mt-24 mb-12">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="relative">
                        {/* Botão de fechar */}
                        <div className="absolute -top-14 right-0 flex gap-2">
                            <button
                                onClick={handleShare}
                                className="w-12 h-12 rounded-full bg-white border-2 border-accent/20 flex items-center justify-center transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground active:bg-accent active:text-accent-foreground"
                                aria-label="Compartilhar hospedagem"
                                type="button"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleClose}
                                className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                                aria-label="Fechar detalhes da propriedade"
                                type="button"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cabeçalho */}
                        <div className="mb-2 mt-1">
                            <SectionTitle
                                title={property.name.split(' ').slice(0, -1).join(' ')}
                                highlight={property.name.split(' ').slice(-1)[0]}
                                subtitle={`${property.city}${property.state_region ? `, ${property.state_region}` : ''} - ${property.country}`}
                                className="mb-1"
                            />
                        </div>

                        {/* Galeria de Imagens */}
                        <div className="border border-muted/40 rounded-xl p-6 mb-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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

                        {/* Descrição curta */}
                        {property.description_short && (
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {truncateText(property.description_short, 150)}
                                    {property.description_short.length > 150 && (
                                        <button
                                            className="ml-2 text-blue-500 hover:underline focus:outline-none text-sm"
                                            onClick={() => setShowFullDescription((prev) => !prev)}
                                        >
                                            {showFullDescription ? 'Ver menos' : 'Ver mais'}
                                        </button>
                                    )}
                                </h2>
                            </div>
                        )}
                        {/* Bloco de espaços abaixo da descrição */}
                        {roomsSummaryData && Array.isArray(roomsSummaryData.rooms_summary) && roomsSummaryData.rooms_summary.length > 0 && (
                            <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm mb-8">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{property.max_guests} hóspede{property.max_guests !== 1 ? 's' : ''}</span>
                                </div>
                                {property.area_m2 && property.area_m2 !== "" && (
                                    <CossSeparator orientation="vertical" />
                                )}
                                {property.area_m2 && property.area_m2 !== "" && (
                                    <div className="flex items-center gap-1">
                                        <Ruler className="w-4 h-4" />
                                        <span>{property.area_m2} m²</span>
                                    </div>
                                )}
                                {property.area_m2 && property.area_m2 !== "" && <CossSeparator orientation="vertical" />}
                                {roomsSummaryData.rooms_summary.map((room: any, idx: number) => {
                                    let IconComponent = getIconByName(room.icon);
                                    if (!room.icon) {
                                        if (room.name === "Quarto") IconComponent = iconsMap["bed"];
                                        else if (room.name === "Banheiro") IconComponent = iconsMap["bath"];
                                        else if (room.name === "Sala") IconComponent = iconsMap["sofa"];
                                        else if (room.name === "Cozinha") IconComponent = iconsMap["door-open"];
                                    }
                                    return (
                                        <>
                                            {idx > 0 && <CossSeparator orientation="vertical" />}
                                            <div key={room.name} className="flex items-center gap-1">
                                                <IconComponent className="w-4 h-4" />
                                                <span>{room.total} {room.name}{room.total !== 1 ? 's' : ''}</span>
                                            </div>
                                        </>
                                    );
                                })}
                                <CossSeparator orientation="vertical" />
                                <div className="flex items-center gap-1">
                                    <Bed className="w-4 h-4" />
                                    <span>{roomsSummaryData.total_beds} cama{roomsSummaryData.total_beds !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        )}

                        {/* Sobre esta hospedagem */}
                        {property.description_full && (
                            <div className="mt-4 mb-8 flex flex-col justify-start w-full">
                                <div className="border border-gray-200 border-b-0 rounded-t-xl p-6 w-full bg-gray-50" style={{ boxShadow: '0 0 0 6px #fff' }}>
                                    <h3 className="text-lg font-semibold text-accent mb-2">Sobre esta hospedagem</h3>
                                    <p className="text-base text-slate-700 leading-relaxed">
                                        {showFullDescription
                                            ? property.description_full
                                            : (property.description_full.length > 300
                                                ? property.description_full.substring(0, 300) + '...'
                                                : property.description_full)
                                        }
                                    </p>
                                </div>
                                {property.description_full.length > 300 && (
                                    <button
                                        onClick={() => setShowFullDescription(prev => !prev)}
                                        className="w-full h-12 flex items-center justify-center border border-gray-200 bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium text-center transition-all"
                                        style={{
                                            borderTopLeftRadius: 0,
                                            borderTopRightRadius: 0,
                                            borderBottomLeftRadius: '15px',
                                            borderBottomRightRadius: '15px',
                                            padding: 0,
                                            minHeight: '3rem',
                                        }}
                                    >
                                        {showFullDescription ? 'Ver menos' : 'Ver mais'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Onde você vai dormir */}
                        <div className="mb-8">
                            <SleepingArrangements
                                propertyId={property.id}
                                primaryImage={property.images?.[0]?.image_url}
                            />
                        </div>

                        {/* Comodidades */}
                        {property.amenities && property.amenities.length > 0 && (
                            <div className="border border-muted/40 rounded-xl p-6 mb-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
                                <h3 className="text-lg font-semibold text-accent mb-4">Comodidades</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {property.amenities.map((amenity: PropertyAmenity) => {
                                        let IconComponent = getIconByName(amenity.icon ?? "home");
                                        return (
                                            <div key={amenity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-muted/20">
                                                {amenity.icon ? (
                                                    <IconComponent className="w-5 h-5 text-accent" />
                                                ) : (
                                                    <Home className="w-5 h-5 text-accent" />
                                                )}
                                                <span className="text-sm text-slate-700">{amenity.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Localização */}
                        <div className="border border-muted/40 rounded-xl p-6 mb-8" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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

                        {/* Faça sua Reserva */}
                        <div className="border border-gray-200 rounded-xl p-6 w-full bg-gray-50 flex flex-col justify-between mt-6 mb-4" style={{ boxShadow: '0 0 0 6px #fff' }}>
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
                                                <span className="font-semibold">Interesse:</span>{' '}
                                                {differenceInDays(dateRange.to, dateRange.from)} Noites - Check-in: {format(dateRange.from, "dd MMM", { locale: ptBR }).toUpperCase()} Check-out: {format(dateRange.to, "dd MMM", { locale: ptBR }).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleWhatsAppClick}
                                    className="bg-accent hover:bg-accent/90 text-white w-full"
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
    // Desktop: layout original
    return (
        <div className="w-full mt-24 mb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-10 py-8">
                <div className="relative">
                    {/* Botões de fechar e compartilhar */}
                    <div className="absolute -top-14 md:-top-8 right-0 flex gap-2">
                        <button
                            onClick={handleShare}
                            className="w-12 h-12 rounded-full bg-white border-2 border-accent/20 flex items-center justify-center transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground active:bg-accent active:text-accent-foreground"
                            aria-label="Compartilhar hospedagem"
                            type="button"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                            aria-label="Fechar detalhes da propriedade"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cabeçalho */}
                    <div className="flex items-start gap-4 md:gap-6 mb-2 mt-1 md:mt-0">
                        {/* Ícone removido do topo */}
                        <div className="flex-1">
                            <SectionTitle
                                title={property.name.split(' ').slice(0, -1).join(' ')}
                                highlight={property.name.split(' ').slice(-1)[0]}
                                subtitle={`${property.city}${property.state_region ? `, ${property.state_region}` : ''} - ${property.country}`}
                                className="mb-1"
                            />
                        </div>
                    </div>

                    {/* Container 1: Galeria de Imagens */}
                    <div className="border border-muted/40 rounded-xl p-6 md:p-8 mb-6" style={{ background: '#FAFAFA', boxShadow: '0 0 0 6px #fff' }}>
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

                    {/* Descrição curta */}
                    {property.description_short && (
                        <div className="mb-2">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {truncateText(property.description_short, 150)}
                                {property.description_short.length > 150 && (
                                    <button
                                        className="ml-2 text-blue-500 hover:underline focus:outline-none text-sm"
                                        onClick={() => setShowFullDescription((prev) => !prev)}
                                    >
                                        {showFullDescription ? 'Ver menos' : 'Ver mais'}
                                    </button>
                                )}
                            </h2>
                        </div>
                    )}
                    {/* Bloco de espaços abaixo da descrição */}
                    {roomsSummaryData && Array.isArray(roomsSummaryData.rooms_summary) && roomsSummaryData.rooms_summary.length > 0 && (
                        <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm mb-8">
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{property.max_guests} hóspede{property.max_guests !== 1 ? 's' : ''}</span>
                            </div>
                            {property.area_m2 && property.area_m2 !== "" && (
                                <CossSeparator orientation="vertical" />
                            )}
                            {property.area_m2 && property.area_m2 !== "" && (
                                <div className="flex items-center gap-1">
                                    <Ruler className="w-4 h-4" />
                                    <span>{property.area_m2} m²</span>
                                </div>
                            )}
                            {property.area_m2 && property.area_m2 !== "" && <CossSeparator orientation="vertical" />}
                            {roomsSummaryData.rooms_summary.map((room: any, idx: number) => {
                                let IconComponent = getIconByName(room.icon);
                                if (!room.icon) {
                                    if (room.name === "Quarto") IconComponent = iconsMap["bed"];
                                    else if (room.name === "Banheiro") IconComponent = iconsMap["bath"];
                                    else if (room.name === "Sala") IconComponent = iconsMap["sofa"];
                                    else if (room.name === "Cozinha") IconComponent = iconsMap["door-open"];
                                }
                                return (
                                    <>
                                        {idx > 0 && <CossSeparator orientation="vertical" />}
                                        <div key={room.name} className="flex items-center gap-1">
                                            <IconComponent className="w-4 h-4" />
                                            <span>{room.total} {room.name}{room.total !== 1 ? 's' : ''}</span>
                                        </div>
                                    </>
                                );
                            })}
                            <CossSeparator orientation="vertical" />
                            <div className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                <span>{roomsSummaryData.total_beds} cama{roomsSummaryData.total_beds !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}
                    {/* Grid de duas colunas: restante do conteúdo e reserva */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Coluna 1: Conteúdo principal */}
                        <div className="flex-1 max-w-2xl space-y-6 flex flex-col">
                            {/* Descrição completa e expansível */}
                            {property.description_full && (
                                <div className="mt-4 mb-4 flex flex-col justify-start w-full max-w-2xl">
                                    <div className="border border-gray-200 border-b-0 rounded-t-xl p-6 md:p-8 w-full bg-gray-50" style={{ boxShadow: '0 0 0 6px #fff' }}>
                                        <h3 className="text-lg font-semibold text-accent mb-2">Sobre esta hospedagem</h3>
                                        <p className="text-base text-slate-700 leading-relaxed">
                                            {showFullDescription
                                                ? property.description_full
                                                : (property.description_full.length > 300
                                                    ? property.description_full.substring(0, 300) + '...'
                                                    : property.description_full)
                                            }
                                        </p>
                                    </div>
                                    {property.description_full.length > 300 && (
                                        <button
                                            onClick={() => setShowFullDescription(prev => !prev)}
                                            className="w-full h-12 flex items-center justify-center border border-gray-200 bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium text-center transition-all"
                                            style={{
                                                borderTopLeftRadius: 0,
                                                borderTopRightRadius: 0,
                                                borderBottomLeftRadius: '15px',
                                                borderBottomRightRadius: '15px',
                                                padding: 0,
                                                minHeight: '3rem',
                                            }}
                                        >
                                            {showFullDescription ? 'Ver menos' : 'Ver mais'}
                                        </button>
                                    )}
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
                                        {property.amenities.map((amenity: PropertyAmenity) => {
                                            let IconComponent = getIconByName(amenity.icon ?? "home");
                                            return (
                                                <div key={amenity.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-muted/20">
                                                    {amenity.icon ? (
                                                        <IconComponent className="w-5 h-5 text-accent" />
                                                    ) : (
                                                        <Home className="w-5 h-5 text-accent" />
                                                    )}
                                                    <span className="text-sm text-slate-700">{amenity.name}</span>
                                                </div>
                                            );
                                        })}
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
                        </div>
                        {/* Coluna 2: Reserva */}
                        <div className="w-full md:max-w-lg flex-shrink-0 md:self-start md:mt-4 md:p-0 flex flex-col">
                            <div className="border border-gray-200 rounded-xl p-6 md:p-8 w-full bg-gray-50 flex flex-col justify-between h-[280px]" style={{ boxShadow: '0 0 0 6px #fff' }}>
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
                                                    <span className="font-semibold">Interesse:</span>{' '}
                                                    {differenceInDays(dateRange.to, dateRange.from)} Noites - Check-in: {format(dateRange.from, "dd MMM", { locale: ptBR }).toUpperCase()} Check-out: {format(dateRange.to, "dd MMM", { locale: ptBR }).toUpperCase()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleWhatsAppClick}
                                        className="bg-accent hover:bg-accent/90 text-white w-full"
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
            </div>
        </div>
    );
}