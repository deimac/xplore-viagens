import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";
import { useState, useRef } from "react";
import { AllHospedagensModal } from "@/components/AllHospedagensModal";
import { PropertyView } from "@/components/PropertyView";
import { Users, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
    onPropertySelect: (slug: string) => void;
    onShowAllHospedagens: () => void;
}

export function HospedagensSection({ onPropertySelect, onShowAllHospedagens }: Props) {
    const { data: featuredProperties, isLoading } = trpc.properties.listFeatured.useQuery();
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

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

    // Handlers para swipe no mobile
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.changedTouches[0].clientX;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
    };
    const onTouchEnd = () => {
        if (touchStartX.current !== null && touchEndX.current !== null) {
            const distance = touchStartX.current - touchEndX.current;
            if (Math.abs(distance) > minSwipeDistance) {
                if (distance > 0) {
                    handleNext(); // swipe left
                } else {
                    handlePrev(); // swipe right
                }
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const handleNext = () => setCurrentIndex((i) => (i + 1) % featuredProperties.length);
    const handlePrev = () => setCurrentIndex((i) => (i - 1 + featuredProperties.length) % featuredProperties.length);

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
                        {/* Carrossel Mobile */}
                        <div
                            className="lg:hidden mb-8"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`carousel-${currentIndex}`}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <button
                                        onClick={() => onPropertySelect(featuredProperties[currentIndex].slug)}
                                        className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-accent/20 w-full"
                                    >
                                        {/* Imagem */}
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={featuredProperties[currentIndex].primary_image || '/placeholder-property.jpg'}
                                                alt={featuredProperties[currentIndex].name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="p-4 space-y-3">
                                            <h4 className="text-base font-semibold text-slate-900 line-clamp-2 leading-tight text-left">
                                                {featuredProperties[currentIndex].name}
                                            </h4>

                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4 text-accent" />
                                                <span className="truncate">{featuredProperties[currentIndex].city}, {featuredProperties[currentIndex].country}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Users className="w-4 h-4 text-accent" />
                                                <span>Até {featuredProperties[currentIndex].max_guests} hóspedes</span>
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navegação Mobile */}
                            <div className="flex items-center justify-center mt-6">
                                {/* Indicadores (Dots) */}
                                <div className="flex gap-2">
                                    {featuredProperties.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentIndex(index)}
                                            aria-label={`Ir para hospedagem ${index + 1}`}
                                            aria-current={index === currentIndex}
                                            className={`transition-all duration-300 rounded-full ${index === currentIndex
                                                ? 'w-10 h-3 bg-amber-500'
                                                : 'w-3 h-3 bg-gray-400 hover:bg-gray-500'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grid responsivo de propriedades - Desktop/Tablet */}
                        <div className="hidden lg:grid grid-cols-4 gap-6 mb-8">
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