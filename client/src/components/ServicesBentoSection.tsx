import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
//import { Plane, Percent, Headphones, Globe } from "lucide-react";
// Removed import from "@radix-ui/react-icons" as it does not exist

import {
    BellIcon,
    CalendarIcon,
    CardStackIcon,
    FileTextIcon,
    GlobeIcon,
    InputIcon,
} from "@radix-ui/react-icons";
import { Plane, Compass, Users, Headset, DollarSign, HeartHandshakeIcon, ClipboardCheckIcon, Users2Icon, UserCheck2Icon, UsersRoundIcon, UserSquare2Icon, UserPlus2Icon, CreditCardIcon } from "lucide-react";
import FadeInContainer from "@/components/FadeInContainer";
import { SectionTitle } from "@/components/SectionTitle";
import { textStyles } from "@/types/textStyles";
import { HandHelpingIcon, HelpCircleIcon, HelpingHandIcon, LucidePlane, PlaneIcon, PlaneLanding, PlaneLandingIcon, PlaneTakeoffIcon } from "lucide-react";

/*const features = [
    {
        Icon: Percent,
        name: "Emissão com Milhas",
        description: "Economize até 50% em passagens internacionais usando nossa estratégia exclusiva de pontos.",
        href: "#milhas",
        cta: "Entenda como funciona",
        className: "col-span-3 lg:col-span-2",
        background: <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20" />,
    },
    {
        Icon: Headphones,
        name: "Suporte 24h",
        description: "Viaje com tranquilidade. Nossa equipa está disponível a qualquer hora para resolver imprevistos.",
        href: "#suporte",
        cta: "Ver suporte",
        className: "col-span-3 lg:col-span-1",
        background: <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/20" />,
    },
    {
        Icon: Globe,
        name: "Destinos Exclusivos",
        description: "Curadoria de roteiros personalizados para experiências únicas ao redor do mundo.",
        href: "#destinos",
        cta: "Explorar",
        className: "col-span-3 lg:col-span-1",
        background: <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/20" />,
    },
    {
        Icon: Plane,
        name: "Upgrade de Classe",
        description: "Quer viajar em Executiva ou Primeira Classe? Temos as melhores tarifas com milhas para você.",
        href: "#upgrade",
        cta: "Saber mais",
        className: "col-span-3 lg:col-span-2",
        background: <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20" />,
    },
];*/
//import { BellIcon, CalendarIcon, FileTextIcon, GlobeIcon, InputIcon } from "lucide-react";

const features = [
    {
        Icon: LucidePlane,
        name: "Emissão Aérea",
        description: "Emissão de passagens aéreas nacionais e internacionais com estratégias em milhas e consolidadoras parceiras, focada no melhor equilíbrio entre custo, conforto e eficiência.",
        //href: "/",
        //cta: "Learn more",
        background: <img className="absolute -top-20 -right-20 inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20" alt="Background decoration" />,
        className: "lg:row-start-1 lg:row-end-3 lg:col-start-2 lg:col-end-3", // ocupa 2 linhas
    },
    {
        Icon: ClipboardCheckIcon,
        name: "Planejamento e Organização de Viagens",
        description: "Planejamento completo da viagem, com pacotes, hospedagem e passeios organizados de forma estratégica para uma experiência tranquila do início ao fim.",
        //href: "/",
        //cta: "Learn more",
        background: <img className="absolute -top-20 -right-20 opacity-60 inset-0 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-900/20" alt="Background decoration" />,
        className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
    },
    {
        Icon: UserPlus2Icon,
        name: "Viagens em Grupo",
        description: "Grupos para passeios para destinos no brasil e no mundo. Pensados para aqueles que querem fazer novos amigos, viver novas aventuras pelos nossos olhos.",
        //href: "/",
        //cta: "Learn more",
        background: <img className="absolute -top-20 -right-20 opacity-60" alt="Background decoration" />,
        className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-2",
    },
    {
        Icon: HeartHandshakeIcon,
        name: "Suporte ao Viajante",
        description: "Suporte permanente ao viajante em cada etapa da jornada, garantindo orientação e apoio quando necessário.",
        //href: "/",
        //cta: "Learn more",
        background: <img className="absolute -top-20 -right-20 opacity-60" alt="Background decoration" />,
        className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
        Icon: CreditCardIcon,
        name: "Flexibilidade de Pagamento",
        description: "Com opções flexíveis de pagamento para facilitar a realização da sua viagem dos sonhos.",
        //href: "/",
        //cta: "Learn more",
        background: <img className="absolute -top-20 -right-20 opacity-60" alt="Background decoration" />,
        className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-3",
    },
]

export default function ServicesBentoSection() {
    return (
        <section id="experiencias-premium" className="py-16 md:py-24" style={{ background: '#e6f0fa' }}>
            <div className="container">
                {/* Header */}
                <FadeInContainer>
                    <SectionTitle
                        title="O que Podemos"
                        highlight="Oferecer"
                        subtitle={<span className="text-base md:text-lg text-accent/70 leading-relaxed font-light">Descubra benefícios especiais que tornam sua experiência de viagem ainda mais valiosa e memorável.</span>}
                        className="text-3xl md:text-4xl font-light text-accent"
                    />
                </FadeInContainer>

                {/* Bento Grid */}
                <FadeInContainer delay="1">
                    <BentoGrid className="lg:grid-rows-2">
                        {features.map((feature, idx) => (
                            <BentoCard key={idx} {...feature} />
                        ))}
                    </BentoGrid>
                </FadeInContainer>
            </div>
        </section>
    );
}