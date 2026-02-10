import { MapPin, Users } from "lucide-react";

interface HospedagemCardProps {
    property: {
        id: number;
        name: string;
        city: string;
        country: string;
        max_guests: number;
        primary_image?: string;
        isPremium?: boolean;
        isNew?: boolean;
    };
    onClick: () => void;
}

export function HospedagemCard({ property, onClick }: HospedagemCardProps) {
    return (
        <button
            onClick={onClick}
            className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-accent/20 flex flex-col"
        >
            {/* Imagem */}
            <div className="aspect-video relative overflow-hidden">
                <img
                    src={property.primary_image || '/placeholder-property.jpg'}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                {/* Badges */}
                {property.isPremium && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow">Premium</span>
                )}
                {property.isNew && (
                    <span className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded shadow">Novo</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            {/* Conteúdo */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <h4 className="text-base lg:text-lg font-semibold text-slate-900 line-clamp-4 leading-tight text-left">
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
    );
}
