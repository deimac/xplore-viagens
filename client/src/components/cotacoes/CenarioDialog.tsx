import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingId: number | null;
    initialNome: string;
    initialDescricao: string;
    onSubmit: (nome: string, descricao: string) => void;
    isSubmitting: boolean;
}

export function CenarioDialog({
    open,
    onOpenChange,
    editingId,
    initialNome,
    initialDescricao,
    onSubmit,
    isSubmitting,
}: Props) {
    const [nome, setNome] = useState(initialNome);
    const [descricao, setDescricao] = useState(initialDescricao);

    useEffect(() => {
        if (open) {
            setNome(initialNome);
            setDescricao(initialDescricao);
        }
    }, [open, initialNome, initialDescricao]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingId ? "Editar cenário" : "Novo cenário"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input
                            autoFocus
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Opção A — Direto Latam"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Descrição (opcional)</Label>
                        <Textarea
                            rows={3}
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="O que diferencia este cenário?"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onSubmit(nome.trim(), descricao)}
                        disabled={isSubmitting || !nome.trim()}
                    >
                        {editingId ? "Salvar" : "Criar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
