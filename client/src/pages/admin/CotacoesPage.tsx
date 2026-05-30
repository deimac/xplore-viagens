import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    rascunho: { label: "Rascunho", variant: "outline" },
    em_pesquisa: { label: "Em pesquisa", variant: "secondary" },
    em_montagem: { label: "Em montagem", variant: "secondary" },
    proposta_enviada: { label: "Proposta enviada", variant: "default" },
    fechada: { label: "Fechada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "destructive" },
};

interface NewCotacaoFormState {
    clienteNome: string;
    clienteEmail: string;
    clienteTelefone: string;
    origem: string;
    destino: string;
    dataIda: string;
    dataVolta: string;
    paxAdultos: number;
    paxCriancas: number;
    paxBebes: number;
    observacoes: string;
}

const emptyForm: NewCotacaoFormState = {
    clienteNome: "",
    clienteEmail: "",
    clienteTelefone: "",
    origem: "",
    destino: "",
    dataIda: "",
    dataVolta: "",
    paxAdultos: 1,
    paxCriancas: 0,
    paxBebes: 0,
    observacoes: "",
};

export default function CotacoesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<NewCotacaoFormState>(emptyForm);

    const utils = trpc.useUtils();
    const { data: cotacoes = [], isLoading } = trpc.cotacoesWorkspace.list.useQuery();

    const createMut = trpc.cotacoesWorkspace.create.useMutation({
        onSuccess: () => {
            toast.success("Cotação criada");
            utils.cotacoesWorkspace.list.invalidate();
            setOpen(false);
            setForm(emptyForm);
        },
        onError: (err) => toast.error(err.message || "Erro ao criar cotação"),
    });

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return cotacoes.filter((c) => {
            if (statusFilter !== "todos" && c.status !== statusFilter) return false;
            if (!term) return true;
            return (
                c.clienteNome?.toLowerCase().includes(term) ||
                c.origem?.toLowerCase().includes(term) ||
                c.destino?.toLowerCase().includes(term) ||
                String(c.id).includes(term)
            );
        });
    }, [cotacoes, search, statusFilter]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clienteNome.trim()) {
            toast.error("Informe o nome do cliente");
            return;
        }
        createMut.mutate({
            clienteNome: form.clienteNome.trim(),
            clienteEmail: form.clienteEmail.trim() || undefined,
            clienteTelefone: form.clienteTelefone.trim() || undefined,
            origem: form.origem.trim() || undefined,
            destino: form.destino.trim() || undefined,
            dataIda: form.dataIda || undefined,
            dataVolta: form.dataVolta || undefined,
            paxAdultos: Number(form.paxAdultos) || 1,
            paxCriancas: Number(form.paxCriancas) || 0,
            paxBebes: Number(form.paxBebes) || 0,
            observacoes: form.observacoes.trim() || undefined,
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Cotações
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Workspace operacional para organizar pesquisas, montar cenários e gerar propostas.
                        </p>
                    </div>
                    <Button onClick={() => setOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova cotação
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, origem, destino, ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os status</SelectItem>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="em_pesquisa">Em pesquisa</SelectItem>
                            <SelectItem value="em_montagem">Em montagem</SelectItem>
                            <SelectItem value="proposta_enviada">Proposta enviada</SelectItem>
                            <SelectItem value="fechada">Fechada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Trecho</TableHead>
                                <TableHead>Datas</TableHead>
                                <TableHead>Pax</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criada</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                                        Nenhuma cotação ainda. Clique em "Nova cotação" para começar.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((c) => {
                                const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "outline" as const };
                                const pax = (c.paxAdultos || 0) + (c.paxCriancas || 0) + (c.paxBebes || 0);
                                return (
                                    <TableRow key={c.id} className="cursor-pointer">
                                        <TableCell className="font-mono text-xs">
                                            <Link href={`/admin/cotacoes/${c.id}`} className="hover:underline">
                                                #{c.id}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/admin/cotacoes/${c.id}`} className="font-medium hover:underline">
                                                {c.clienteNome}
                                            </Link>
                                            {c.clienteTelefone && (
                                                <div className="text-xs text-muted-foreground">{c.clienteTelefone}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {c.origem || "-"} → {c.destino || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {c.dataIda ? new Date(c.dataIda).toLocaleDateString("pt-BR") : "-"}
                                            {c.dataVolta ? ` / ${new Date(c.dataVolta).toLocaleDateString("pt-BR")}` : ""}
                                        </TableCell>
                                        <TableCell className="text-sm">{pax}</TableCell>
                                        <TableCell>
                                            <Badge variant={st.variant}>{st.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {c.criadoEm ? new Date(c.criadoEm).toLocaleString("pt-BR") : "-"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Nova cotação</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <Label>Cliente *</Label>
                                <Input
                                    value={form.clienteNome}
                                    onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
                                    placeholder="Nome do cliente"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label>E-mail</Label>
                                <Input
                                    type="email"
                                    value={form.clienteEmail}
                                    onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Telefone</Label>
                                <Input
                                    value={form.clienteTelefone}
                                    onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Origem</Label>
                                <Input
                                    value={form.origem}
                                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                                    placeholder="Ex: Maceió"
                                />
                            </div>
                            <div>
                                <Label>Destino</Label>
                                <Input
                                    value={form.destino}
                                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                                    placeholder="Ex: Lisboa"
                                />
                            </div>
                            <div>
                                <Label>Data ida</Label>
                                <Input
                                    type="date"
                                    value={form.dataIda}
                                    onChange={(e) => setForm({ ...form, dataIda: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Data volta</Label>
                                <Input
                                    type="date"
                                    value={form.dataVolta}
                                    onChange={(e) => setForm({ ...form, dataVolta: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Adultos</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.paxAdultos}
                                    onChange={(e) => setForm({ ...form, paxAdultos: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Crianças</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.paxCriancas}
                                    onChange={(e) => setForm({ ...form, paxCriancas: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Bebês</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.paxBebes}
                                    onChange={(e) => setForm({ ...form, paxBebes: Number(e.target.value) })}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>Observações</Label>
                                <Textarea
                                    rows={3}
                                    value={form.observacoes}
                                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                                    placeholder="Restrições, preferências, prazos..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMut.isPending}>
                                {createMut.isPending ? "Criando..." : "Criar cotação"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
