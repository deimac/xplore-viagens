import { AllHospedagensModal } from "@/components/AllHospedagensModal";
import { X } from "lucide-react";

import { SectionTitle } from "@/components/SectionTitle";

interface Props {
    onClose: () => void;
    onPropertySelect: (slug: string) => void;
}

export function AllHospedagensView({ onClose, onPropertySelect }: Props) {
    return (
        <div className="w-full mb-12">
            <div className="max-w-7xl mx-auto px-0 md:px-2 py-8">
                <div className="relative mt-40 md:mt-48 mb-2 md:mb-4">
                    {/* Botão de fechar alinhado com o container */}
                    <div className="flex justify-end mx-8 md:mx-16">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
                            aria-label="Fechar lista de hospedagens"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-start gap-4 md:gap-6 mb-2 mt-1 md:mt-0">
                        <div className="flex-1">
                            <SectionTitle
                                title="Lugares Únicos para Se"
                                highlight="Hospedar"
                                subtitle="Descubra acomodações especiais de acordos exclusivos em destinos incríveis"
                                align="center"
                                className="mb-1"
                            />
                        </div>
                    </div>
                </div>
                {/* Conteúdo principal sempre abaixo do cabeçalho */}
                <div className="mt-16">
                    <AllHospedagensModal
                        isOpen={true}
                        onClose={onClose}
                        onPropertySelect={onPropertySelect}
                    />
                </div>
            </div>
        </div>
    );
}
