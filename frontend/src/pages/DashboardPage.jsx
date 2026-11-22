import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { faturaService } from '../services/faturaService';
import { alunoService } from '../services/alunoService';
import { turmaService } from '../services/turmaService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PixQrModal } from '../components/ui/PixQrModal';
import { ComprovanteModal } from '../components/ui/ComprovanteModal';
import { formatarMoeda, resumirTxid } from '../utils/formatters';
import {
    DollarSign,
    Clock,
    CheckCircle2,
    GraduationCap,
    QrCode,
    FileText,
    Copy
} from 'lucide-react';

export function DashboardPage() {
    const { showToast } = useToast();
    const [faturas, setFaturas] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);

    // Estados dos 2 Modais (QR Code Pix e Comprovante/Recibo)
    const [faturaPixSelecionada, setFaturaPixSelecionada] = useState(null);
    const [faturaComprovanteSelecionada, setFaturaComprovanteSelecionada] = useState(null);

    const carregarDados = async () => {
        try {
            const [resFaturas, resAlunos, resTurmas] = await Promise.all([
                faturaService.listarTodas(),
                alunoService.listarTodos(),
                turmaService.listarTodas(),
            ]);
            setFaturas(resFaturas);
            setAlunos(resAlunos);
            setTurmas(resTurmas);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const faturasPagas = faturas.filter((f) => f.status === 'PAGA');
    const faturasPendentes = faturas.filter(
        (f) => f.status === 'PENDENTE' || f.status === 'EM_ANALISE_MANUAL'
    );

    const totalRecebido = faturasPagas.reduce((acc, f) => acc + Number(f.valorFinal), 0);
    const totalPendente = faturasPendentes.reduce((acc, f) => acc + Number(f.valorFinal), 0);

    const taxaAdimplencia =
        faturas.length > 0 ? Math.round((faturasPagas.length / faturas.length) * 100) : 0;

    const copiarTxid = (txid) => {
        navigator.clipboard.writeText(txid);
        showToast(`Identificador ${txid} copiado!`);
    };

    return (
        <div className="space-y-6">
            {/* 4 Cards Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="card-panel p-5 flex flex-col justify-between h-[165px]">
                    <div className="w-9 h-9 rounded-lg bg-[#221d0d] border border-[#4d3f13] text-[#f5c518] flex items-center justify-center">
                        <DollarSign size={18} />
                    </div>
                    <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              TOTAL RECEBIDO (PIX)
            </span>
                        <p className="text-2xl font-black text-white mt-0.5 whitespace-nowrap">
                            R$ {formatarMoeda(totalRecebido)}
                        </p>
                    </div>
                    <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0d2818] text-[#34d399] border border-[#155e3b]">
              Baixa automática
            </span>
                    </div>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[165px]">
                    <div className="w-9 h-9 rounded-lg bg-[#221d0d] border border-[#4d3f13] text-[#f5c518] flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                    <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              AGUARDANDO PAGAMENTO
            </span>
                        <p className="text-2xl font-black text-[#f5c518] mt-0.5 whitespace-nowrap">
                            R$ {formatarMoeda(totalPendente)}
                        </p>
                    </div>
                    <span className="text-[11px] text-[#71717a]">
            {faturasPendentes.length} fatura(s) pendente(s)
          </span>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[165px]">
                    <div className="w-9 h-9 rounded-lg bg-[#221d0d] border border-[#4d3f13] text-[#f5c518] flex items-center justify-center">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              TAXA DE ADIMPLÊNCIA
            </span>
                        <p className="text-2xl font-black text-white mt-0.5">{taxaAdimplencia}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-[#26262a] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#f5c518] rounded-full transition-all duration-300"
                            style={{ width: `${taxaAdimplencia}%` }}
                        />
                    </div>
                </div>

                <div className="card-panel p-5 flex flex-col justify-between h-[165px]">
                    <div className="w-9 h-9 rounded-lg bg-[#221d0d] border border-[#4d3f13] text-[#f5c518] flex items-center justify-center">
                        <GraduationCap size={18} />
                    </div>
                    <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8e96]">
              ALUNOS ATIVOS
            </span>
                        <p className="text-2xl font-black text-white mt-0.5">
                            {alunos.filter((a) => a.ativo !== false).length}
                        </p>
                    </div>
                    <span className="text-[11px] text-[#71717a]">
            Distribuídos em {turmas.length} turma(s)
          </span>
                </div>
            </div>

            {/* Tabela: Últimas Cobranças Emitidas */}
            <div className="card-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[15px] font-bold text-white">Últimas Cobranças Emitidas</h2>
                        <p className="text-[11px] text-[#8e8e96] mt-0.5">
                            Acompanhamento rápido de mensalidades, QR Code Pix e comprovantes
                        </p>
                    </div>
                    <Link
                        to="/relatorios"
                        className="text-xs font-bold text-[#f5c518] hover:underline"
                    >
                        Ver relatório completo →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-y border-[#242428] table-header">
                            <th className="py-3.5 px-3">IDENTIFICADOR</th>
                            <th className="py-3.5 px-3">ALUNO / RESPONSÁVEL</th>
                            <th className="py-3.5 px-3">DESCRIÇÃO</th>
                            <th className="py-3.5 px-3">VENCIMENTO</th>
                            <th className="py-3.5 px-3">VALOR FINAL</th>
                            <th className="py-3.5 px-3">STATUS</th>
                            <th className="py-3.5 px-3 text-right">AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222226] text-[13px]">
                        {faturas.slice(0, 8).map((f) => (
                            <tr key={f.id} className="hover:bg-[#1c1c20]/50 transition-colors">
                                <td className="py-4 px-3 whitespace-nowrap">
                                    <button
                                        onClick={() => copiarTxid(f.txid)}
                                        title={`Clique para copiar: ${f.txid}`}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0b0b0d] border border-[#26262a] hover:border-[#f5c518]/50 font-mono text-[11px] font-semibold text-[#d4d4d8] cursor-pointer"
                                    >
                                        <span>{resumirTxid(f.txid)}</span>
                                        <Copy size={11} className="text-[#71717a]" />
                                    </button>
                                </td>
                                <td className="py-4 px-3">
                                    <div className="font-bold text-white">{f.alunoNome}</div>
                                    <div className="text-[11px] text-[#8e8e96]">{f.responsavelNome}</div>
                                </td>
                                <td className="py-4 px-3">
                    <span className="inline-block px-2 py-0.5 mr-2 rounded bg-[#242428] text-[10px] font-bold uppercase text-[#e4e4e7]">
                      {f.tipoCobranca}
                    </span>
                                    <span className="text-[#e4e4e7]">{f.descricao}</span>
                                </td>
                                <td className="py-4 px-3 text-[#a1a1aa] text-xs whitespace-nowrap">
                                    {f.dataVencimento}
                                </td>
                                <td className="py-4 px-3 font-extrabold text-white whitespace-nowrap">
                                    R$ {formatarMoeda(f.valorFinal)}
                                </td>
                                <td className="py-4 px-3 whitespace-nowrap">
                                    <StatusBadge status={f.status} comIcone />
                                </td>
                                <td className="py-4 px-3 text-right whitespace-nowrap space-x-2">
                                    <button
                                        onClick={() => setFaturaPixSelecionada(f)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c31] border border-[#323238] text-white text-[11px] font-bold cursor-pointer"
                                    >
                                        <QrCode size={13} className="text-[#f5c518]" />
                                        <span>QR Code Pix</span>
                                    </button>

                                    <button
                                        onClick={() => setFaturaComprovanteSelecionada(f)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#26262c] border border-[#2e2e36] text-[#e4e4e7] text-[11px] font-bold cursor-pointer"
                                    >
                                        <FileText size={13} className="text-[#f5c518]" />
                                        <span>
                        {f.status === 'PAGA' || f.pagamento ? 'Ver Comprovante' : 'Comprovante'}
                      </span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {faturas.length === 0 && (
                            <tr>
                                <td colSpan="7" className="py-8 text-center text-[#71717a] text-xs">
                                    Nenhuma cobrança registrada até o momento.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal 1: Exibir QR Code Pix */}
            <PixQrModal
                fatura={faturaPixSelecionada}
                aoFechar={() => setFaturaPixSelecionada(null)}
            />

            {/* Modal 2: Consultar Recibo ou Anexar Comprovante Local */}
            <ComprovanteModal
                fatura={faturaComprovanteSelecionada}
                aoFechar={() => setFaturaComprovanteSelecionada(null)}
                aoAtualizar={carregarDados}
            />
        </div>
    );
}