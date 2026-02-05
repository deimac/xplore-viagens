import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    itemName?: string;
    onConfirm: () => void;
    isLoading?: boolean;
}

export default function DeleteConfirmDialog({
    open,
    onOpenChange,
    title = "Confirmar exclusão",
    description,
    itemName,
    onConfirm,
    isLoading = false,
}: DeleteConfirmDialogProps) {
    const defaultDescription = itemName
        ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
        : "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-gray-600 pt-2">
                        {description || defaultDescription}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 sm:gap-3 flex-row justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? "Excluindo..." : "Excluir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
