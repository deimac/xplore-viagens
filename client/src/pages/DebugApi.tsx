import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function DebugApi() {
    const [testTriggered, setTestTriggered] = useState(false);
    const [vendaTriggered, setVendaTriggered] = useState(false);
    const [pessoaTriggered, setPessoaTriggered] = useState(false);
    const [codigoVenda, setCodigoVenda] = useState("");
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");
    const [cliente, setCliente] = useState("");
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [pessoaId, setPessoaId] = useState("");
    const [orcamentoTriggered, setOrcamentoTriggered] = useState(false);
    const [orcamentoId, setOrcamentoId] = useState("");
    const [orcamentoPessoaId, setOrcamentoPessoaId] = useState("");

    // Use tRPC hooks para aeroportos
    const authQuery = trpc.iddas.auth.useQuery(undefined, {
        enabled: testTriggered,
    });

    const aeroportosQuery = trpc.iddas.aeroportos.useQuery(
        { page: 1, perPage: 10 },
        {
            enabled: testTriggered && !!authQuery.data,
        }
    );

    // Use tRPC hooks para vendas
    const vendasQuery = trpc.iddas.vendas.useQuery(
        {
            codigo: codigoVenda || undefined,
            dataInicial: dataInicial || undefined,
            dataFinal: dataFinal || undefined,
            cliente: cliente ? parseInt(cliente) : undefined,
        },
        {
            enabled: vendaTriggered,
        }
    );

    // Use tRPC hooks para pessoas
    const pessoasQuery = trpc.iddas.pessoas.useQuery(
        {
            cpfCnpj: cpfCnpj || undefined,
            id: pessoaId || undefined,
        },
        {
            enabled: pessoaTriggered,
        }
    );

    const orcamentoQuery = trpc.iddas.orcamento.useQuery(
        {
            id: orcamentoId || undefined,
            pessoaId: orcamentoPessoaId || undefined,
        },
        {
            enabled: orcamentoTriggered,
        }
    );

    const handleTest = () => {
        setTestTriggered(true);
        console.log("1. Iniciando teste aeroportos via backend...");
    };

    const handleTestVendas = () => {
        setVendaTriggered(true);
        console.log("1. Iniciando teste vendas via backend...");
        console.log("Filtros:", { codigoVenda, dataInicial, dataFinal, cliente });
    };

    const handleTestPessoas = () => {
        setPessoaTriggered(true);
        console.log("1. Iniciando teste pessoas via backend...");
        console.log("Filtro CPF/CNPJ:", cpfCnpj || "não preenchido");
    };

    const handleTestOrcamento = () => {
        setOrcamentoTriggered(true);
        console.log("1. Iniciando teste orçamento via backend...");
        console.log("ID Orçamento:", orcamentoId || "não preenchido");
        console.log("ID Pessoa:", orcamentoPessoaId || "não preenchido");
    };

    const loading = authQuery.isLoading || aeroportosQuery.isLoading;
    const vendaLoading = vendasQuery.isLoading;
    const pessoaLoading = pessoasQuery.isLoading;
    const orcamentoLoading = orcamentoQuery.isLoading;
    const error = authQuery.error || aeroportosQuery.error;
    const vendaError = vendasQuery.error;
    const pessoaError = pessoasQuery.error;
    const orcamentoError = orcamentoQuery.error;
    const tokenData = authQuery.data;
    const aeroportosData = aeroportosQuery.data;
    const vendasData = vendasQuery.data;
    const pessoasData = pessoasQuery.data;
    const orcamentoData = orcamentoQuery.data;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-foreground mb-6">Teste API Iddas</h1>

                <button
                    onClick={handleTest}
                    disabled={loading}
                    className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed mb-6 mr-3"
                >
                    {loading ? "Testando Aeroportos..." : "Testar Aeroportos"}
                </button>

                <div className="mb-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Filtros de Vendas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={codigoVenda}
                            onChange={(e) => setCodigoVenda(e.target.value)}
                            placeholder="Código da venda (opcional)"
                            className="px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                            type="date"
                            value={dataInicial}
                            onChange={(e) => setDataInicial(e.target.value)}
                            className="px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                            type="date"
                            value={dataFinal}
                            onChange={(e) => setDataFinal(e.target.value)}
                            className="px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                            type="number"
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            placeholder="ID do Cliente (opcional)"
                            className="px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </div>

                <div className="mb-6 flex gap-2">
                    <button
                        onClick={handleTestVendas}
                        disabled={vendaLoading}
                        className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {vendaLoading ? "Buscando Vendas..." : "Testar Vendas"}
                    </button>
                    <button
                        onClick={() => {
                            setCodigoVenda("");
                            setDataInicial("");
                            setDataFinal("");
                            setCliente("");
                        }}
                        className="px-6 py-3 bg-muted text-muted-foreground rounded-md hover:bg-muted/90"
                    >
                        Limpar Filtros
                    </button>
                </div>

                <div className="mb-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Buscar Pessoas:</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={pessoaId}
                            onChange={(e) => setPessoaId(e.target.value)}
                            placeholder="ID da Pessoa (opcional)"
                            className="flex-1 px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                            type="text"
                            value={cpfCnpj}
                            onChange={(e) => setCpfCnpj(e.target.value)}
                            placeholder="CPF ou CNPJ (opcional)"
                            className="flex-1 px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button
                            onClick={handleTestPessoas}
                            disabled={pessoaLoading}
                            className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pessoaLoading ? "Buscando..." : "Testar Pessoas"}
                        </button>
                    </div>
                </div>

                <div className="mb-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Buscar Orçamento:</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={orcamentoId}
                            onChange={(e) => setOrcamentoId(e.target.value)}
                            placeholder="ID do Orçamento (opcional)"
                            className="flex-1 px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                            type="text"
                            value={orcamentoPessoaId}
                            onChange={(e) => setOrcamentoPessoaId(e.target.value)}
                            placeholder="ID da Pessoa (opcional)"
                            className="flex-1 px-3 py-2 border border-muted rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button
                            onClick={handleTestOrcamento}
                            disabled={orcamentoLoading}
                            className="px-6 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {orcamentoLoading ? "Buscando..." : "Testar Orçamento"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
                        <h2 className="font-bold mb-2">❌ Erro (Aeroportos):</h2>
                        <pre className="text-sm overflow-x-auto">{error.message}</pre>
                    </div>
                )}

                {vendaError && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
                        <h2 className="font-bold mb-2">❌ Erro (Vendas):</h2>
                        <pre className="text-sm overflow-x-auto">{vendaError.message}</pre>
                    </div>
                )}

                {pessoaError && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
                        <h2 className="font-bold mb-2">❌ Erro (Pessoas):</h2>
                        <pre className="text-sm overflow-x-auto">{pessoaError.message}</pre>
                    </div>
                )}

                {orcamentoError && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
                        <h2 className="font-bold mb-2">❌ Erro (Orçamento):</h2>
                        <pre className="text-sm overflow-x-auto">{orcamentoError.message}</pre>
                    </div>
                )}

                {tokenData && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground mb-3">✅ 1. Autenticação (Token)</h2>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs overflow-x-auto text-foreground">
                                {JSON.stringify(tokenData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {aeroportosData && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground mb-3">✅ 2. Aeroportos (Lista)</h2>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs overflow-x-auto text-foreground">
                                {JSON.stringify(aeroportosData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {vendasData && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground mb-3">✅ 3. Vendas {codigoVenda ? `(${codigoVenda})` : "(Todas)"}</h2>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs overflow-x-auto text-foreground">
                                {JSON.stringify(vendasData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {pessoasData && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground mb-3">✅ 4. Pessoas {pessoaId ? `(ID: ${pessoaId})` : cpfCnpj ? `(${cpfCnpj})` : "(Todas)"}</h2>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs overflow-x-auto text-foreground">
                                {JSON.stringify(pessoasData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {orcamentoData && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground mb-3">✅ 5. Orçamento {orcamentoId ? `(ID: ${orcamentoId})` : orcamentoPessoaId ? `(Pessoa ID: ${orcamentoPessoaId})` : "(Todos)"}</h2>
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-xs overflow-x-auto text-foreground">
                                {JSON.stringify(orcamentoData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mt-8 p-4 bg-muted/50 rounded-md">
                    <h3 className="font-semibold text-foreground mb-2">ℹ️ Informações:</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Backend Proxy:</strong> Usando endpoints tRPC locais</li>
                        <li>• <strong>Aeroportos Endpoint:</strong> /api/trpc/iddas.aeroportos</li>
                        <li>• <strong>Vendas Endpoint:</strong> /api/trpc/iddas.vendas</li>
                        <li>• <strong>Pessoas Endpoint:</strong> /api/trpc/iddas.pessoas</li>
                        <li>• <strong>Orçamento Endpoint:</strong> /api/trpc/iddas.orcamento</li>
                        <li>• <strong>Vantagem:</strong> Sem problemas de CORS, autenticação segura no servidor</li>
                        <li>• <strong>Vendas:</strong> Use código ou filtros de data/cliente</li>
                        <li>• <strong>Pessoas:</strong> Busque por ID específico ou CPF/CNPJ - deixe vazio para todas</li>
                        <li>• <strong>Orçamento:</strong> ID do orçamento OU ID da pessoa (ambos opcionais)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
