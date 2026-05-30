import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Sparkle } from "lucide-react";
import type { CenarioCompleto } from "./types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTitulo: string;
    cenariosSelecionados: CenarioCompleto[];
    onSubmit: (titulo: string, validadeData: string) => void;
    isSubmitting: boolean;
}

export function PropostaDialog({
    open,
    onOpenChange,
    defaultTitulo,
    cenariosSelecionados,
    onSubmit,
    isSubmitting,
}: Props) {
    const [titulo, setTitulo] = useState(defaultTitulo);
    const [validadeData, setValidadeData] = useState("");

    useEffect(() => {
        if (open) {
            setTitulo(defaultTitulo);
            setValidadeData("");
        }
    }, [open, defaultTitulo]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Gerar proposta
                    </DialogTitle>
                    <DialogDescription>
                        Cria um snapshot cliente-safe dos cenários marcados. Custo, fonte e estratégia internos ficam ocultos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Título (opcional)</Label>
                        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Validade (opcional)</Label>
                        <Input
                            type="date"
                            value={validadeData}
                            onChange={(e) => setValidadeData(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border bg-emerald-50/50 border-emerald-200 p-3">
                        <div className="text-xs font-semibold text-emerald-800 mb-1.5 flex items-center gap-1">
                            <Sparkle className="h-3 w-3" />
                            Cenários incluídos ({cenariosSelecionados.length})
                        </div>
                        {cenariosSelecionados.length === 0 ? (
                            <p className="text-xs text-rose-700">
                                Nenhum cenário marcado como "selecionado para proposta".
                            </p>
                        ) : (
                            <ul className="text-xs text-emerald-900 space-y-0.5">
                                {cenariosSelecionados.map((c) => (
                                    <li key={c.id}>
                                        • {c.nome}{" "}
                                        <span className="text-emerald-700/70">({c.pecas.length} peças)</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onSubmit(titulo, validadeData)}
                        disabled={isSubmitting || cenariosSelecionados.length === 0}
                    >
                        {isSubmitting ? "Gerando..." : "Gerar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
