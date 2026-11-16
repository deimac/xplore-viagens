import { AlertTriangle, MessageCircle, PackageX, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/PackageCard";

interface Props {
  code: number;
  whatsappNumber?: string | null;
  onClose: () => void;
}

// Página do pacote enviado por link (/pacote/:code): abre mesmo se o pacote não aparece no site.
export function PackageView({ code, whatsappNumber, onClose }: Props) {
  const { data: travel, isLoading } = trpc.viagens.getByCode.useQuery({ code }, { retry: false });

  const closeButton = (
    <div className="flex justify-end mb-4">
      <button
        type="button"
        onClick={onClose}
        className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent hover:text-white transition-all border-2 border-accent/20 flex items-center justify-center"
        aria-label="Fechar pacote"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        {closeButton}
        <div className="rounded-2xl bg-white h-[460px] animate-pulse shadow-lg overflow-hidden">
          <div className="h-[52%] bg-slate-200" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-6 bg-slate-200 rounded w-1/3 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!travel) {
    const number = whatsappNumber?.replace(/\D/g, "");
    const message = `Olá! Recebi o pacote #${code}, mas ele não está mais disponível. Têm outras opções?`;
    return (
      <div className="w-full max-w-md mx-auto">
        {closeButton}
        <div className="rounded-2xl bg-white shadow-lg p-8 text-center space-y-4">
          <PackageX className="w-10 h-10 mx-auto text-accent/60" />
          <h2 className="text-xl font-semibold text-accent">Pacote indisponível</h2>
          <p className="text-sm text-gray-500">Este pacote esgotou ou saiu do ar.</p>
          {number && (
            <Button asChild className="gap-2">
              <a href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp <MessageCircle className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const travelAny = travel as any;
  return (
    <div className="w-full max-w-md mx-auto">
      {closeButton}
      <PackageCard
        travel={travelAny}
        whatsappNumber={whatsappNumber}
        className="h-[460px] shadow-lg"
      />
      {travelAny.descricao?.trim() && (
        <div className="mt-6 rounded-2xl bg-white shadow-sm p-5">
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{travelAny.descricao}</p>
        </div>
      )}
      <div className="mt-4 inline-flex w-full items-center justify-center gap-2 text-[11px] md:text-xs text-amber-600 text-center">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <p>Tarifas sujeitas a alteração e disponibilidade.</p>
      </div>
    </div>
  );
}
