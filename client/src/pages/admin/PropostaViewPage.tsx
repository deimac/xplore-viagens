import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Plane, Backpack, BriefcaseBusiness, Luggage, Clock3 } from "lucide-react";
import { fmtDateTime, fmtDuration, toNumber } from "@/lib/cotacoes/calc";

function asArray<T = any>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function fmtCurrency(v: number | null | undefined): string {
    if (v == null) return "Sob consulta";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(value: Date | string | null | undefined): string {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function getDirecaoSegmento(s: any): "ida" | "volta" {
    return s?.direcao === "volta" ? "volta" : "ida";
}

function getTrechoDuracaoTotal(resumo: any, segmentos: any[]): number | null {
    const explicit = toNumber(resumo?.duracaoMinutos);
    if (explicit != null && explicit > 0) return explicit;
    if (!segmentos.length) return null;
    const inicio = segmentos[0]?.saida;
    const fim = segmentos[segmentos.length - 1]?.chegada;
    if (!inicio || !fim) return null;
    const dInicio = new Date(inicio);
    const dFim = new Date(fim);
    if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) return null;
    const minutos = Math.round((dFim.getTime() - dInicio.getTime()) / 60000);
    return minutos > 0 ? minutos : null;
}

function bagCountsForDirection(peca: any, direcao: "ida" | "volta") {
    if (direcao === "volta") {
        return {
            pessoal: Math.max(0, Number(peca?.itemPessoalVolta ?? 1) || 0),
            mao: Math.max(0, Number(peca?.bagagemMaoVolta ?? 0) || 0),
            despachada: Math.max(0, Number(peca?.bagagemDespachadaVolta ?? 0) || 0),
        };
    }
    return {
        pessoal: Math.max(0, Number(peca?.itemPessoal ?? 1) || 0),
        mao: Math.max(0, Number(peca?.bagagemMao ?? 0) || 0),
        despachada: Math.max(0, Number(peca?.bagagemDespachada ?? 0) || 0),
    };
}

function BaggageIcons({ pessoal, mao, despachada }: { pessoal: number; mao: number; despachada: number }) {
    return (
        <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1" title="Item pessoal">
                <Backpack className="h-3.5 w-3.5" />
                {pessoal}
            </span>
            <span className="inline-flex items-center gap-1" title="Bagagem de mão">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {mao}
            </span>
            <span className="inline-flex items-center gap-1" title="Bagagem despachada">
                <Luggage className="h-3.5 w-3.5" />
                {despachada}
            </span>
        </div>
    );
}

export default function PropostaViewPage() {
    const params = useParams<{ id: string; propostaId: string }>();
    const cotacaoId = Number(params.id);
    const propostaId = Number(params.propostaId);

    const { data, isLoading } = trpc.cotacoesWorkspace.getProposta.useQuery({ id: propostaId });

    const snap = (data?.snapshot as any) ?? {};
    const cotacao = snap?.cotacao ?? {};
    const cenarios = asArray<any>(snap?.cenarios);
    const pecas = asArray<any>(snap?.pecas);
    const totalPax = (cotacao?.paxAdultos ?? 0) + (cotacao?.paxCriancas ?? 0) + (cotacao?.paxBebes ?? 0);

    const pecasById = useMemo(() => {
        const map = new Map<number, any>();
        for (const p of pecas) map.set(Number(p.id), p);
        return map;
    }, [pecas]);

    const cenariosComPecas = useMemo(() => {
        return cenarios.map((cenario) => {
            const links = asArray<any>(cenario?.pecas).sort((a, b) => Number(a?.ordem ?? 0) - Number(b?.ordem ?? 0));
            const itens = links
                .map((link) => {
                    const peca = pecasById.get(Number(link?.pecaId));
                    if (!peca) return null;
                    const grupo =
                        link?.grupo === "volta"
                            ? "volta"
                            : link?.grupo === "ida"
                                ? "ida"
                                : peca?.temVolta
                                    ? "outro"
                                    : "ida";
                    const resumo = grupo === "volta"
                        ? {
                            origem: peca?.origemVolta || peca?.origem,
                            destino: peca?.destinoVolta || peca?.destino,
                            dataSaida: peca?.dataSaidaVolta || peca?.dataSaida,
                            dataChegada: peca?.dataChegadaVolta || peca?.dataChegada,
                            qtdConexoes: peca?.qtdConexoesVolta ?? peca?.qtdConexoes ?? 0,
                            companhia: peca?.companhiasVolta || peca?.companhias,
                            classe: peca?.classeVolta || peca?.classe,
                            duracaoMinutos: peca?.duracaoMinutosVolta ?? peca?.duracaoMinutos ?? null,
                        }
                        : {
                            origem: peca?.origem,
                            destino: peca?.destino,
                            dataSaida: peca?.dataSaida,
                            dataChegada: peca?.dataChegada,
                            qtdConexoes: peca?.qtdConexoes ?? 0,
                            companhia: peca?.companhias,
                            classe: peca?.classe,
                            duracaoMinutos: peca?.duracaoMinutos ?? null,
                        };

                    const segmentos = asArray<any>(peca?.segmentos).filter((s) =>
                        grupo === "outro"
                            ? true
                            : grupo === "volta"
                                ? s?.direcao === "volta"
                                : (s?.direcao ?? "ida") === "ida"
                    );

                    return {
                        link,
                        peca,
                        grupo,
                        resumo,
                        segmentos,
                    };
                })
                .filter(Boolean) as Array<any>;

            const totalVenda = itens.reduce((acc, item) => {
                const custo = toNumber(item?.peca?.custo) ?? 0;
                const lucro = toNumber(item?.peca?.venda) ?? 0;
                return acc + custo + lucro;
            }, 0);
            const temVenda = itens.some((item) => {
                const custo = toNumber(item?.peca?.custo);
                const lucro = toNumber(item?.peca?.venda);
                return custo != null || lucro != null;
            });

            return {
                cenario,
                itens,
                totalVenda: temVenda ? totalVenda : null,
            };
        });
    }, [cenarios, pecasById]);

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

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            <div className="bg-white border-b sticky top-0 z-10 print:hidden">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href={`/admin/cotacoes/${cotacaoId}`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Voltar para a cotação
                    </Link>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
                <div className="bg-white shadow-sm print:shadow-none rounded-lg print:rounded-none p-10 print:p-8 space-y-8">
                    <header className="border-b pb-5 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-2xl font-bold tracking-tight text-primary">Xplore Viagens</div>
                            <div className="text-xs text-muted-foreground mt-1">Proposta de viagem personalizada</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-0.5">
                            <div>Emitida em {fmtDate(data.geradaEm as any)}</div>
                            {data.validadeData && <div>Válida até <span className="font-medium text-foreground">{fmtDate(data.validadeData as any)}</span></div>}
                            <div>Ref. #{data.id}</div>
                        </div>
                    </header>

                    <section>
                        <h1 className="text-xl font-semibold">{data.titulo || `Proposta para ${cotacao?.clienteNome || "cliente"}`}</h1>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</div>
                                <div className="font-medium">{cotacao?.clienteNome || "-"}</div>
                            </div>
                            {(cotacao?.origem || cotacao?.destino) && (
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Trecho</div>
                                    <div className="font-medium">{cotacao?.origem || "?"} → {cotacao?.destino || "?"}</div>
                                </div>
                            )}
                            {(cotacao?.dataIda || cotacao?.dataVolta) && (
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Datas</div>
                                    <div className="font-medium">
                                        {cotacao?.dataIda ? fmtDate(cotacao.dataIda) : "?"}
                                        {cotacao?.dataVolta ? ` – ${fmtDate(cotacao.dataVolta)}` : ""}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Passageiros</div>
                                <div className="font-medium">
                                    {totalPax} ({cotacao?.paxAdultos ?? 0} adt{cotacao?.paxCriancas ? `, ${cotacao.paxCriancas} chd` : ""}{cotacao?.paxBebes ? `, ${cotacao.paxBebes} inf` : ""})
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Opções disponíveis</h2>

                        {cenariosComPecas.map(({ cenario, itens, totalVenda }, idx) => (
                            <article key={idx} className="rounded-lg border p-5 break-inside-avoid print:border-slate-300">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">{cenario?.nome || `Opção ${idx + 1}`}</h3>
                                        {cenario?.descricao && <p className="text-sm text-muted-foreground mt-0.5">{cenario.descricao}</p>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Valor total</div>
                                        <div className="text-2xl font-bold text-primary">{fmtCurrency(totalVenda)}</div>
                                    </div>
                                </div>

                                {itens.length === 0 ? (
                                    <div className="rounded border bg-slate-50 p-3 text-sm text-muted-foreground">
                                        Esta opção não possui peças de voo vinculadas no snapshot.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {itens.map((item, pi) => {
                                            const { peca, grupo, resumo, segmentos } = item;
                                            const segmentosIda = segmentos.filter((s: any) => getDirecaoSegmento(s) === "ida");
                                            const segmentosVolta = segmentos.filter((s: any) => getDirecaoSegmento(s) === "volta");

                                            const bagIda = bagCountsForDirection(peca, "ida");
                                            const bagVolta = bagCountsForDirection(peca, "volta");

                                            const resumoIda = {
                                                origem: peca?.origem,
                                                destino: peca?.destino,
                                                dataSaida: peca?.dataSaida,
                                                dataChegada: peca?.dataChegada,
                                                qtdConexoes: peca?.qtdConexoes,
                                                companhia: peca?.companhias,
                                                classe: peca?.classe,
                                                duracaoMinutos: peca?.duracaoMinutos,
                                            };
                                            const resumoVolta = {
                                                origem: peca?.origemVolta || peca?.origem,
                                                destino: peca?.destinoVolta || peca?.destino,
                                                dataSaida: peca?.dataSaidaVolta || peca?.dataSaida,
                                                dataChegada: peca?.dataChegadaVolta || peca?.dataChegada,
                                                qtdConexoes: peca?.qtdConexoesVolta ?? peca?.qtdConexoes,
                                                companhia: peca?.companhiasVolta || peca?.companhias,
                                                classe: peca?.classeVolta || peca?.classe,
                                                duracaoMinutos: peca?.duracaoMinutosVolta ?? peca?.duracaoMinutos,
                                            };

                                            const mostrarIda = grupo !== "volta";
                                            const mostrarVolta = grupo === "volta" || (grupo === "outro" && peca?.temVolta);

                                            const resumoTrechoBase = grupo === "volta" ? resumoVolta : resumo;
                                            const tituloTrecho = grupo === "volta" ? "Volta" : grupo === "outro" ? "Ida + volta" : "Ida";
                                            return (
                                                <div key={pi} className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                                        <Plane className="h-4 w-4" />
                                                        {tituloTrecho}
                                                        {(peca?.titulo || resumoTrechoBase?.companhia || resumoTrechoBase?.classe) && (
                                                            <span className="text-foreground font-normal normal-case tracking-normal">
                                                                · {peca?.titulo || "Trecho"}
                                                                {resumoTrechoBase?.companhia ? ` · ${resumoTrechoBase.companhia}` : ""}
                                                                {resumoTrechoBase?.classe ? ` · ${resumoTrechoBase.classe}` : ""}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded border bg-slate-50 print:bg-white p-3 text-sm space-y-2">
                                                        {mostrarIda && (
                                                            <>
                                                                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Ida</div>
                                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
                                                                    <div>
                                                                        <div className="font-semibold">{fmtDateTime(resumoIda?.dataSaida)}</div>
                                                                        <div className="text-xs text-muted-foreground">{resumoIda?.origem || segmentosIda[0]?.aeroportoOrigem || "-"}</div>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                                                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />Tempo total: {fmtDuration(getTrechoDuracaoTotal(resumoIda, segmentosIda))}</span>
                                                                        <span>{Number(resumoIda?.qtdConexoes ?? Math.max(0, segmentosIda.length - 1)) > 0 ? `${Number(resumoIda?.qtdConexoes ?? Math.max(0, segmentosIda.length - 1))} conexão${Number(resumoIda?.qtdConexoes ?? Math.max(0, segmentosIda.length - 1)) > 1 ? "ões" : ""}` : "Direto"}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">{fmtDateTime(resumoIda?.dataChegada)}</div>
                                                                        <div className="text-xs text-muted-foreground">{resumoIda?.destino || segmentosIda[segmentosIda.length - 1]?.aeroportoDestino || "-"}</div>
                                                                    </div>
                                                                    <div className="md:text-right text-xs">
                                                                        <div className="text-muted-foreground mb-1">Bagagens</div>
                                                                        <BaggageIcons pessoal={bagIda.pessoal} mao={bagIda.mao} despachada={bagIda.despachada} />
                                                                    </div>
                                                                </div>

                                                                {segmentosIda.length > 0 && (
                                                                    <div className="ml-3 border-l-2 border-slate-200 pl-3 space-y-2">
                                                                        {segmentosIda.map((s: any, si: number) => (
                                                                            <div key={si} className="text-xs space-y-0.5">
                                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                                                    <span className="font-semibold">
                                                                                        {s?.aeroportoOrigem || s?.cidadeOrigem || "?"} → {s?.aeroportoDestino || s?.cidadeDestino || "?"}
                                                                                    </span>
                                                                                    {s?.companhia && <span className="text-muted-foreground">{s.companhia} {s?.numeroVoo || ""}</span>}
                                                                                    {s?.classe && <span className="text-muted-foreground">{s.classe}</span>}
                                                                                </div>
                                                                                <div className="text-muted-foreground">
                                                                                    Sai {fmtDateTime(s?.saida)} · Chega {fmtDateTime(s?.chegada)}
                                                                                </div>
                                                                                {si < segmentosIda.length - 1 && s?.duracaoConexaoMinutos != null && (
                                                                                    <div className="text-amber-700 mt-1">↳ Conexão: {fmtDuration(Number(s.duracaoConexaoMinutos))}</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {mostrarVolta && (
                                                            <div className="border-t pt-2 mt-2 space-y-2">
                                                                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Volta</div>
                                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
                                                                    <div>
                                                                        <div className="font-semibold">{fmtDateTime(resumoVolta?.dataSaida)}</div>
                                                                        <div className="text-xs text-muted-foreground">{resumoVolta?.origem || segmentosVolta[0]?.aeroportoOrigem || "-"}</div>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                                                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />Tempo total: {fmtDuration(getTrechoDuracaoTotal(resumoVolta, segmentosVolta))}</span>
                                                                        <span>{Number(resumoVolta?.qtdConexoes ?? Math.max(0, segmentosVolta.length - 1)) > 0 ? `${Number(resumoVolta?.qtdConexoes ?? Math.max(0, segmentosVolta.length - 1))} conexão${Number(resumoVolta?.qtdConexoes ?? Math.max(0, segmentosVolta.length - 1)) > 1 ? "ões" : ""}` : "Direto"}</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">{fmtDateTime(resumoVolta?.dataChegada)}</div>
                                                                        <div className="text-xs text-muted-foreground">{resumoVolta?.destino || segmentosVolta[segmentosVolta.length - 1]?.aeroportoDestino || "-"}</div>
                                                                    </div>
                                                                    <div className="md:text-right text-xs">
                                                                        <div className="text-muted-foreground mb-1">Bagagens</div>
                                                                        <BaggageIcons pessoal={bagVolta.pessoal} mao={bagVolta.mao} despachada={bagVolta.despachada} />
                                                                    </div>
                                                                </div>

                                                                {segmentosVolta.length > 0 && (
                                                                    <div className="ml-3 border-l-2 border-slate-200 pl-3 space-y-2">
                                                                        {segmentosVolta.map((s: any, si: number) => (
                                                                            <div key={si} className="text-xs space-y-0.5">
                                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                                                    <span className="font-semibold">
                                                                                        {s?.aeroportoOrigem || s?.cidadeOrigem || "?"} → {s?.aeroportoDestino || s?.cidadeDestino || "?"}
                                                                                    </span>
                                                                                    {s?.companhia && <span className="text-muted-foreground">{s.companhia} {s?.numeroVoo || ""}</span>}
                                                                                    {s?.classe && <span className="text-muted-foreground">{s.classe}</span>}
                                                                                </div>
                                                                                <div className="text-muted-foreground">
                                                                                    Sai {fmtDateTime(s?.saida)} · Chega {fmtDateTime(s?.chegada)}
                                                                                </div>
                                                                                {si < segmentosVolta.length - 1 && s?.duracaoConexaoMinutos != null && (
                                                                                    <div className="text-amber-700 mt-1">↳ Conexão: {fmtDuration(Number(s.duracaoConexaoMinutos))}</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>

                    <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
                        <p>Valores sujeitos a alteração e disponibilidade no momento da emissão.</p>
                        {data.validadeData && <p>Esta proposta tem validade até {fmtDate(data.validadeData as any)}.</p>}
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
