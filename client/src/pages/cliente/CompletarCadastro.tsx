/**
 * Completar Cadastro – obrigatório antes de acessar funcionalidades
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

export default function CompletarCadastro() {
    const [, navigate] = useLocation();
    const utils = trpc.useUtils();
    const meQuery = trpc.cliente.me.useQuery();
    const completar = trpc.cliente.completarCadastro.useMutation();

    const [form, setForm] = useState({
        cpf: "",
        telefone: "",
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        cidade: "",
        estado: "",
    });

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await completar.mutateAsync({
                cpf: form.cpf.replace(/\D/g, ""),
                telefone: form.telefone.replace(/\D/g, ""),
                cep: form.cep.replace(/\D/g, ""),
                endereco: form.endereco,
                numero: form.numero,
                complemento: form.complemento || undefined,
                cidade: form.cidade,
                estado: form.estado,
            });
            toast.success("Cadastro completado!");
            await utils.cliente.me.invalidate();
            navigate("/minha-conta/dashboard");
        } catch (err: any) {
            toast.error(err?.message || "Erro ao completar cadastro");
        }
    };

    const formatCpf = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 10) {
            return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
        }
        return digits
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    };

    const formatCep = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 8);
        return digits.replace(/(\d{5})(\d)/, "$1-$2");
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-6 py-20"
            style={{ background: "#1A2B4C" }}
        >
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-lg p-8 md:p-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-accent">
                                Completar Cadastro
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {meQuery.data?.nome
                                    ? `Olá ${meQuery.data.nome}! Complete seus dados para continuar.`
                                    : "Complete seus dados para continuar."}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cpf">CPF *</Label>
                                <Input
                                    id="cpf"
                                    value={form.cpf}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, cpf: formatCpf(e.target.value) }))
                                    }
                                    required
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                            </div>
                            <div>
                                <Label htmlFor="telefone">Telefone *</Label>
                                <Input
                                    id="telefone"
                                    value={form.telefone}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            telefone: formatPhone(e.target.value),
                                        }))
                                    }
                                    required
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cep">CEP *</Label>
                                <Input
                                    id="cep"
                                    value={form.cep}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, cep: formatCep(e.target.value) }))
                                    }
                                    required
                                    placeholder="00000-000"
                                    maxLength={9}
                                />
                            </div>
                            <div>
                                <Label htmlFor="estado">Estado *</Label>
                                <Input
                                    id="estado"
                                    value={form.estado}
                                    onChange={set("estado")}
                                    required
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="cidade">Cidade *</Label>
                            <Input
                                id="cidade"
                                value={form.cidade}
                                onChange={set("cidade")}
                                required
                                placeholder="São Paulo"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="endereco">Endereço *</Label>
                                <Input
                                    id="endereco"
                                    value={form.endereco}
                                    onChange={set("endereco")}
                                    required
                                    placeholder="Rua, Avenida..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="numero">Nº *</Label>
                                <Input
                                    id="numero"
                                    value={form.numero}
                                    onChange={set("numero")}
                                    required
                                    placeholder="123"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input
                                id="complemento"
                                value={form.complemento}
                                onChange={set("complemento")}
                                placeholder="Apto, Bloco... (opcional)"
                            />
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={completar.isPending}>
                            {completar.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Completar Cadastro
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
