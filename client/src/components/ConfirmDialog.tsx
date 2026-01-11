import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ConfirmDialog({
  open,
  title = "Confirmar ação",
  description = "Tem certeza que deseja continuar? Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onCancel())}>
      <DialogContent className="py-4 bg-white rounded-2xl w-[420px] shadow-lg border p-0 text-center animate-[fadeIn_150ms_ease]">
        <div className="p-6">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </div>
        <DialogFooter className="px-6 pb-6 pt-0 flex justify-center gap-3">
          <Button variant="ghost" onClick={onCancel} className="px-4 py-2">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white hover:opacity-95">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
