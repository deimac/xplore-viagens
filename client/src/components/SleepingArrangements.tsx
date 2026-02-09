import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/types/textStyles";

interface SleepingArrangementsProps {
    propertyId: number;
    primaryImage?: string;
}

interface RoomWithBeds {
    id: number;
    name: string | null;
    roomTypeName: string;
    sleepingPhoto: string | null;
    beds: {
        id: number;
        bedTypeName: string;
        quantity: number;
        sleepsCount: number;
    }[];
}

export function SleepingArrangements({ propertyId, primaryImage }: SleepingArrangementsProps) {
    const { data: rooms = [], isLoading } = (trpc as any).propertyRooms.listWithBeds.useQuery(
        { propertyId },
        { enabled: !!propertyId }
    );

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

    // Filtrar apenas quartos com camas
    const roomsWithBeds = rooms.filter((room: RoomWithBeds) => room.beds && room.beds.length > 0);

    const getRoomDisplayName = (room: RoomWithBeds, index: number) => {
        if (room.name) {
            return room.name;
        }
        return `${room.roomTypeName} ${index + 1}`;
    };

    const getRoomImage = (room: RoomWithBeds) => {
        if (room.sleepingPhoto) {
            return room.sleepingPhoto;
        }
        if (primaryImage) {
            return primaryImage;
        }
        return "https://via.placeholder.com/400x300?text=Sem+foto";
    };

    const formatBedsList = (beds: RoomWithBeds['beds']) => {
        return beds.map((bed) => {
            if (bed.quantity > 1) {
                return `${bed.quantity} ${bed.bedTypeName.toLowerCase()}s`;
            }
            return `${bed.quantity} ${bed.bedTypeName.toLowerCase()}`;
        });
    };

    const updateScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const cardWidth = scrollContainerRef.current.querySelector('.room-card')?.clientWidth || 0;
            const gap = 16; // gap-4 = 16px
            const scrollAmount = cardWidth + gap;

            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            updateScrollButtons();
            container.addEventListener('scroll', updateScrollButtons);
            window.addEventListener('resize', updateScrollButtons);

            return () => {
                container.removeEventListener('scroll', updateScrollButtons);
                window.removeEventListener('resize', updateScrollButtons);
            };
        }
    }, [roomsWithBeds]);

    const showNavigation = roomsWithBeds.length > 2;
    const showDots = roomsWithBeds.length > 1 && isMobile;

    // Não exibir a seção se não houver quartos com camas (depois de todos os hooks)
    if (isLoading || roomsWithBeds.length === 0) {
        return null;
    }

    return (
        <div className="border border-muted/40 rounded-xl p-6 md:p-8 bg-[#FAFAFA] shadow-[0_0_0_6px_#fff] mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className={textStyles.tituloSessao + " text-base md:text-lg font-semibold"}>Onde você vai dormir</h3>

                {showNavigation && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {isMobile ? (
                <div
                    className="relative mb-6 overflow-x-auto scrollbar-hide"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={e => {
                        if (touchStartX === null) return;
                        const deltaX = e.changedTouches[0].clientX - touchStartX;
                        if (Math.abs(deltaX) > 40) {
                            if (deltaX < 0 && currentIndex < roomsWithBeds.length - 1) {
                                setCurrentIndex(currentIndex + 1);
                            } else if (deltaX > 0 && currentIndex > 0) {
                                setCurrentIndex(currentIndex - 1);
                            }
                        }
                        setTouchStartX(null);
                    }}
                >
                    <div className="flex gap-4 pl-2" style={{ minWidth: 'min-content' }}>
                        {roomsWithBeds.map((room, idx) => (
                            <div key={room.id} style={{ width: '320px' }} className="bg-white border border-muted/20 rounded-lg overflow-hidden flex-shrink-0 flex flex-col items-stretch">
                                <div className="p-2 flex justify-center">
                                    <div className="relative overflow-hidden bg-gray-100 rounded-lg" style={{ height: '200px', width: '236px' }}>
                                        <img
                                            src={getRoomImage(room)}
                                            alt={getRoomDisplayName(room, idx)}
                                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                            style={{ borderRadius: 'inherit' }}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                                <div className="p-3 w-full" style={{ paddingLeft: '42px' }}>
                                    <h4 className="font-semibold text-sm mb-1.5">
                                        {getRoomDisplayName(room, idx)}
                                    </h4>
                                    <div className="space-y-0.5 w-full">
                                        {formatBedsList(room.beds).map((bedText, bidx) => (
                                            <div key={bidx} className="text-xs text-slate-600">
                                                {bedText}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {showDots && (
                        <div className="flex justify-center mt-3 gap-2">
                            {roomsWithBeds.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`w-3 h-3 rounded-full ${currentIndex === idx ? 'bg-yellow-400' : 'bg-yellow-200'} transition-all`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide snap-x snap-mandatory smooth-scroll"
                >
                    <div className="flex gap-4 min-w-min">
                        {roomsWithBeds.map((room: RoomWithBeds, index: number) => (
                            <div
                                key={room.id}
                                className="room-card flex-shrink-0 bg-white border border-muted/20 rounded-lg overflow-hidden w-[calc(50%-8px)] min-w-[220px] max-w-[280px] snap-start"
                            >
                                {/* Room Image */}
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                                    <img
                                        src={getRoomImage(room)}
                                        alt={getRoomDisplayName(room, index)}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                {/* Room Info */}
                                <div className="p-3">
                                    <h4 className="font-semibold text-sm mb-1.5">
                                        {getRoomDisplayName(room, index)}
                                    </h4>
                                    <div className="space-y-0.5">
                                        {formatBedsList(room.beds).map((bedText, idx) => (
                                            <div key={idx} className="text-xs text-slate-600">
                                                {bedText}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
