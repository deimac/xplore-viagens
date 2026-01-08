import { useState } from "react";
import { Check } from "lucide-react";
import { StandardContainer } from "./StandardContainer";
import FadeInContainer from "./FadeInContainer";
import { SectionTitle } from "./SectionTitle";

interface TravelerType {
  id: string;
  title: string;
  avatar: string;
  intro: string;
  items: string[];
}

const travelerTypes: TravelerType[] = [
  {
    id: "business",
    title: "Para quem viaja a trabalho",
    avatar: "/avatars/business-traveler.png",
    intro: "Cada compromisso importa. Por isso, cuidamos de toda a sua viagem para que você foque no que realmente importa: chegar no horário, com conforto e sem imprevistos.",
    items: [
      "Passagens aéreas e aluguel de carro em um só lugar",
      "Hotéis e estadias de curta temporada em todo o Brasil, das grandes metrópoles às menores cidades",
      "Flexibilidade para alterações de última hora",
      "Suporte e segurança para garantir seus compromissos",
    ],
  },
  {
    id: "solo",
    title: "Para quem viaja sozinho",
    avatar: "/avatars/solo-traveler.png",
    intro: "Viajar sozinho é ter liberdade. Nós cuidamos do planejamento para que você aproveite cada decisão com tranquilidade, segurança e flexibilidade total.",
    items: [
      "Explore o mundo no seu próprio ritmo com total liberdade",
      "Aquisição rápida e prática de voos",
      "Roteiros personalizados conforme o perfil",
      "Hotéis bem localizados e seguros",
      "Suporte antes e durante a viagem",
    ],
  },
  {
    id: "family",
    title: "Para quem viaja em família",
    avatar: "/avatars/family-traveler.png",
    intro: "Momentos em família merecem ser vividos sem preocupação. Planejamos cada detalhe para que todos aproveitem juntos, com conforto, segurança e diversão.",
    items: [
      "Roteiros pensados para toda a família",
      "Atividades e passeios para todas as idades",
      "Seguro viagem para proteção de todos",
      "Tickets de parques, atrações e passeios",
      "Hospedagens family-friendly e bem avaliadas",
    ],
  },
  {
    id: "group",
    title: "Para quem viaja em grupo de amigos",
    avatar: "/avatars/group-traveler.png",
    intro: "Viajar em grupo é compartilhar experiências. Nós organizamos tudo para que vocês aproveitem o melhor da viagem, sem dor de cabeça e com muito mais tempo para curtir.",
    items: [
      "Planejamento completo para grupos",
      "Casas, resorts ou hotéis ideais para várias pessoas",
      "Reservas de veículos maiores, para grandes grupos de passageiros",
      "Guias especializados para acompanhamento de grupos",
      "Otimização de custos e condições especiais",
    ],
  },
];

export default function TravelerTypesSection() {
  const [activeTab, setActiveTab] = useState("business");

  const activeContent = travelerTypes.find((type) => type.id === activeTab);

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container">
        {/* Header */}
        <FadeInContainer>
        <SectionTitle
          title="Soluções para Cada Tipo de"
          highlight="Viajante"
          subtitle="Contamos com um suporte completo para quem busca um simples deslocamento ou um acompanhamento completo para conhecer seu destino em detalhes. Prezando sempre por experiências bem planejadas, seguras e alinhadas a cada estilo de viajante."
        />
        </FadeInContainer>

        {/* Two Column Layout */}
        <FadeInContainer delay="1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Tabs (Compact) */}
          <div className="flex flex-col gap-2">
            {travelerTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`w-full flex items-center gap-3 p-3 md:p-4 rounded-lg transition-all duration-300 text-left ${
                  activeTab === type.id
                    ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                    : "bg-white border-2 border-muted/40 hover:bg-blue-50 hover:border-blue-500 hover:shadow-md"
                }`}
                style={activeTab !== type.id ? {boxShadow: '0 0 0 6px #fff'} : undefined}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={type.avatar}
                    alt={type.title}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full"
                  />
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3
                    className={`text-sm md:text-base font-semibold transition-colors ${
                      activeTab === type.id ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {type.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column - Single Container with Content */}
          <div className="lg:h-full">
            <StandardContainer className="h-full flex flex-col">
              <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Intro Paragraph */}
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {activeContent?.intro}
                </p>

                {/* Divider */}
                <div className="border-b border-gray-200"></div>

                {/* Items List */}
                <ul className="space-y-4">
                  {activeContent?.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StandardContainer>
          </div>
        </div>
        </FadeInContainer>
      </div>
    </section>
  );
}
