import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { faturaService } from '../services/faturaService';
import { turmaService } from '../services/turmaService';
import { alunoService } from '../services/alunoService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PixQrModal } from '../components/ui/PixQrModal';
import { TurmaAutocomplete } from '../components/ui/TurmaAutocomplete';
import { AlunoAutocomplete } from '../components/ui/AlunoAutocomplete';
import {
    formatarMoeda,
    formatarWhatsapp,
    calcularDataVencimento
} from '../utils/formatters';
import {
    DollarSign,
    Zap,
    Users,
    User,
    BarChart3,
    ArrowRight,
    QrCode,
    CheckCircle2,
    Loader2,
    Send
} from 'lucide-react';

export function FaturasPage() {
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [turmas, setTurmas] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [processando, setProcessando] = useState(false);
    const [ultimasEmitidas, setUltimasEmitidas] = useState([]);
    const [faturaPixModal, setFaturaPixModal] = useState(null);

    // Alterna entre 'MENSALIDADE' e 'EVENTUAL' para não poluir a tela com 2 forms simultâneos
    const [tipoOperacao, setTipoOperacao] = useState('MENSALIDADE');

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const [escopoMensalidade, setEscopoMensalidade] = useState('TURMA');
    const [formMensalidade, setFormMensalidade] = useState({
        turmaId: location.state?.turmaId ? String(location.state.turmaId) : '',
        alunoId: '',
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
        dataVencimento: calcularDataVencimento(anoAtual, mesAtual, 10),
    });

    const [escopoEventual, setEscopoEventual] = useState('ALUNO');
    const [formEventual, setFormEventual] = useState({
        descricao: '',
        tipoCobranca: 'APOSTILA',
        valor: '',
        turmaId: '',
        alunoId: '',
        dataVencimento: calcularDataVencimento(anoAtual, mesAtual, 20),
    });

    useEffect(() => {
        Promise.all([turmaService.listarTodas(), alunoService.listarTodos()])
            .then(([listaTurmas, listaAlunos]) => {
                setTurmas(listaTurmas);
                setAlunos(listaAlunos);
            })
            .catch((err) => showToast(extrairMensagemErro(err), 'erro'));
    }, []);

    const atualizarMensalidade = (novo) => {
        const atualizado = { ...formMensalidade, ...novo };
        const turmaObj = turmas.find((t) => String(t.id) === String(atualizado.turmaId));
        if (
            turmaObj &&
            (novo.turmaId !== undefined ||
                novo.mesReferencia !== undefined ||
                novo.anoReferencia !== undefined)
        ) {
            atualizado.dataVencimento = calcularDataVencimento(
                atualizado.anoReferencia,
                atualizado.mesReferencia,
                turmaObj.diaVencimentoPadrao
            );
        }
        setFormMensalidade(atualizado);
    };

    const turmaMensalidadeObj = useMemo(
        () => turmas.find((t) => String(t.id) === String(formMensalidade.turmaId)),
        [turmas, formMensalidade.turmaId]
    );

    // Filtra todos os alunos ativos matriculados na turma selecionada (por ID ou Nome)
    const alunosDaTurmaMensalidade = useMemo(() => {
        if (!turmaMensalidadeObj) return [];
        return alunos
            .filter((a) => a.ativo !== false)
            .filter((a) => {
                const temEmMatriculas = a.matriculasAtivas?.some(
                    (m) => String(m.turmaId) === String(turmaMensalidadeObj.id)
                );
                const temEmNomes = a.turmas?.includes(turmaMensalidadeObj.nome);
                return temEmMatriculas || temEmNomes;
            });
    }, [alunos, turmaMensalidadeObj]);

    // Lista em Tempo Real dos Alunos que receberão a cobrança (Preview Direita)
    const destinatariosPreview = useMemo(() => {
        if (tipoOperacao === 'MENSALIDADE') {
            if (!turmaMensalidadeObj) return [];
            const base = Number(turmaMensalidadeObj.valorMensalidadePadrao || 0);
            const lista =
                escopoMensalidade === 'ALUNO' && formMensalidade.alunoId
                    ? alunosDaTurmaMensalidade.filter(
                        (a) => String(a.id) === String(formMensalidade.alunoId)
                    )
                    : alunosDaTurmaMensalidade;

            return lista.map((aluno) => {
                const mat = aluno.matriculasAtivas?.find(
                    (m) =>
                        String(m.turmaId) === String(turmaMensalidadeObj.id) ||
                        m.turmaNome === turmaMensalidadeObj.nome
                );
                const bolsa = Number(mat?.porcentagemBolsa || 0);
                const desconto = (base * bolsa) / 100;
                const valorFinal = Math.max(0, base - desconto);
                return {
                    id: aluno.id,
                    nome: aluno.nome,
                    ra: aluno.matriculaCodigo,
                    responsavel: aluno.responsavelPrincipalNome,
                    whatsapp: aluno.responsavelPrincipalWhatsapp,
                    bolsa,
                    valorBase: base,
                    valorFinal,
                };
            });
        } else {
            // Preview para Cobrança Eventual
            const valorAvulso = Number(formEventual.valor || 0);
            let lista = [];
            if (escopoEventual === 'ALUNO' && formEventual.alunoId) {
                lista = alunos.filter((a) => String(a.id) === String(formEventual.alunoId));
            } else if (escopoEventual === 'TURMA' && formEventual.turmaId) {
                const tObj = turmas.find((t) => String(t.id) === String(formEventual.turmaId));
                if (tObj) {
                    lista = alunos
                        .filter((a) => a.ativo !== false)
                        .filter(
                            (a) =>
                                a.matriculasAtivas?.some((m) => String(m.turmaId) === String(tObj.id)) ||
                                a.turmas?.includes(tObj.nome)
                        );
                }
            }
            return lista.map((aluno) => ({
                id: aluno.id,
                nome: aluno.nome,
                ra: aluno.matriculaCodigo,
                responsavel: aluno.responsavelPrincipalNome,
                whatsapp: aluno.responsavelPrincipalWhatsapp,
                bolsa: 0,
                valorBase: valorAvulso,
                valorFinal: valorAvulso,
            }));
        }
    }, [
        tipoOperacao,
        turmaMensalidadeObj,
        escopoMensalidade,
        formMensalidade.alunoId,
        alunosDaTurmaMensalidade,
        escopoEventual,
        formEventual.alunoId,
        formEventual.turmaId,
        formEventual.valor,
        alunos,
        turmas,
    ]);

    const totalPrevistoLote = destinatariosPreview.reduce(
        (acc, item) => acc + item.valorFinal,
        0
    );

    const handleGerarMensalidades = async (e) => {
        e.preventDefault();
        if (!formMensalidade.turmaId) {
            showToast('Selecione uma turma primeiro.', 'erro');
            return;
        }
        if (escopoMensalidade === 'ALUNO' && !formMensalidade.alunoId) {
            showToast('Selecione o aluno para gerar a mensalidade.', 'erro');
            return;
        }

        setProcessando(true);
        try {
            const criadas = await faturaService.gerarMensalidades({
                turmaId: Number(formMensalidade.turmaId),
                alunoId: escopoMensalidade === 'ALUNO' ? Number(formMensalidade.alunoId) : null,
                mesReferencia: Number(formMensalidade.mesReferencia),
                anoReferencia: Number(formMensalidade.anoReferencia),
                dataVencimento: formMensalidade.dataVencimento,
            });
            setUltimasEmitidas(criadas);
            showToast(
                `${criadas.length} cobrança(s) gerada(s) no Asaas e disparada(s) para o WhatsApp!`
            );
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        } finally {
            setProcessando(false);
        }
    };

    const handleGerarEventual = async (e) => {
        e.preventDefault();
        if (escopoEventual === 'ALUNO' && !formEventual.alunoId) {
            showToast('Selecione o aluno que receberá a cobrança.', 'erro');
            return;
        }
        if (escopoEventual === 'TURMA' && !formEventual.turmaId) {
            showToast('Selecione a turma alvo da cobrança.', 'erro');
            return;
        }

        setProcessando(true);
        try {
            const payload = {
                descricao: formEventual.descricao,
                tipoCobranca: formEventual.tipoCobranca,
                valor: Number(formEventual.valor),
                dataVencimento: formEventual.dataVencimento,
                turmaId: escopoEventual === 'TURMA' ? Number(formEventual.turmaId) : null,
                alunoIds: escopoEventual === 'ALUNO' ? [Number(formEventual.alunoId)] : null,
            };

            const criadas = await faturaService.gerarEventuais(payload);
            setUltimasEmitidas(criadas);
            showToast(
                `${criadas.length} cobrança(s) avulsa(s) emitida(s) e enviada(s) via WhatsApp!`
            );
            setFormEventual({ ...formEventual, descricao: '', valor: '' });
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        } finally {
            setProcessando(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Topo com Seletor de Operação (Mensalidades vs Eventual) + Atalho para Relatórios */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-[#141416] p-1.5 rounded-xl border border-[#242428]">
                    <button
                        type="button"
                        onClick={() => setTipoOperacao('MENSALIDADE')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                            tipoOperacao === 'MENSALIDADE'
                                ? 'bg-[#f5c518] text-[#0a0a0c] shadow-sm'
                                : 'text-[#8e8e96] hover:text-white'
                        }`}
                    >
                        <DollarSign size={15} />
                        <span>Mensalidades Escolares</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setTipoOperacao('EVENTUAL')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                            tipoOperacao === 'EVENTUAL'
                                ? 'bg-[#f5c518] text-[#0a0a0c] shadow-sm'
                                : 'text-[#8e8e96] hover:text-white'
                        }`}
                    >
                        <Zap size={15} />
                        <span>Cobrança Eventual (Apostila / Taxa / Evento)</span>
                    </button>
                </div>

                <button
                    onClick={() => navigate('/relatorios')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141416] hover:bg-[#1c1c20] border border-[#242428] text-xs font-bold text-[#f5c518] cursor-pointer transition"
                >
                    <BarChart3 size={15} />
                    <span>Ver Relatórios & Histórico Completo</span>
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* Grid Principal: Coluna Esquerda (Configuração) + Coluna Direita (Prévia dos Alunos que serão cobrados) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* COLUNA ESQUERDA (5 Colunas): Formulário Limpo */}
                <div className="lg:col-span-5 card-panel p-6">
                    {tipoOperacao === 'MENSALIDADE' ? (
                        <form onSubmit={handleGerarMensalidades} className="space-y-5">
                            <div className="flex items-center justify-between border-b border-[#242428] pb-4">
                                <div>
                                    <h2 className="text-[15px] font-bold text-white">
                                        Configurar Mensalidade
                                    </h2>
                                    <p className="text-[11px] text-[#8e8e96] mt-0.5">
                                        Escolha a turma inteira ou filtre um único aluno
                                    </p>
                                </div>

                                <div className="flex items-center bg-[#0b0b0d] p-1 rounded-lg border border-[#26262a]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEscopoMensalidade('TURMA');
                                            atualizarMensalidade({ alunoId: '' });
                                        }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                                            escopoMensalidade === 'TURMA'
                                                ? 'bg-[#f5c518] text-[#0a0a0c]'
                                                : 'text-[#8e8e96] hover:text-white'
                                        }`}
                                    >
                                        <Users size={12} /> Turma
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEscopoMensalidade('ALUNO')}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                                            escopoMensalidade === 'ALUNO'
                                                ? 'bg-[#f5c518] text-[#0a0a0c]'
                                                : 'text-[#8e8e96] hover:text-white'
                                        }`}
                                    >
                                        <User size={12} /> 1 Aluno
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label-dark">SELECIONAR TURMA *</label>
                                    <TurmaAutocomplete
                                        turmas={turmas}
                                        selecionadaId={formMensalidade.turmaId}
                                        aoSelecionar={(id) => atualizarMensalidade({ turmaId: id, alunoId: '' })}
                                    />
                                </div>

                                {escopoMensalidade === 'ALUNO' && (
                                    <div>
                                        <label className="label-dark">SELECIONAR ALUNO DA TURMA *</label>
                                        <AlunoAutocomplete
                                            alunos={alunosDaTurmaMensalidade}
                                            selecionadoId={formMensalidade.alunoId}
                                            aoSelecionar={(id) => atualizarMensalidade({ alunoId: id })}
                                            placeholder="Digite o nome ou RA do aluno..."
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-dark">MÊS DE REFERÊNCIA</label>
                                        <input
                                            type="number" min="1" max="12" required
                                            value={formMensalidade.mesReferencia}
                                            onChange={(e) => atualizarMensalidade({ mesReferencia: e.target.value })}
                                            className="input-dark"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-dark">ANO DE REFERÊNCIA</label>
                                        <input
                                            type="number" required
                                            value={formMensalidade.anoReferencia}
                                            onChange={(e) => atualizarMensalidade({ anoReferencia: e.target.value })}
                                            className="input-dark"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label-dark">DATA DE VENCIMENTO *</label>
                                    <input
                                        type="date" required
                                        value={formMensalidade.dataVencimento}
                                        onChange={(e) => atualizarMensalidade({ dataVencimento: e.target.value })}
                                        className="input-dark"
                                    />
                                </div>
                            </div>

                            {/* Botão com texto 100% fixo (sem mudar frase ao clicar) */}
                            <button
                                type="submit"
                                disabled={processando || destinatariosPreview.length === 0}
                                className="btn-yellow w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processando ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={15} />
                                )}
                                <span>Emitir Cobranças Pix</span>
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleGerarEventual} className="space-y-5">
                            <div className="flex items-center justify-between border-b border-[#242428] pb-4">
                                <div>
                                    <h2 className="text-[15px] font-bold text-white">
                                        Configurar Taxa / Eventual
                                    </h2>
                                    <p className="text-[11px] text-[#8e8e96] mt-0.5">
                                        Apostilas, simulados, matrículas ou eventos
                                    </p>
                                </div>

                                <div className="flex items-center bg-[#0b0b0d] p-1 rounded-lg border border-[#26262a]">
                                    <button
                                        type="button"
                                        onClick={() => setEscopoEventual('ALUNO')}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                                            escopoEventual === 'ALUNO'
                                                ? 'bg-[#f5c518] text-[#0a0a0c]'
                                                : 'text-[#8e8e96] hover:text-white'
                                        }`}
                                    >
                                        <User size={12} /> 1 Aluno
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEscopoEventual('TURMA')}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                                            escopoEventual === 'TURMA'
                                                ? 'bg-[#f5c518] text-[#0a0a0c]'
                                                : 'text-[#8e8e96] hover:text-white'
                                        }`}
                                    >
                                        <Users size={12} /> Turma
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label-dark">DESCRIÇÃO DA COBRANÇA *</label>
                                    <input
                                        type="text" required placeholder="Ex: Material Didático 2º Semestre"
                                        value={formEventual.descricao}
                                        onChange={(e) => setFormEventual({ ...formEventual, descricao: e.target.value })}
                                        className="input-dark"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label-dark">CATEGORIA *</label>
                                        <select
                                            value={formEventual.tipoCobranca}
                                            onChange={(e) => setFormEventual({ ...formEventual, tipoCobranca: e.target.value })}
                                            className="input-dark"
                                        >
                                            {['APOSTILA', 'SIMULADO', 'REVISAO', 'EVENTO', 'OUTROS'].map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-dark">VALOR (R$) *</label>
                                        <input
                                            type="number" step="0.01" required placeholder="150.00"
                                            value={formEventual.valor}
                                            onChange={(e) => setFormEventual({ ...formEventual, valor: e.target.value })}
                                            className="input-dark"
                                        />
                                    </div>
                                </div>

                                <div>
                                    {escopoEventual === 'ALUNO' ? (
                                        <>
                                            <label className="label-dark">BUSCAR ALUNO (NOME OU RA) *</label>
                                            <AlunoAutocomplete
                                                alunos={alunos}
                                                selecionadoId={formEventual.alunoId}
                                                aoSelecionar={(id) => setFormEventual({ ...formEventual, alunoId: id })}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label className="label-dark">BUSCAR TURMA ALVO *</label>
                                            <TurmaAutocomplete
                                                turmas={turmas}
                                                selecionadaId={formEventual.turmaId}
                                                aoSelecionar={(id) => setFormEventual({ ...formEventual, turmaId: id })}
                                            />
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label className="label-dark">DATA DE VENCIMENTO *</label>
                                    <input
                                        type="date" required
                                        value={formEventual.dataVencimento}
                                        onChange={(e) => setFormEventual({ ...formEventual, dataVencimento: e.target.value })}
                                        className="input-dark"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processando || destinatariosPreview.length === 0}
                                className="btn-yellow w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processando ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={15} />
                                )}
                                <span>Emitir Cobranças Pix</span>
                            </button>
                        </form>
                    )}
                </div>

                {/* COLUNA DIREITA (7 Colunas): Prévia em Tempo Real dos Alunos que Receberão a Cobrança */}
                <div className="lg:col-span-7 card-panel p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242428] pb-4">
                        <div>
                            <h3 className="text-[15px] font-bold text-white">
                                Prévia de Destinatários ({destinatariosPreview.length} aluno(s))
                            </h3>
                            <p className="text-[11px] text-[#8e8e96] mt-0.5">
                                Confira abaixo todos os alunos que receberão o QR Code Pix e a mensagem no WhatsApp
                            </p>
                        </div>

                        <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#8e8e96] block">
                Total Previsto do Disparo
              </span>
                            <span className="text-lg font-black text-[#f5c518]">
                R$ {formatarMoeda(totalPrevistoLote)}
              </span>
                        </div>
                    </div>

                    {destinatariosPreview.length > 0 ? (
                        <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="border-b border-[#242428] table-header">
                                    <th className="py-2.5 px-2">ALUNO / RA</th>
                                    <th className="py-2.5 px-2">RESPONSÁVEL (WHATSAPP)</th>
                                    <th className="py-2.5 px-2">BOLSA</th>
                                    <th className="py-2.5 px-2 text-right">VALOR A COBRAR</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-[#222226] text-xs">
                                {destinatariosPreview.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#1c1c20]/40">
                                        <td className="py-3 px-2">
                                            <div className="font-bold text-white">{item.nome}</div>
                                            <div className="font-mono text-[10px] text-[#f5c518]">{item.ra}</div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="text-[#e4e4e7] font-medium">{item.responsavel}</div>
                                            <div className="font-mono text-[10px] text-[#34d399]">
                                                {formatarWhatsapp(item.whatsapp)}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            {item.bolsa > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-[#0d2818] text-[#34d399] font-mono text-[10px] font-bold">
                            -{item.bolsa}%
                          </span>
                                            ) : (
                                                <span className="text-[#71717a]">0%</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-2 text-right font-extrabold text-white whitespace-nowrap">
                                            R$ {formatarMoeda(item.valorFinal)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center text-xs text-[#71717a] bg-[#0b0b0d] rounded-xl border border-[#222226]">
                            Selecione uma turma ou aluno ao lado para visualizar a lista de destinatários e valores antes de emitir.
                        </div>
                    )}

                    {/* Lista das Faturas Recém-Geradas após clicar no botão */}
                    {ultimasEmitidas.length > 0 && (
                        <div className="border-t border-[#242428] pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#34d399] flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                    {ultimasEmitidas.length} cobrança(s) gerada(s) com sucesso agora:
                </span>
                                <button
                                    onClick={() => navigate('/relatorios')}
                                    className="text-xs font-bold text-[#f5c518] hover:underline cursor-pointer"
                                >
                                    Abrir em Relatórios →
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {ultimasEmitidas.map((f) => (
                                    <div
                                        key={f.id}
                                        className="bg-[#0b0b0d] border border-[#155e3b] rounded-xl p-3 flex items-center justify-between"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="text-xs font-bold text-white truncate">{f.alunoNome}</div>
                                            <div className="text-[11px] text-[#34d399] font-bold">
                                                R$ {formatarMoeda(f.valorFinal)} • Enviado WhatsApp
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFaturaPixModal(f)}
                                            className="px-2.5 py-1.5 rounded-lg bg-[#f5c518] text-[#0a0a0c] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                            <QrCode size={13} /> Pix
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PixQrModal fatura={faturaPixModal} aoFechar={() => setFaturaPixModal(null)} />
        </div>
    );
}