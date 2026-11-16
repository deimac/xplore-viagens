import type { CSSProperties } from "react";
import { MapPin, Users, Building2, Moon, MessageCircle, Bed } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildViagemWhatsAppLink, calculateNights, formatCurrency, formatDate } from "@/lib/packageFormat";

interface PackageCardProps {
  travel: any;
  whatsappNumber?: string | null;
  /** Tamanho do card (altura fixa no carrossel, mínima na lista). */
  className?: string;
  style?: CSSProperties;
  /** O carrossel tem o botão do WhatsApp fora do card no celular. */
  hideButtonOnMobile?: boolean;
}

// Card único de pacote: carrossel da home, lista de pacotes e página /pacote/:code.
export function PackageCard({ travel, whatsappNumber, className, style, hideButtonOnMobile = false }: PackageCardProps) {
  const isLodging = travel.tipoViagem === "hospedagem";
  return (
    <div className={cn("rounded-2xl overflow-hidden bg-white flex flex-col", className)} style={style}>
      {/* Imagem + destaques + título/origem */}
      <div className="relative h-[54%] md:h-[52%] overflow-hidden">
        <img src={travel.imagemUrl} alt={travel.titulo} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        {travel.destaques?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {travel.destaques.map((d: any) => (
              <span key={d.id} className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                {d.nome}
              </span>
            ))}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-3 md:px-5 md:pb-3 md:pt-5 text-white">
          <h3 className="text-[15px] md:text-lg font-bold leading-tight line-clamp-2">{travel.titulo}</h3>
          {isLodging ? (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] md:text-sm mt-0.5 md:mt-1">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{travel.hospedagem && String(travel.hospedagem).trim() ? travel.hospedagem : "Hospedagem não informada"}</span>
            </div>
          ) : travel.origem && (
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] md:text-sm mt-0.5 md:mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Saindo de {travel.origem}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="pl-4 pr-4 pb-4 pt-3 md:pl-5 md:pr-5 md:pb-5 md:pt-5 flex-1 flex flex-col">
        <div className="grid grid-rows-3 gap-1.5 md:gap-2 text-gray-500 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <Moon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {travel.dataIda && travel.dataVolta
                ? (() => {
                  const nights = calculateNights(travel.dataIda, travel.dataVolta);
                  const rangeText = `${formatDate(travel.dataIda)} a ${formatDate(travel.dataVolta)}`;
                  return nights != null ? `${nights} ${nights === 1 ? "noite" : "noites"} · ${rangeText}` : rangeText;
                })()
                : formatDate(travel.dataIda) || formatDate(travel.dataVolta) || "Data não informada"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {travel.quantidadePessoas} {isLodging
                ? (travel.quantidadePessoas === 1 ? "hóspede" : "hóspedes")
                : (travel.quantidadePessoas === 1 ? "viajante" : "viajantes")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {isLodging ? (
              <>
                <Bed className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {travel.tipoQuarto && String(travel.tipoQuarto).trim() ? travel.tipoQuarto : "Tipo de quarto não informado"}
                </span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {travel.hospedagem && String(travel.hospedagem).trim() ? travel.hospedagem : "Hospedagem não informada"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="my-3 md:my-2 border-t border-gray-200/80" />

        <div className="mt-0 md:mt-auto flex flex-col md:grid md:grid-cols-[55%_45%] md:gap-4 md:items-end">
          <div>
            <p className="text-xs md:text-sm text-gray-500">Apartir de</p>
            <p className="text-base md:text-xl font-bold text-accent">{formatCurrency(travel.valorTotal)}</p>
            {travel.quantidadeParcelas && travel.valorParcela ? (
              <p className="text-xs md:text-sm text-gray-500">
                ou {travel.quantidadeParcelas}x de {formatCurrency(travel.valorParcela)} {travel.temJuros ? "com juros" : "sem juros"}
              </p>
            ) : null}
            {travel.xp > 0 && (
              <p className="mt-1 text-xs md:text-sm font-semibold text-amber-600">
                Acumule +{Number(travel.xp).toLocaleString("pt-BR")} pontos XP
              </p>
            )}
          </div>

          <div className={cn("h-full items-end justify-end pr-2", hideButtonOnMobile ? "hidden md:flex" : "flex")}>
            {whatsappNumber && (
              <a
                href={buildViagemWhatsAppLink(travel, whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mr-2 inline-flex items-center gap-1.5 bg-accent text-accent-foreground hover:opacity-90 border-2 border-accent rounded-lg font-medium micro-shadow px-3 py-1.5 text-xs md:text-sm"
              >
                <span>Tenho interesse</span>
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
