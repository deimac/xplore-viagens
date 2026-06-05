import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Plane } from "lucide-react";
import { fmtBagagemDirecao, fmtBagagemPeca, fmtBagagemSegmento } from "@/lib/cotacoes/bagagem";

function fmtCurrency(v: number | null | undefined): string {
    if (v == null) return "Sob consulta";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string | null): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDuracao(min: number | null): string {
    if (!min || min <= 0) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

function asArray<T = any>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

export default function PropostaViewPage() {
    const params = useParams<{ id: string; propostaId: string }>();
    const cotacaoId = Number(params.id);
    const propostaId = Number(params.propostaId);

    const { data, isLoading } = trpc.cotacoesWorkspace.getProposta.useQuery({ id: propostaId });

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Carregando proposta...</div>;
    }
    if (!data) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <p className="text-sm text-muted-foreground">Proposta não encontrada.</p>
                <Link href={`/admin/cotacoes/${cotacaoId}`} className="text-primary underline text-sm">Voltar</Link>
            </div>
        );
    }

    const snap = data.snapshot as any;
    const cenarios = asArray<any>(snap?.cenarios);
    const totalPax = (snap?.cotacao?.paxAdultos ?? 0) + (snap?.cotacao?.paxCriancas ?? 0) + (snap?.cotacao?.paxBebes ?? 0);

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            {/* Toolbar (não imprime) */}
            <div className="bg-white border-b sticky top-0 z-10 print:hidden">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href={`/admin/cotacoes/${cotacaoId}`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Voltar para a cotação
                    </Link>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
                    </Button>
                </div>
            </div>

            {/* Documento */}
            <div className="max-w-4xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
                <div className="bg-white shadow-sm print:shadow-none rounded-lg print:rounded-none p-10 print:p-8 space-y-8">
                    {/* Cabeçalho */}
                    <header className="border-b pb-5 flex items-start justify-between">
                        <div>
                            <div className="text-2xl font-bold tracking-tight text-primary">Xplore Viagens</div>
                            <div className="text-xs text-muted-foreground mt-1">Proposta de viagem personalizada</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-0.5">
                            <div>Emitida em {fmtDate(snap.geradoEm)}</div>
                            {snap.validadeData && <div>Válida até <span className="font-medium text-foreground">{fmtDate(snap.validadeData)}</span></div>}
                            <div>Ref. #{data.id}</div>
                        </div>
                    </header>

                    {/* Cliente */}
                    <section>
                        <h1 className="text-xl font-semibold">
                            {snap.titulo || `Proposta para ${snap.cotacao.clienteNome}`}
                        </h1>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</div>
                                <div className="font-medium">{snap.cotacao.clienteNome}</div>
                            </div>
                            {(snap.cotacao.origem || snap.cotacao.destino) && (
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Trecho</div>
                                    <div className="font-medium">{snap.cotacao.origem || "?"} → {snap.cotacao.destino || "?"}</div>
                                </div>
                            )}
                            {(snap.cotacao.dataIda || snap.cotacao.dataVolta) && (
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Datas</div>
                                    <div className="font-medium">
                                        {snap.cotacao.dataIda ? fmtDate(snap.cotacao.dataIda) : "?"}
                                        {snap.cotacao.dataVolta ? ` – ${fmtDate(snap.cotacao.dataVolta)}` : ""}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Passageiros</div>
                                <div className="font-medium">
                                    {totalPax} ({snap.cotacao.paxAdultos} adt{snap.cotacao.paxCriancas ? `, ${snap.cotacao.paxCriancas} chd` : ""}{snap.cotacao.paxBebes ? `, ${snap.cotacao.paxBebes} inf` : ""})
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Opções */}
                    <section className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Opções disponíveis</h2>

                        {cenarios.map((c, idx) => {
                            const pecas = asArray<any>(c?.pecas);
                            return (
                                <article key={idx} className="rounded-lg border p-5 break-inside-avoid print:border-slate-300">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">{c.nome}</h3>
                                            {c.descricao && <p className="text-sm text-muted-foreground mt-0.5">{c.descricao}</p>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Valor total</div>
                                            <div className="text-2xl font-bold text-primary">{fmtCurrency(c.totalVenda)}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {pecas.map((p, pi) => {
                                            const segmentos = asArray<any>(p?.segmentos);
                                            return (
                                                <div key={pi} className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                                        <Plane className="h-4 w-4" />
                                                        {p.grupo === "ida" ? "Ida" : p.grupo === "volta" ? "Volta" : p.titulo || "Trecho"}
                                                        {p.companhias && <span className="text-foreground font-normal normal-case tracking-normal">· {p.companhias}</span>}
                                                        {p.classe && <span className="text-foreground font-normal normal-case tracking-normal">· {p.classe}</span>}
                                                    </div>

                                                    {/* Resumo da peça */}
                                                    <div className="rounded border bg-slate-50 print:bg-white p-3 text-sm">
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <div className="font-semibold">{fmtDateTime(p.dataSaida)}</div>
                                                                    <div className="text-xs text-muted-foreground">{p.origem || segmentos[0]?.aeroportoOrigem || ""}</div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex flex-col items-center">
                                                                    <span>{fmtDuracao(p.duracaoMinutos)}</span>
                                                                    <div className="w-16 border-t border-dashed my-1" />
                                                                    <span>{p.qtdConexoes > 0 ? `${p.qtdConexoes} parada${p.qtdConexoes > 1 ? "s" : ""}` : "Direto"}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold">{fmtDateTime(p.dataChegada)}</div>
                                                                    <div className="text-xs text-muted-foreground">{p.destino || segmentos[segmentos.length - 1]?.aeroportoDestino || ""}</div>
                                                                </div>
                                                            </div>
                                                            {fmtBagagemPeca(p) && (
                                                                <div className="text-xs">
                                                                    <span className="text-muted-foreground">Bagagem:</span>{" "}
                                                                    <span className="font-medium">{fmtBagagemPeca(p)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Segmentos detalhados */}
                                                    {segmentos.length > 0 && (
                                                        <div className="ml-3 border-l-2 border-slate-200 pl-3 space-y-2">
                                                            {segmentos.map((s, si) => (
                                                                <div key={si} className="text-xs">
                                                                    {(() => {
                                                                        const bagagemSegmento = fmtBagagemSegmento(s.bagagem);
                                                                        const bagagemFallback = fmtBagagemDirecao(
                                                                            p,
                                                                            p.grupo === "volta" ? "volta" : "ida"
                                                                        );
                                                                        const bagagemExibida = bagagemSegmento || bagagemFallback;
                                                                        return (
                                                                            <>
                                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                                                    <span className="font-semibold">
                                                                                        {s.aeroportoOrigem || s.cidadeOrigem || "?"} → {s.aeroportoDestino || s.cidadeDestino || "?"}
                                                                                    </span>
                                                                                    {s.companhia && <span className="text-muted-foreground">{s.companhia} {s.numeroVoo || ""}</span>}
                                                                                    {s.classe && <span className="text-muted-foreground">{s.classe}</span>}
                                                                                </div>
                                                                                <div className="text-muted-foreground">
                                                                                    Sai {fmtDateTime(s.saida)} · Chega {fmtDateTime(s.chegada)}
                                                                                    {bagagemExibida
                                                                                        ? ` · Bagagem ${bagagemExibida}`
                                                                                        : ""}
                                                                                </div>
                                                                                {si < segmentos.length - 1 && s.duracaoConexaoMinutos != null && (
                                                                                    <div className="text-amber-700 mt-1">↳ Conexão: {fmtDuracao(s.duracaoConexaoMinutos)}</div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </article>
                            )
                        })}
                    </section>

                    {/* Rodapé */}
                    <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
                        <p>Valores sujeitos a alteração e disponibilidade no momento da emissão.</p>
                        {snap.validadeData && <p>Esta proposta tem validade até {fmtDate(snap.validadeData)}.</p>}
                        <p>Xplore Viagens · Sua próxima viagem começa aqui.</p>
                    </footer>
                </div>
            </div>

            <style>{`
        @media print {
          @page { margin: 12mm; }
          body { background: white !important; }
        }
      `}</style>
        </div>
    );
}
