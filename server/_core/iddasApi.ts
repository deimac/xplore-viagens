/**
 * Iddas Agency CRM API Client
 * Handles authentication and API calls to Iddas CRM system
 */

const IDDAS_API_KEY = "86b8d27bc6e9ce6559a9b403e924a420e6f865e17762a562fd8c45227031d958";
const IDDAS_BASE_URL = "https://agencia.iddas.com.br/api/v1";

interface IddasAuthResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

interface IddasAeroporto {
    id: number;
    nome: string;
    codigo: string;
    cidade?: string;
    estado?: string;
    pais?: string;
}

interface IddasAeroportosResponse {
    data: IddasAeroporto[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

/**
 * Authenticate with Iddas API and get access token
 */
export async function authenticateIddas(): Promise<string> {
    const url = `${IDDAS_BASE_URL}/auth/login`;
    const payload = { chave: IDDAS_API_KEY };

    console.log("🔑 Tentando autenticar na API Iddas...");
    console.log("URL:", url);
    console.log("Payload:", { chave: IDDAS_API_KEY.substring(0, 20) + "..." });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    console.log("📡 Status da resposta:", response.status);
    console.log("📡 Headers da resposta:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na resposta:", errorText);
        throw new Error(`Iddas authentication failed: ${response.status} - ${errorText}`);
    }

    const data: IddasAuthResponse = await response.json();
    console.log("✅ Token recebido com sucesso");

    if (!data.access_token) {
        throw new Error("No access token in Iddas response");
    }

    return data.access_token;
}

/**
 * Get airports list from Iddas API
 */
export async function getAeroportos(
    token: string,
    page: number = 1,
    perPage: number = 10
): Promise<IddasAeroportosResponse> {
    const response = await fetch(
        `${IDDAS_BASE_URL}/aeroporto?page=${page}&per_page=${perPage}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch airports: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Get all airports (fetch all pages)
 */
export async function getAllAeroportos(): Promise<IddasAeroporto[]> {
    const token = await authenticateIddas();
    const firstPage = await getAeroportos(token, 1, 100);

    let allAeroportos = firstPage.data;
    const totalPages = firstPage.last_page;

    // Fetch remaining pages if any
    if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
            promises.push(getAeroportos(token, page, 100));
        }
        const results = await Promise.all(promises);
        results.forEach(result => {
            allAeroportos = allAeroportos.concat(result.data);
        });
    }

    return allAeroportos;
}

/**
 * Get sales (vendas) from Iddas API
 */
export async function getVendas(
    token: string,
    codigoVenda?: string,
    dataInicial?: string,
    dataFinal?: string,
    cliente?: number
): Promise<any> {
    let url = codigoVenda
        ? `${IDDAS_BASE_URL}/venda/${codigoVenda}`
        : `${IDDAS_BASE_URL}/venda`;

    // Build query parameters
    const params = new URLSearchParams();
    if (dataInicial) params.append("data_inicial", dataInicial);
    if (dataFinal) params.append("data_final", dataFinal);
    if (cliente) params.append("cliente", cliente.toString());

    const queryString = params.toString();
    if (queryString && !codigoVenda) {
        url += `?${queryString}`;
    }

    console.log("📦 Buscando vendas...");
    console.log("URL:", url);
    console.log("Filtros:", { dataInicial, dataFinal, cliente });

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    console.log("📡 Status da resposta vendas:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro ao buscar vendas:", errorText);
        throw new Error(`Failed to fetch sales: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Vendas recebidas com sucesso");
    return data;
}

/**
 * Get pessoas from Iddas API
 */
export async function getPessoas(
    token: string,
    cpfCnpj?: string,
    id?: string
): Promise<any> {
    let url;

    // Se tem ID, busca direto por /pessoa/{id}
    if (id) {
        url = `${IDDAS_BASE_URL}/pessoa/${id}`;
    } else {
        url = `${IDDAS_BASE_URL}/pessoa`;
        // Build query parameters
        if (cpfCnpj) {
            const params = new URLSearchParams();
            params.append("cpf_cnpj", cpfCnpj);
            url += `?${params.toString()}`;
        }
    }

    console.log("👥 Buscando pessoas...");
    console.log("URL:", url);
    console.log("Filtro ID:", id || "não preenchido");
    console.log("Filtro CPF/CNPJ:", cpfCnpj || "não preenchido");

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    console.log("📡 Status da resposta pessoas:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro ao buscar pessoas:", errorText);
        throw new Error(`Failed to fetch pessoas: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Pessoas recebidas com sucesso");
    return data;
}

/**
 * Get orçamento from Iddas API
 */
export async function getOrcamento(
    token: string,
    id?: string,
    pessoaId?: string
): Promise<any> {
    let url = `${IDDAS_BASE_URL}/orcamento`;

    // Se tem ID específico, busca direto por /orcamento/{id}
    if (id) {
        url = `${IDDAS_BASE_URL}/orcamento/${id}`;
    } else if (pessoaId) {
        // Se tem ID da pessoa, filtra por pessoa
        url += `?pessoa_id=${pessoaId}`;
    }

    console.log("📋 Buscando orçamento...");
    console.log("URL:", url);
    console.log("ID Orçamento:", id || "não preenchido");
    console.log("ID Pessoa:", pessoaId || "não preenchido");

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    console.log("📡 Status da resposta orçamento:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro ao buscar orçamento:", errorText);
        throw new Error(`Failed to fetch orcamento: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Orçamento recebido com sucesso");
    return data;
}
