import { useMemo, useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Search, Plane, Plus, Star, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { PecaCard, type CenarioOption } from "./PecaCard";
import type { PecaCompleta, CenarioCompleto } from "./types";
import { matchesText } from "@/lib/cotacoes/calc";

interface Props {
    pecas: PecaCompleta[];
    cenarios: CenarioCompleto[];
    onNewPeca: () => void;
    onToggleFavorita: (peca: PecaCompleta) => void;
    onEditPeca: (peca: PecaCompleta) => void;
    onDeletePeca: (peca: PecaCompleta) => void;
    onAddPecaToCenario: (peca: PecaCompleta, cenarioId: number) => void;
    onCreateCenarioWithPeca: (peca: PecaCompleta) => void;
}

export function PecaLibrary({
    pecas,
    cenarios,
    onNewPeca,
    onToggleFavorita,
    onEditPeca,
    onDeletePeca,
    onAddPecaToCenario,
    onCreateCenarioWithPeca,
}: Props) {
    const [search, setSearch] = useState("");
    const [filtroTipo, setFiltroTipo] = useState<string>("todos");
    const [filtroCompanhia, setFiltroCompanhia] = useState<string>("todas");
    const [filtroOrigem, setFiltroOrigem] = useState<string>("todas");
    const [soFavoritas, setSoFavoritas] = useState(false);

    const companhiasDisponiveis = useMemo(() => {
        const set = new Set<string>();
        pecas.forEach((p) => {
            [p.companhias, p.companhiasVolta].filter(Boolean).forEach((raw) => {
                raw!.split(/[,/+]/).forEach((c) => {
                    const t = c.trim();
                    if (t) set.add(t);
                });
            });
        });
        return Array.from(set).sort();
    }, [pecas]);

    const origensDisponiveis = useMemo(() => {
        const set = new Set<string>();
        pecas.forEach((p) => {
            if (p.origem) set.add(p.origem);
            if (p.origemVolta) set.add(p.origemVolta);
        });
        return Array.from(set).sort();
    }, [pecas]);

    const usoMap = useMemo(() => {
        const m = new Map<number, number>();
        cenarios.forEach((c) => {
            c.pecas.forEach((link) => {
                m.set(link.pecaId, (m.get(link.pecaId) ?? 0) + 1);
            });
        });
        return m;
    }, [cenarios]);

    const filtradas = useMemo(() => {
        return pecas.filter((p) => {
            if (soFavoritas && p.status !== "favorita") return false;
            if (filtroTipo !== "todos" && p.tipoFinanceiro !== filtroTipo) return false;
            if (filtroOrigem !== "todas" && p.origem !== filtroOrigem && p.origemVolta !== filtroOrigem) return false;
            if (filtroCompanhia !== "todas") {
                const has = [p.companhias, p.companhiasVolta]
                    .filter(Boolean)
                    .some((v) => v!.toLowerCase().includes(filtroCompanhia.toLowerCase()));
                if (!has) return false;
            }
            if (!matchesText(p, search)) return false;
            return true;
        });
    }, [pecas, soFavoritas, filtroTipo, filtroOrigem, filtroCompanhia, search]);

    const temFiltro =
        soFavoritas ||
        filtroTipo !== "todos" ||
        filtroCompanhia !== "todas" ||
        filtroOrigem !== "todas" ||
        !!search;

    const limpar = () => {
        setSearch("");
        setFiltroTipo("todos");
        setFiltroCompanhia("todas");
        setFiltroOrigem("todas");
        setSoFavoritas(false);
    };

    return (
        <aside className="flex flex-col h-full border-r bg-card/40">
            <div className="p-3 border-b space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-1.5">
                        <Plane className="h-4 w-4 text-primary" />
                        Biblioteca
                        <span className="text-xs text-muted-foreground font-normal">
                            ({filtradas.length}
                            {filtradas.length !== pecas.length ? `/${pecas.length}` : ""})
                        </span>
                    </h2>
                    <div className="flex gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={onNewPeca}
                            title="Nova peça manual"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar trecho, cia, voo..."
                        className="h-8 pl-8 text-xs"
                    />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <Toggle
                        pressed={soFavoritas}
                        onPressedChange={setSoFavoritas}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 data-[state=on]:border-amber-300"
                    >
                        <Star className="h-3 w-3" />
                        Favoritas
                    </Toggle>

                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger className="h-7 w-auto text-xs gap-1">
                            <Filter className="h-3 w-3" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os tipos</SelectItem>
                            <SelectItem value="pagante">Pagante</SelectItem>
                            <SelectItem value="milhas">Milhas</SelectItem>
                            <SelectItem value="misto">Misto</SelectItem>
                        </SelectContent>
                    </Select>

                    {origensDisponiveis.length > 1 && (
                        <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                            <SelectTrigger className="h-7 w-auto text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Toda origem</SelectItem>
                                {origensDisponiveis.map((o) => (
                                    <SelectItem key={o} value={o}>
                                        {o}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {companhiasDisponiveis.length > 0 && (
                        <Select value={filtroCompanhia} onValueChange={setFiltroCompanhia}>
                            <SelectTrigger className="h-7 w-auto text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Toda cia</SelectItem>
                                {companhiasDisponiveis.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {temFiltro && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={limpar}
                        >
                            <X className="h-3 w-3" />
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pecas.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                        <Plane className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Nenhuma peça ainda</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">
                            Cadastre manualmente ou cole um texto/print da pesquisa.
                        </p>
                        <div className="flex justify-center">
                            <Button size="sm" onClick={onNewPeca} className="gap-1.5">
                                <Plus className="h-3.5 w-3.5" />
                                Nova peça
                            </Button>
                        </div>
                    </div>
                ) : filtradas.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhuma peça com esses filtros.
                    </div>
                ) : (
                    <SortableContext
                        items={filtradas.map((p) => `peca-${p.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {filtradas.map((p) => {
                            const cenariosOptions: CenarioOption[] = cenarios.map((c) => ({
                                id: c.id,
                                nome: c.nome,
                                jaTem: c.pecas.some((l) => l.pecaId === p.id),
                            }));
                            return (
                                <PecaCard
                                    key={p.id}
                                    peca={p}
                                    usadaEmCenarios={usoMap.get(p.id) ?? 0}
                                    cenariosOptions={cenariosOptions}
                                    onToggleFavorita={() => onToggleFavorita(p)}
                                    onEdit={() => onEditPeca(p)}
                                    onDelete={() => onDeletePeca(p)}
                                    onAddToCenario={(cenarioId) => onAddPecaToCenario(p, cenarioId)}
                                    onCreateCenarioAndAdd={() => onCreateCenarioWithPeca(p)}
                                />
                            );
                        })}
                    </SortableContext>
                )}
            </div>
        </aside>
    );
}
