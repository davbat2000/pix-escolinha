import React, { useEffect, useState, useMemo } from 'react';
import { faturaService } from '../services/faturaService';
import { turmaService } from '../services/turmaService';
import { alunoService } from '../services/alunoService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PixQrModal } from '../components/ui/PixQrModal';
import { ComprovanteModal } from '../components/ui/ComprovanteModal';
import { Modal } from '../components/ui/Modal';
import { formatarMoeda, resumirTxid } from '../utils/formatters';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Search,
    Copy,
    Zap,
    FileText,
    XCircle,
    BookOpen,
    GraduationCap,
    List,
    ChevronDown,
    ChevronRight,
    PieChart
} from 'lucide-react';

export function RelatoriosPage() {
    const { showToast } = useToast();

    const [faturas, setFaturas] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [alunos, setAlunos] = useState([]);

    // Controles do Relatório Detalhado
    const [modoRelatorio, setModoRelatorio] = useState('POR_TURMA');
    const [gruposExpandidos, setGruposExpandidos] = useState({});
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODAS');

    // Estados dos 3 Modais (QR Code Pix, Comprovante/Recibo e Baixa Rápida)
    const [faturaPixModal, setFaturaPixModal] = useState(null);
    const [faturaComprovanteViewModal, setFaturaComprovanteViewModal] = useState(null);
    const [faturaConciliacaoModal, setFaturaConciliacaoModal] = useState(null);

    const carregarDados = async () => {
        try {
            const [listaFaturas, listaTurmas, listaAlunos] = await Promise.all([
                faturaService.listarTodas(),
                turmaService.listarTodas(),
                alunoService.listarTodos(),
            ]);
            setFaturas(listaFaturas);
            setTurmas(listaTurmas);
            setAlunos(listaAlunos);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    // =========================================================================
    // 1. CÁLCULO DE MÉTRICAS E PROJEÇÕES PARA OS GRÁFICOS
    // =========================================================================

    const mrrEsperado = useMemo(() => {
        const mapaTurmaValor = {};
        turmas.forEach((t) => {
            mapaTurmaValor[t.id] = Number(t.valorMensalidadePadrao || 0);
            mapaTurmaValor[t.nome] = Number(t.valorMensalidadePadrao || 0);
        });

        let soma = 0;
        alunos
            .filter((a) => a.ativo !== false)
            .forEach((a) => {
                if (a.matriculasAtivas && a.matriculasAtivas.length > 0) {
                    a.matriculasAtivas.forEach((m) => {
                        const base = mapaTurmaValor[m.turmaId] ?? mapaTurmaValor[m.turmaNome] ?? 0;
                        const bolsa = Number(m.porcentagemBolsa || 0);
                        soma += base * (1 - bolsa / 100);
                    });
                }
            });
        return soma;
    }, [alunos, turmas]);

    const faturasValidas = useMemo(
        () => faturas.filter((f) => f.status !== 'CANCELADA'),
        [faturas]
    );

    const totalEmitido = useMemo(
        () => faturasValidas.reduce((acc, f) => acc + Number(f.valorFinal || 0), 0),
        [faturasValidas]
    );

    const totalRecebido = useMemo(
        () =>
            faturasValidas
                .filter((f) => f.status === 'PAGA')
                .reduce((acc, f) => acc + Number(f.valorFinal || 0), 0),
        [faturasValidas]
    );

    const totalEmAberto = Math.max(0, totalEmitido - totalRecebido);

    const taxaInadimplenciaGeral =
        totalEmitido > 0 ? Math.round((totalEmAberto / totalEmitido) * 100) : 0;

    const dadosFaturamentoMensal = useMemo(() => {
        const mapaMes = {};
        faturasValidas.forEach((f) => {
            const mesAno = f.dataVencimento ? f.dataVencimento.slice(0, 7) : 'Sem Data';
            if (!mapaMes[mesAno]) {
                mapaMes[mesAno] = { mesAno, esperado: 0, recebido: 0, emAberto: 0 };
            }
            const val = Number(f.valorFinal || 0);
            mapaMes[mesAno].esperado += val;
            if (f.status === 'PAGA') {
                mapaMes[mesAno].recebido += val;
            } else {
                mapaMes[mesAno].emAberto += val;
            }
        });

        return Object.values(mapaMes)
            .sort((a, b) => a.mesAno.localeCompare(b.mesAno))
            .slice(-6);
    }, [faturasValidas]);

    const maiorValorMensal = useMemo(() => {
        const maxFatura = Math.max(...dadosFaturamentoMensal.map((d) => d.esperado), 0);
        return Math.max(maxFatura, mrrEsperado, 1);
    }, [dadosFaturamentoMensal, mrrEsperado]);

    const dadosPorTurma = useMemo(() => {
        const mapa = {};
        faturasValidas.forEach((f) => {
            const nome = f.turmaNome || 'Cobranças Avulsas';
            if (!mapa[nome]) {
                mapa[nome] = {
                    turma: nome,
                    total: 0,
                    pago: 0,
                    pendente: 0,
                    qtdTotal: 0,
                    qtdPendente: 0,
                };
            }
            const val = Number(f.valorFinal || 0);
            mapa[nome].total += val;
            mapa[nome].qtdTotal += 1;
            if (f.status === 'PAGA') {
                mapa[nome].pago += val;
            } else {
                mapa[nome].pendente += val;
                mapa[nome].qtdPendente += 1;
            }
        });

        return Object.values(mapa).map((item) => ({
            ...item,
            taxaInadimplencia: item.total > 0 ? Math.round((item.pendente / item.total) * 100) : 0,
            taxaRecebido: item.total > 0 ? Math.round((item.pago / item.total) * 100) : 0,
        }));
    }, [faturasValidas]);

    const rankingInadimplenciaAlunos = useMemo(() => {
        const mapa = {};
        faturasValidas.forEach((f) => {
            const chave = f.alunoId || f.alunoNome;
            if (!mapa[chave]) {
                mapa[chave] = {
                    alunoNome: f.alunoNome,
                    responsavel: f.responsavelNome,
                    turma: f.turmaNome || 'Geral',
                    pendente: 0,
                    pago: 0,
                    faturasEmAberto: 0,
                };
            }
            const val = Number(f.valorFinal || 0);
            if (f.status === 'PAGA') {
                mapa[chave].pago += val;
            } else {
                mapa[chave].pendente += val;
                mapa[chave].faturasEmAberto += 1;
            }
        });

        return Object.values(mapa)
            .filter((a) => a.pendente > 0)
            .sort((a, b) => b.pendente - a.pendente)
            .slice(0, 5);
    }, [faturasValidas]);

    // =========================================================================
    // 2. AGRUPAMENTO E FILTROS DA TABELA DETALHADA
    // =========================================================================

    const faturasFiltradas = useMemo(() => {
        return faturas.filter((f) => {
            const bateStatus = filtroStatus === 'TODAS' || f.status === filtroStatus;
            const termo = busca.toLowerCase().trim();
            const bateBusca =
                !termo ||
                f.alunoNome?.toLowerCase().includes(termo) ||
                f.responsavelNome?.toLowerCase().includes(termo) ||
                f.turmaNome?.toLowerCase().includes(termo) ||
                f.txid?.toLowerCase().includes(termo) ||
                f.descricao?.toLowerCase().includes(termo);
            return bateStatus && bateBusca;
        });
    }, [faturas, filtroStatus, busca]);

    const gruposPorTurma = useMemo(() => {
        const mapa = {};
        for (const f of faturasFiltradas) {
            const chave = f.turmaNome || 'Cobranças Avulsas / Geral';
            if (!mapa[chave]) {
                mapa[chave] = {
                    nomeGrupo: chave,
                    itens: [],
                    totalEsperado: 0,
                    totalPago: 0,
                    qtdPagas: 0,
                };
            }
            mapa[chave].itens.push(f);
            mapa[chave].totalEsperado += Number(f.valorFinal || 0);
            if (f.status === 'PAGA') {
                mapa[chave].totalPago += Number(f.valorFinal || 0);
                mapa[chave].qtdPagas += 1;
            }
        }
        return Object.values(mapa);
    }, [faturasFiltradas]);

    const gruposPorAluno = useMemo(() => {
        const mapa = {};
        for (const f of faturasFiltradas) {
            const chave = f.alunoId || f.alunoNome;
            if (!mapa[chave]) {
                mapa[chave] = {
                    nomeGrupo: f.alunoNome,
                    subtitulo: `Resp: ${f.responsavelNome} • Turma: ${f.turmaNome || 'Geral'}`,
                    itens: [],
                    totalEsperado: 0,
                    totalPago: 0,
                    qtdPagas: 0,
                };
            }
            mapa[chave].itens.push(f);
            mapa[chave].totalEsperado += Number(f.valorFinal || 0);
            if (f.status === 'PAGA') {
                mapa[chave].totalPago += Number(f.valorFinal || 0);
                mapa[chave].qtdPagas += 1;
            }
        }
        return Object.values(mapa);
    }, [faturasFiltradas]);

    const alternarGrupo = (chave) => {
        setGruposExpandidos((prev) => ({ ...prev, [chave]: !prev[chave] }));
    };

    // Handlers de Conciliação Rápida
    const handleBaixaDireta = async () => {
        try {
            await faturaService.aprovarManual(faturaConciliacaoModal.id);
            showToast('Recebimento aprovado e confirmação disparada no WhatsApp!');
            setFaturaConciliacaoModal(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleSimularWebhook = async () => {
        try {
            await faturaService.simularWebhookAsaas(faturaConciliacaoModal);
            showToast(`Webhook Asaas publicado no RabbitMQ (txid: ${faturaConciliacaoModal.txid})!`);
            setFaturaConciliacaoModal(null);
            setTimeout(carregarDados, 700);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleCancelarFatura = async () => {
        try {
            await faturaService.cancelar(faturaConciliacaoModal.id);
            showToast('Fatura cancelada.');
            setFaturaConciliacaoModal(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const formatarLabelMes = (mesAno) => {
        if (!mesAno || !mesAno.includes('-')) return mesAno;
        const [ano, mes] = mesAno.split('-');
        return `${mes}/${ano}`;
    };

    const renderTabelaFaturas = (listaItens) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-y border-[#242428] table-header bg-[#111113]">
                    <th className="py-3 px-3">CÓDIGO</th>
                    <th className="py-3 px-3">ALUNO</th>
                    <th className="py-3 px-3">TIPO / DESCRIÇÃO</th>
                    <th className="py-3 px-3">VALOR BASE</th>
                    <th className="py-3 px-3">DESCONTO BOLSA</th>
                    <th className="py-3 px-3">VALOR FINAL</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-right">AÇÕES</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#222226] text-[13px]">
                {listaItens.map((f) => (
                    <tr key={f.id} className="hover:bg-[#1c1c20]/40 transition-colors">
                        <td className="py-3.5 px-3 whitespace-nowrap">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(f.txid);
                                    showToast(`Código ${f.txid} copiado!`);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0b0b0d] border border-[#26262a] hover:border-[#f5c518]/50 font-mono text-[11px] font-semibold text-[#d4d4d8] cursor-pointer"
                            >
                                <span>{resumirTxid(f.txid)}</span>
                                <Copy size={11} className="text-[#71717a]" />
                            </button>
                        </td>
                        <td className="py-3.5 px-3">
                            <div className="font-bold text-white">{f.alunoNome}</div>
                            <div className="text-[11px] text-[#8e8e96]">Resp: {f.responsavelNome}</div>
                        </td>
                        <td className="py-3.5 px-3">
                <span className="inline-block px-2 py-0.5 mr-2 rounded bg-[#221d0d] border border-[#4d3f13] text-[#f5c518] text-[10px] font-bold uppercase">
                  {f.tipoCobranca}
                </span>
                            <span className="text-[#e4e4e7] text-xs font-medium">{f.descricao}</span>
                            <div className="text-[11px] text-[#71717a] mt-0.5">
                                Vencimento: {f.dataVencimento}
                            </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#a1a1aa] text-xs whitespace-nowrap">
                            R$ {formatarMoeda(f.valorOriginal)}
                        </td>
                        <td className="py-3.5 px-3 text-[#34d399] text-xs font-semibold whitespace-nowrap">
                            - R$ {formatarMoeda(f.valorDesconto || 0)}
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-white whitespace-nowrap">
                            R$ {formatarMoeda(f.valorFinal)}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                            <StatusBadge status={f.status} />
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                                {/* Botão 1: Ver QR Code Pix */}
                                <button
                                    onClick={() => setFaturaPixModal(f)}
                                    className="px-3 py-1.5 rounded-md bg-[#f5c518] hover:brightness-105 text-[#0a0a0c] font-bold text-[11px] cursor-pointer"
                                >
                                    Ver Pix
                                </button>

                                {/* Botão 2: Consultar Recibo (Asaas/Local) ou Anexar Comprovante */}
                                <button
                                    onClick={() => setFaturaComprovanteViewModal(f)}
                                    title="Consultar Recibo Asaas ou Anexar Comprovante (WhatsApp/E-mail)"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#1c1c20] hover:bg-[#26262c] border border-[#2e2e36] text-[#e4e4e7] font-bold text-[11px] cursor-pointer"
                                >
                                    <FileText size={12} className="text-[#f5c518]" />
                                    <span>
                      {f.status === 'PAGA' || f.pagamento
                          ? 'Ver Comprovante'
                          : 'Anexar Comprovante'}
                    </span>
                                </button>

                                {/* Botão 3: Baixa Rápida / Simulação de Webhook */}
                                {f.status !== 'PAGA' && f.status !== 'CANCELADA' && (
                                    <button
                                        onClick={() => setFaturaConciliacaoModal(f)}
                                        className="px-3 py-1.5 rounded-md bg-[#222226] hover:bg-[#2c2c31] border border-[#323238] text-white font-bold text-[11px] cursor-pointer"
                                    >
                                        Confirmar Recebimento
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

    const percentualRecebido = totalEmitido > 0 ? Math.round((totalRecebido / totalEmitido) * 100) : 0;
    const raio = 52;
    const circunferencia = 2 * Math.PI * raio;
    const offsetRecebido = circunferencia - (percentualRecebido / 100) * circunferencia;

    return (
        <div className="space-y-6">
            {/* 4 KPIs DE PROJEÇÃO E DESEMPENHO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="card-panel p-5 flex flex-col justify-between h-[145px]">
                    <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              POTENCIAL MENSAL (MRR)
            </span>
                        <TrendingUp size={16} className="text-[#f5c518]" />
                    </div>
                    <p className="text-2xl font-black text-white whitespace-nowrap">
                        R$ {formatarMoeda(mrrEsperado)}
                    </p>
                    <span className="text-[11px] text-[#71717a]">
            Projeção das matrículas ativas c/ bolsas
          </span>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[145px]">
                    <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              TOTAL EMITIDO (ESPERADO)
            </span>
                        <BarChart3 size={16} className="text-blue-400" />
                    </div>
                    <p className="text-2xl font-black text-white whitespace-nowrap">
                        R$ {formatarMoeda(totalEmitido)}
                    </p>
                    <span className="text-[11px] text-[#71717a]">
            Soma de {faturasValidas.length} cobrança(s) ativa(s)
          </span>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[145px]">
                    <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              FATURAMENTO REALIZADO
            </span>
                        <CheckCircle2 size={16} className="text-[#34d399]" />
                    </div>
                    <p className="text-2xl font-black text-[#34d399] whitespace-nowrap">
                        R$ {formatarMoeda(totalRecebido)}
                    </p>
                    <span className="text-[11px] text-[#71717a]">
            {percentualRecebido}% do volume emitido já entrou em caixa
          </span>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[145px]">
                    <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              PENDÊNCIA / INADIMPLÊNCIA
            </span>
                        <AlertTriangle size={16} className="text-red-400" />
                    </div>
                    <p className="text-2xl font-black text-[#f5c518] whitespace-nowrap">
                        R$ {formatarMoeda(totalEmAberto)}
                    </p>
                    <span className="text-[11px] text-red-400 font-semibold">
            Taxa de pendência: {taxaInadimplenciaGeral}%
          </span>
                </div>
            </div>

            {/* SEÇÃO DE GRÁFICOS ANALÍTICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 card-panel p-6 flex flex-col justify-between">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242428] pb-3.5 mb-4">
                        <div>
                            <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                                <BarChart3 size={17} className="text-[#f5c518]" />
                                Faturamento Mensal: Esperado vs. Realizado
                            </h3>
                            <p className="text-[11px] text-[#8e8e96]">
                                Comparativo por competência de vencimento e meta recorrente (R$ {formatarMoeda(mrrEsperado)})
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2c2c34] border border-[#52525b]" />
                Esperado
              </span>
                            <span className="flex items-center gap-1.5 text-[#34d399] font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#34d399]" />
                Recebido
              </span>
                        </div>
                    </div>

                    {dadosFaturamentoMensal.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-end h-[190px] pt-6 px-2">
                            {dadosFaturamentoMensal.map((mes) => {
                                const alturaEsperado = Math.max(12, Math.round((mes.esperado / maiorValorMensal) * 130));
                                const alturaRecebido = Math.max(
                                    mes.recebido > 0 ? 8 : 0,
                                    Math.round((mes.recebido / maiorValorMensal) * 130)
                                );

                                return (
                                    <div key={mes.mesAno} className="flex flex-col items-center gap-2">
                                        <div className="text-[10px] font-mono text-[#a1a1aa] whitespace-nowrap">
                                            R$ {formatarMoeda(mes.recebido)}
                                        </div>
                                        <div className="w-full flex items-end justify-center gap-2 h-[135px] border-b border-[#26262a] pb-1">
                                            <div
                                                title={`Esperado: R$ ${formatarMoeda(mes.esperado)}`}
                                                style={{ height: `${alturaEsperado}px` }}
                                                className="w-5 rounded-t-md bg-[#26262e] border border-[#3f3f46] transition-all"
                                            />
                                            <div
                                                title={`Recebido: R$ ${formatarMoeda(mes.recebido)}`}
                                                style={{ height: `${alturaRecebido}px` }}
                                                className="w-5 rounded-t-md bg-[#34d399] shadow-sm shadow-[#34d399]/30 transition-all"
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-white">
                      {formatarLabelMes(mes.mesAno)}
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-[190px] flex items-center justify-center text-xs text-[#71717a]">
                            Gere cobranças para visualizar a evolução mensal de faturamento.
                        </div>
                    )}
                </div>

                <div className="lg:col-span-5 card-panel p-6 flex flex-col justify-between">
                    <div className="border-b border-[#242428] pb-3.5 mb-4">
                        <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                            <PieChart size={17} className="text-[#f5c518]" />
                            Taxa de Liquidação & Inadimplência por Aluno
                        </h3>
                        <p className="text-[11px] text-[#8e8e96]">
                            Proporção geral do caixa e alunos com maior saldo em aberto
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto">
                        <div className="sm:col-span-5 flex flex-col items-center justify-center">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r={raio}
                                        stroke="#241e09"
                                        strokeWidth="12"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r={raio}
                                        stroke="#34d399"
                                        strokeWidth="12"
                                        strokeDasharray={circunferencia}
                                        strokeDashoffset={offsetRecebido}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-black text-white">{percentualRecebido}%</span>
                                    <span className="text-[9px] uppercase font-bold text-[#34d399]">Pago</span>
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-7 space-y-2.5">
                            <span className="label-dark">MAIORES PENDÊNCIAS POR ALUNO</span>
                            {rankingInadimplenciaAlunos.length > 0 ? (
                                rankingInadimplenciaAlunos.map((al, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#0b0b0d] border border-[#242428] rounded-lg px-3 py-2 flex items-center justify-between"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="text-xs font-bold text-white truncate">{al.alunoNome}</div>
                                            <div className="text-[10px] text-[#8e8e96] truncate">
                                                {al.turma} • {al.faturasEmAberto} fatura(s)
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold text-[#f5c518] whitespace-nowrap">
                      R$ {formatarMoeda(al.pendente)}
                    </span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center text-xs text-[#34d399] bg-[#0d2818]/30 border border-[#155e3b]/50 rounded-xl">
                                    100% Adimplente! Nenhum aluno com fatura pendente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICO 3: INADIMPLÊNCIA E RECEITA POR TURMA */}
            <div className="card-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242428] pb-3.5 mb-5">
                    <div>
                        <h3 className="text-[15px] font-bold text-white">
                            Análise de Adimplência e Inadimplência por Turma
                        </h3>
                        <p className="text-[11px] text-[#8e8e96]">
                            Comparativo do volume faturado, recebido e percentual de inadimplência de cada curso
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dadosPorTurma.map((t) => (
                        <div
                            key={t.turma}
                            className="bg-[#0b0b0d] border border-[#242428] rounded-xl p-4 space-y-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-extrabold text-white">{t.turma}</span>
                                    <span className="ml-2 text-[10px] text-[#8e8e96]">
                    ({t.qtdTotal} faturas • {t.qtdPendente} em aberto)
                  </span>
                                </div>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        t.taxaInadimplencia > 0
                                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                                            : 'bg-[#0d2818] text-[#34d399] border border-[#155e3b]'
                                    }`}
                                >
                  {t.taxaInadimplencia}% Inadimplência
                </span>
                            </div>

                            <div className="w-full h-2.5 bg-[#222226] rounded-full overflow-hidden flex">
                                <div
                                    style={{ width: `${t.taxaRecebido}%` }}
                                    className="h-full bg-[#34d399] transition-all"
                                />
                                <div
                                    style={{ width: `${t.taxaInadimplencia}%` }}
                                    className="h-full bg-[#f5c518] transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#34d399] font-semibold">
                  Pago: R$ {formatarMoeda(t.pago)} ({t.taxaRecebido}%)
                </span>
                                <span className="text-[#f5c518] font-semibold">
                  Pendente: R$ {formatarMoeda(t.pendente)}
                </span>
                                <span className="text-[#a1a1aa]">
                  Total: R$ {formatarMoeda(t.total)}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RELATÓRIO DETALHADO AGRUPADO */}
            <div className="card-panel p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[15px] font-bold text-white">
                            Relatório e Histórico Detalhado de Cobranças ({faturasFiltradas.length})
                        </h3>
                        <p className="text-xs text-[#8e8e96] mt-0.5">
                            Expanda uma turma ou aluno para auditar faturas, consultar comprovantes ou confirmar recebimentos
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#0b0b0d] p-1 rounded-xl border border-[#242428]">
                        {[
                            { id: 'POR_TURMA', label: 'Por Turma', icon: BookOpen },
                            { id: 'POR_ALUNO', label: 'Por Aluno', icon: GraduationCap },
                            { id: 'LISTA', label: 'Lista Geral', icon: List },
                        ].map((modo) => {
                            const Icon = modo.icon;
                            return (
                                <button
                                    key={modo.id}
                                    onClick={() => setModoRelatorio(modo.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        modoRelatorio === modo.id
                                            ? 'bg-[#f5c518] text-[#0a0a0c]'
                                            : 'text-[#8e8e96] hover:text-white'
                                    }`}
                                >
                                    <Icon size={13} />
                                    <span>{modo.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#242428]">
                    <div className="relative w-72">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                        <input
                            type="text"
                            placeholder="Buscar turma, aluno, descrição ou código..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="input-dark !pl-8 !py-1.5 !text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#0b0b0d] p-1 rounded-xl border border-[#242428]">
                        {[
                            { id: 'TODAS', label: 'Todas' },
                            { id: 'PENDENTE', label: 'Pendentes' },
                            { id: 'EM_ANALISE_MANUAL', label: 'Em Análise' },
                            { id: 'PAGA', label: 'Pagas' },
                        ].map((st) => (
                            <button
                                key={st.id}
                                onClick={() => setFiltroStatus(st.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                    filtroStatus === st.id
                                        ? 'bg-[#26262a] text-[#f5c518]'
                                        : 'text-[#8e8e96] hover:text-white'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                {modoRelatorio === 'POR_TURMA' && (
                    <div className="space-y-3">
                        {gruposPorTurma.map((grupo) => {
                            const aberto = gruposExpandidos[grupo.nomeGrupo] ?? true;
                            const percAdimplencia =
                                grupo.itens.length > 0
                                    ? Math.round((grupo.qtdPagas / grupo.itens.length) * 100)
                                    : 0;

                            return (
                                <div
                                    key={grupo.nomeGrupo}
                                    className="bg-[#0b0b0d] border border-[#242428] rounded-xl overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => alternarGrupo(grupo.nomeGrupo)}
                                        className="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#141416] transition cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {aberto ? (
                                                <ChevronDown size={18} className="text-[#f5c518]" />
                                            ) : (
                                                <ChevronRight size={18} className="text-[#8e8e96]" />
                                            )}
                                            <div>
                                                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                                                    <span>{grupo.nomeGrupo}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-[#241e09] border border-[#5c4a11] text-[#f5c518] text-[10px]">
                            {grupo.itens.length} cobrança(s)
                          </span>
                                                </div>
                                                <div className="text-[11px] text-[#8e8e96] mt-0.5">
                                                    {grupo.qtdPagas} de {grupo.itens.length} faturas pagas ({percAdimplencia}% concluído)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                        <span className="text-[10px] uppercase text-[#8e8e96] block">
                          Recebido / Total da Turma
                        </span>
                                                <span className="text-xs font-extrabold text-[#34d399]">
                          R$ {formatarMoeda(grupo.totalPago)}
                        </span>
                                                <span className="text-xs text-[#71717a]">
                          {' '}
                                                    / R$ {formatarMoeda(grupo.totalEsperado)}
                        </span>
                                            </div>
                                            <div className="w-24 h-2 bg-[#222226] rounded-full overflow-hidden hidden sm:block">
                                                <div
                                                    className="h-full bg-[#f5c518]"
                                                    style={{ width: `${percAdimplencia}%` }}
                                                />
                                            </div>
                                        </div>
                                    </button>

                                    {aberto && (
                                        <div className="border-t border-[#242428]">
                                            {renderTabelaFaturas(grupo.itens)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {modoRelatorio === 'POR_ALUNO' && (
                    <div className="space-y-3">
                        {gruposPorAluno.map((grupo) => {
                            const aberto = gruposExpandidos[grupo.nomeGrupo] ?? false;
                            const pendenteAluno = grupo.totalEsperado - grupo.totalPago;

                            return (
                                <div
                                    key={grupo.nomeGrupo}
                                    className="bg-[#0b0b0d] border border-[#242428] rounded-xl overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => alternarGrupo(grupo.nomeGrupo)}
                                        className="w-full px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#141416] transition cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {aberto ? (
                                                <ChevronDown size={18} className="text-[#f5c518]" />
                                            ) : (
                                                <ChevronRight size={18} className="text-[#8e8e96]" />
                                            )}
                                            <div>
                                                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                                                    <span>{grupo.nomeGrupo}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-[#1c1c20] border border-[#2e2e36] text-[#d4d4d8] text-[10px]">
                            {grupo.itens.length} fatura(s)
                          </span>
                                                </div>
                                                <div className="text-[11px] text-[#8e8e96] mt-0.5">{grupo.subtitulo}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase text-[#8e8e96] block">Pago</span>
                                                <span className="text-xs font-bold text-[#34d399]">
                          R$ {formatarMoeda(grupo.totalPago)}
                        </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase text-[#8e8e96] block">Em Aberto</span>
                                                <span className="text-xs font-bold text-[#f5c518]">
                          R$ {formatarMoeda(pendenteAluno)}
                        </span>
                                            </div>
                                        </div>
                                    </button>

                                    {aberto && (
                                        <div className="border-t border-[#242428]">
                                            {renderTabelaFaturas(grupo.itens)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {modoRelatorio === 'LISTA' && renderTabelaFaturas(faturasFiltradas)}
            </div>

            {/* Modal 1: Exibir QR Code Pix */}
            <PixQrModal
                fatura={faturaPixModal}
                aoFechar={() => setFaturaPixModal(null)}
            />

            {/* Modal 2: Consultar Recibo (Asaas/Local) ou Fazer Upload de Comprovante */}
            <ComprovanteModal
                fatura={faturaComprovanteViewModal}
                aoFechar={() => setFaturaComprovanteViewModal(null)}
                aoAtualizar={carregarDados}
            />

            {/* Modal 3: Confirmação Rápida de Recebimento (Secretaria / Simulação Webhook) */}
            <Modal
                aberto={Boolean(faturaConciliacaoModal)}
                aoFechar={() => setFaturaConciliacaoModal(null)}
                titulo="Confirmar Recebimento Rápido"
                subtitulo={
                    faturaConciliacaoModal
                        ? `${faturaConciliacaoModal.alunoNome} • R$ ${formatarMoeda(faturaConciliacaoModal.valorFinal)}`
                        : ''
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleBaixaDireta}
                            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-[#0d2818] hover:bg-[#133923] border border-[#155e3b] text-[#34d399] text-xs font-bold cursor-pointer"
                        >
                            <CheckCircle2 size={15} /> Baixa na Secretaria
                        </button>
                        <button
                            type="button"
                            onClick={handleSimularWebhook}
                            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/50 text-purple-300 text-xs font-bold cursor-pointer"
                        >
                            <Zap size={15} /> Simular Webhook Pix
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            const faturaAtual = faturaConciliacaoModal;
                            setFaturaConciliacaoModal(null);
                            setFaturaComprovanteViewModal(faturaAtual);
                        }}
                        className="btn-outline-yellow w-full flex items-center justify-center gap-2 !py-2.5"
                    >
                        <FileText size={15} />
                        <span>Anexar Arquivo de Comprovante (WhatsApp / E-mail)</span>
                    </button>

                    <div className="border-t border-[#242428] pt-3 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleCancelarFatura}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:underline cursor-pointer"
                        >
                            <XCircle size={14} /> Cancelar esta fatura
                        </button>
                        <button
                            type="button"
                            onClick={() => setFaturaConciliacaoModal(null)}
                            className="text-xs text-[#8e8e96] hover:text-white cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}