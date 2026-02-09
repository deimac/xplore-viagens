import { useEffect, useMemo, useState, useRef } from "react";
import { MessageCircle, CheckCircle, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { OfertaVoo, OfertaVooFlexSelection } from "@/types/ofertasVoo";
import { DataFixaDisplay } from "@/components/DataFixaDisplay";
import { DataFlexivelDisplay } from "@/components/DataFlexivelDisplay";
import { buildWhatsAppLink, formatarPreco, sanitizeWhatsAppNumber, formatarInteresseFlexivel, formatarInteresseFixo } from "@/lib/ofertasVoo";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/SectionTitle";
import FadeInContainer from "@/components/FadeInContainer";
import { CarouselNavigation } from "@/components/CarouselNavigation";

interface Props {
    ofertas: OfertaVoo[];
    whatsappNumber?: string | null;
}

export function PremiumFlightsSection({ ofertas, whatsappNumber }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const [selectedFlexDates, setSelectedFlexDates] = useState<OfertaVooFlexSelection>({
        ida: null,
        volta: null,
    });
    const [selectedFixedIndex, setSelectedFixedIndex] = useState<number | null>(null);

    if (!ofertas || ofertas.length === 0) return null;

    const oferta = ofertas[currentIndex];

    const numeroSanitizado = useMemo(
        () => sanitizeWhatsAppNumber(whatsappNumber),
        [whatsappNumber]
    );

    useEffect(() => {
        setSelectedFlexDates({ ida: null, volta: null });
        setSelectedFixedIndex(null);
    }, [currentIndex]);

    const handleNext = () => setCurrentIndex((i) => (i + 1) % ofertas.length);
    const handlePrev = () => setCurrentIndex((i) => (i - 1 + ofertas.length) % ofertas.length);

    // Swipe handlers para mobile
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

    const whatsappLink = numeroSanitizado
        ? buildWhatsAppLink(
            oferta,
            numeroSanitizado,
            oferta.tipo === "DATA_FLEXIVEL" ? selectedFlexDates : undefined
        )
        : "";
    const whatsappDisabled = !numeroSanitizado;

    return (
        <section id="ofertas-premium" className="relative py-16 md:py-24 bg-gray-50">
            <div className="container">
                {/* Header */}
                <FadeInContainer>
                    <SectionTitle
                        title="Experiências"
                        highlight="Premium"
                        subtitle="Voe com conforto e exclusividade em cabinas de primeira classe"
                    />
                </FadeInContainer>

                <FadeInContainer delay="1">
                    <div className="grid lg:grid-cols-[40%_60%] gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
                        <div className="hidden lg:block relative h-full">
                            <div className="relative h-full min-h-[360px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                                <img
                                    src="/executive-class-offer-banner.jpg"
                                    alt="Cabine executiva"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                            </div>
                        </div>

                        <div
                            className="flex flex-col justify-center h-full"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <div className="lg:hidden relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <img
                                    src="/premium.jpg"
                                    alt="Cabine executiva"
                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`card-${currentIndex}`}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.25 }}
                                    className="bg-white rounded-2xl p-5 lg:p-6 shadow-xl border-2 border-accent/10 h-full hover:shadow-2xl transition-shadow duration-300 flex flex-col"
                                >
                                    <div className="mb-3">
                                        <h3 className="text-base lg:text-lg font-semibold text-slate-900 mb-2 leading-tight">
                                            {oferta.titulo}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="font-medium">{oferta.companhia}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="uppercase tracking-wide font-semibold text-amber-600">
                                                {oferta.classe}
                                            </span>
                                        </div>
                                    </div>

                                    {oferta.tipo === "DATA_FIXA" ? (
                                        <DataFixaDisplay
                                            oferta={oferta}
                                            selectedFixedIndex={selectedFixedIndex}
                                            onSelectFixedIndex={setSelectedFixedIndex}
                                        />
                                    ) : (
                                        <DataFlexivelDisplay
                                            oferta={oferta}
                                            selectedIda={selectedFlexDates.ida}
                                            selectedVolta={selectedFlexDates.volta}
                                            onSelectIda={(data) =>
                                                setSelectedFlexDates((prev) => ({ ...prev, ida: data }))
                                            }
                                            onSelectVolta={(data) =>
                                                setSelectedFlexDates((prev) => ({ ...prev, volta: data }))
                                            }
                                        />
                                    )}

                                    <div className="mt-auto flex flex-col pt-3 border-t border-slate-200">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs text-slate-600">A partir de</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl lg:text-3xl font-bold text-slate-900">
                                                {formatarPreco(oferta.preco)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 mb-3">
                                            ou {oferta.parcelas}x de {formatarPreco(oferta.preco / oferta.parcelas)} sem juros
                                        </p>

                                        {/* Container com altura reservada para o banner */}
                                        <div className="min-h-10 mb-3">
                                            {(() => {
                                                if (oferta.tipo === "DATA_FLEXIVEL" && (selectedFlexDates.ida || selectedFlexDates.volta)) {
                                                    return (
                                                        <div className="px-3 py-2 rounded-md bg-amber-50 flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                            <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
                                                                <span className="font-semibold">Interesse:</span>
                                                                {selectedFlexDates.ida && (
                                                                    <span className="flex items-center gap-1">
                                                                        <ArrowUp className="w-3 h-3 text-slate-700" />
                                                                        <span>IDA: {selectedFlexDates.ida.dia} {selectedFlexDates.ida.mes.toUpperCase()}</span>
                                                                    </span>
                                                                )}
                                                                {selectedFlexDates.volta && (
                                                                    <span className="flex items-center gap-1">
                                                                        <ArrowDown className="w-3 h-3 text-slate-700" />
                                                                        <span>VOLTA: {selectedFlexDates.volta.dia} {selectedFlexDates.volta.mes.toUpperCase()}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (oferta.tipo === "DATA_FIXA" && selectedFixedIndex !== null && oferta.linhasDatas?.[selectedFixedIndex]) {
                                                    const datas = oferta.linhasDatas[selectedFixedIndex];
                                                    return (
                                                        <div className="px-3 py-2 rounded-md bg-amber-50 flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                            <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
                                                                <span className="font-semibold">Interesse:</span>
                                                                {datas.map((data, index) => {
                                                                    let Icon = ArrowRight;

                                                                    if (index === 0) {
                                                                        Icon = ArrowUp;
                                                                    } else if (index === datas.length - 1) {
                                                                        Icon = ArrowDown;
                                                                    }

                                                                    return (
                                                                        <span key={index} className="flex items-center gap-1">
                                                                            <Icon className="w-3 h-3 text-slate-700" />
                                                                            <span>{data}</span>
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </div>

                                        <Button
                                            size="lg"
                                            className="w-fit mx-auto bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow text-sm"
                                            disabled={whatsappDisabled}
                                            onClick={() => {
                                                if (!whatsappDisabled && whatsappLink) {
                                                    window.open(whatsappLink, "_blank");
                                                }
                                            }}
                                        >
                                            Fale Conosco
                                            <MessageCircle className="ml-2 w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {ofertas.length > 1 && (
                                <CarouselNavigation
                                    currentIndex={currentIndex}
                                    totalItems={ofertas.length}
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    variant="dots"
                                    buttonStyle="large"
                                />
                            )}
                        </div>
                    </div>
                </FadeInContainer>
            </div>
        </section>
    );
}
