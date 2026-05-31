import { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sparkles,
    FileText,
    Image as ImageIcon,
    Upload,
    Loader2,
} from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExtractText: (texto: string) => void;
    onExtractImage: (file: File) => void;
    isExtractingText: boolean;
    isExtractingImage: boolean;
}

export function ImportIaDialog({
    open,
    onOpenChange,
    onExtractText,
    onExtractImage,
    isExtractingText,
    isExtractingImage,
}: Props) {
    const [texto, setTexto] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag-and-drop state
    const [dragActive, setDragActive] = useState(false);
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onExtractImage(f);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setTexto("");
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Importar com IA
                    </DialogTitle>
                    <DialogDescription>
                        Cole um texto ou envie um print da cotação. A IA extrai os dados; você revisa antes de salvar.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="texto">
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="texto" className="gap-1.5">
                            <FileText className="h-4 w-4" />
                            Texto
                        </TabsTrigger>
                        <TabsTrigger value="print" className="gap-1.5">
                            <ImageIcon className="h-4 w-4" />
                            Print
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="texto" className="space-y-3 pt-3">
                        <Textarea
                            rows={10}
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            placeholder="Cole aqui o texto da cotação (Smiles, Latam Pass, Decolar, e-mail...)"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => onExtractText(texto)}
                                disabled={isExtractingText || !texto.trim()}
                                className="gap-2"
                            >
                                {isExtractingText ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Extraindo...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Extrair
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="print" className="space-y-3 pt-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            aria-label="Enviar print da cotação"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onExtractImage(f);
                                e.target.value = "";
                            }}
                        />
                        <div
                            className={`rounded-lg border-2 border-dashed p-8 text-center space-y-3 transition-colors ${dragActive ? "border-primary bg-primary/10" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                            <div className="text-sm text-muted-foreground">
                                PNG, JPG, WEBP ou GIF<br />
                                <span className="font-medium text-primary">Arraste a imagem aqui</span> ou
                            </div>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtractingImage}
                                className="gap-2"
                            >
                                {isExtractingImage ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Extraindo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Escolher imagem
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
