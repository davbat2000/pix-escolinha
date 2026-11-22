import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alunoService } from '../services/alunoService';
import { turmaService } from '../services/turmaService';
import { responsavelService } from '../services/responsavelService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ResponsavelAutocomplete } from '../components/ui/ResponsavelAutocomplete';
import { TurmaAutocomplete } from '../components/ui/TurmaAutocomplete';
import { formatarWhatsapp } from '../utils/formatters';
import {
    Search,
    UserPlus,
    Pencil,
    Plus,
    Filter,
    X,
    Power,
    AlertTriangle,
    Percent
} from 'lucide-react';

export function AlunosPage() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [alunos, setAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [responsaveis, setResponsaveis] = useState([]);

    // Filtros
    const [busca, setBusca] = useState('');
    const [turmaFiltro, setTurmaFiltro] = useState('TODAS');
    const [statusFiltro, setStatusFiltro] = useState('TODOS');

    // Modais
    const [alunoModalMatricula, setAlunoModalMatricula] = useState(null);
    const [alunoModalEdicao, setAlunoModalEdicao] = useState(null);
    const [confirmacaoDesmatricula, setConfirmacaoDesmatricula] = useState(null);
    const [confirmacaoStatusAluno, setConfirmacaoStatusAluno] = useState(null);
    const [modalBolsa, setModalBolsa] = useState(null);

    const [formNovaMatricula, setFormNovaMatricula] = useState({
        turmaId: '',
        porcentagemBolsa: 0,
    });

    const [formEdicao, setFormEdicao] = useState({
        nome: '',
        ativo: true,
        responsavelId: '',
        parentesco: 'PAI',
    });

    const carregarDados = async () => {
        try {
            const [listaAlunos, listaTurmas, listaResponsaveis] = await Promise.all([
                alunoService.listarTodos(),
                turmaService.listarTodas(),
                responsavelService.listarTodos(),
            ]);
            setAlunos(listaAlunos);
            setTurmas(listaTurmas);
            setResponsaveis(listaResponsaveis);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const abrirModalEdicao = (aluno) => {
        setFormEdicao({
            nome: aluno.nome,
            ativo: aluno.ativo !== false,
            responsavelId: aluno.responsavelPrincipalId || '',
            parentesco: aluno.parentesco || 'PAI',
        });
        setAlunoModalEdicao(aluno);
    };

    const handleSalvarEdicao = async (e) => {
        e.preventDefault();
        try {
            await alunoService.atualizar(alunoModalEdicao.id, {
                nome: formEdicao.nome,
                ativo: formEdicao.ativo,
                responsavelId: formEdicao.responsavelId ? Number(formEdicao.responsavelId) : null,
                parentesco: formEdicao.parentesco,
            });
            showToast('Dados do aluno atualizados com sucesso!');
            setAlunoModalEdicao(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleConfirmarAlternarStatus = async () => {
        if (!confirmacaoStatusAluno) return;
        try {
            const atualizado = await alunoService.alternarStatus(confirmacaoStatusAluno.id);
            showToast(
                atualizado.ativo
                    ? `Aluno ${atualizado.nome} reativado com sucesso!`
                    : `Aluno ${atualizado.nome} desativado e matrículas trancadas.`
            );
            setConfirmacaoStatusAluno(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleSalvarNovaBolsa = async (e) => {
        e.preventDefault();
        if (!modalBolsa) return;
        try {
            await alunoService.atualizarBolsa(
                modalBolsa.alunoId,
                modalBolsa.turmaId,
                Number(modalBolsa.porcentagemBolsa || 0)
            );
            showToast(
                `Bolsa de ${modalBolsa.alunoNome} em ${modalBolsa.turmaNome} atualizada para ${modalBolsa.porcentagemBolsa}%!`
            );
            setModalBolsa(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleConfirmarDesmatricula = async () => {
        if (!confirmacaoDesmatricula) return;
        try {
            await alunoService.desmatricularDeTurma(
                confirmacaoDesmatricula.alunoId,
                confirmacaoDesmatricula.turmaId
            );
            showToast(
                `Aluno ${confirmacaoDesmatricula.alunoNome} desmatriculado da turma ${confirmacaoDesmatricula.turmaNome}.`
            );
            setConfirmacaoDesmatricula(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleNovaMatricula = async (e) => {
        e.preventDefault();
        if (!formNovaMatricula.turmaId) {
            showToast('Selecione uma turma na busca.', 'erro');
            return;
        }
        try {
            await alunoService.matricularEmNovaTurma(alunoModalMatricula.id, {
                turmaId: Number(formNovaMatricula.turmaId),
                porcentagemBolsa: Number(formNovaMatricula.porcentagemBolsa || 0),
            });
            showToast('Aluno matriculado na turma com sucesso!');
            setAlunoModalMatricula(null);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const alunosFiltrados = alunos.filter((a) => {
        const termo = busca.toLowerCase().trim();
        const bateTexto =
            !termo ||
            a.nome?.toLowerCase().includes(termo) ||
            a.matriculaCodigo?.toLowerCase().includes(termo) ||
            a.responsavelPrincipalNome?.toLowerCase().includes(termo);

        const bateTurma =
            turmaFiltro === 'TODAS' || a.turmas?.includes(turmaFiltro);

        const bateStatus =
            statusFiltro === 'TODOS' ||
            (statusFiltro === 'ATIVOS' && a.ativo !== false) ||
            (statusFiltro === 'INATIVOS' && a.ativo === false);

        return bateTexto && bateTurma && bateStatus;
    });

    return (
        <div className="space-y-6">
            <div className="card-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-[16px] font-bold text-white">
                            Alunos Matriculados ({alunosFiltrados.length})
                        </h3>
                        <p className="text-xs text-[#8e8e96] mt-0.5">
                            Clique sobre a turma para <span className="text-[#f5c518] font-bold">alterar a bolsa (%)</span> ou no <span className="text-red-400 font-bold">×</span> para desmatricular
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 bg-[#0b0b0d] p-1 rounded-xl border border-[#242428]">
                            {[
                                { id: 'TODOS', label: 'Todos' },
                                { id: 'ATIVOS', label: 'Ativos' },
                                { id: 'INATIVOS', label: 'Inativos' },
                            ].map((st) => (
                                <button
                                    key={st.id}
                                    onClick={() => setStatusFiltro(st.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                        statusFiltro === st.id
                                            ? 'bg-[#f5c518] text-[#0a0a0c]'
                                            : 'text-[#8e8e96] hover:text-white'
                                    }`}
                                >
                                    {st.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-[#0b0b0d] border border-[#26262a] rounded-xl px-3 py-1.5">
                            <Filter size={13} className="text-[#f5c518]" />
                            <select
                                value={turmaFiltro}
                                onChange={(e) => setTurmaFiltro(e.target.value)}
                                className="bg-transparent text-xs text-white outline-none cursor-pointer"
                            >
                                <option value="TODAS" className="bg-[#141416]">Todas as Turmas</option>
                                {turmas.map((t) => (
                                    <option key={t.id} value={t.nome} className="bg-[#141416]">
                                        {t.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-60">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                            <input
                                type="text"
                                placeholder="Buscar aluno, RA ou responsável..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="input-dark !pl-8 !py-1.5 !text-xs"
                            />
                        </div>

                        <button
                            onClick={() => navigate('/alunos/novo')}
                            className="btn-yellow flex items-center gap-2 !py-2 !px-4 !text-xs"
                        >
                            <UserPlus size={15} />
                            <span>Nova Matrícula</span>
                        </button>
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-y border-[#242428] table-header">
                            <th className="py-3.5 px-3">MATRÍCULA</th>
                            <th className="py-3.5 px-3">ALUNO</th>
                            <th className="py-3.5 px-3">CURSOS & BOLSAS (CLIQUE P/ EDITAR BOLSA)</th>
                            <th className="py-3.5 px-3">RESPONSÁVEL FINANCEIRO</th>
                            <th className="py-3.5 px-3">STATUS</th>
                            <th className="py-3.5 px-3 text-right">AÇÕES</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222226] text-[13px]">
                        {alunosFiltrados.map((a) => {
                            const listaMatriculas = a.matriculasAtivas || [];
                            return (
                                <tr
                                    key={a.id}
                                    className={`hover:bg-[#1c1c20]/40 transition-colors ${
                                        a.ativo === false ? 'opacity-60' : ''
                                    }`}
                                >
                                    <td className="py-4 px-3 font-mono text-[11px] font-bold text-[#f5c518] whitespace-nowrap">
                                        {a.matriculaCodigo}
                                    </td>
                                    <td className="py-4 px-3 font-bold text-white">{a.nome}</td>
                                    <td className="py-4 px-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {listaMatriculas.length > 0 ? (
                                                listaMatriculas.map((mat) => (
                                                    <div
                                                        key={mat.turmaId}
                                                        className="inline-flex items-center rounded-full bg-[#241e09] border border-[#5c4a11] text-[#f5c518] text-[10px] font-bold overflow-hidden"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setModalBolsa({
                                                                    alunoId: a.id,
                                                                    alunoNome: a.nome,
                                                                    turmaId: mat.turmaId,
                                                                    turmaNome: mat.turmaNome,
                                                                    porcentagemBolsa: Number(mat.porcentagemBolsa || 0),
                                                                })
                                                            }
                                                            title="Clique para alterar a porcentagem de bolsa neste curso"
                                                            className="pl-2.5 pr-1.5 py-0.5 hover:bg-[#f5c518]/15 flex items-center gap-1 cursor-pointer transition"
                                                        >
                                                            <span>{mat.turmaNome}</span>
                                                            <span className="px-1.5 py-0.2 rounded-full bg-[#0b0b0d]/80 text-[#34d399] font-mono">
                                  {Number(mat.porcentagemBolsa || 0)}% bolsa
                                </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setConfirmacaoDesmatricula({
                                                                    alunoId: a.id,
                                                                    alunoNome: a.nome,
                                                                    turmaId: mat.turmaId,
                                                                    turmaNome: mat.turmaNome,
                                                                })
                                                            }
                                                            title={`Desmatricular de ${mat.turmaNome}`}
                                                            className="px-1.5 py-1 hover:bg-red-500/30 hover:text-red-300 flex items-center justify-center transition cursor-pointer border-l border-[#5c4a11]"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-[#71717a] italic">
                            Sem turma ativa
                          </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-3">
                                        <div className="font-bold text-white">{a.responsavelPrincipalNome}</div>
                                        <div className="text-[11px] text-[#8e8e96]">
                                            WhatsApp: {formatarWhatsapp(a.responsavelPrincipalWhatsapp)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-3 whitespace-nowrap">
                                        {a.ativo !== false ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0d2818] text-[#34d399] border border-[#155e3b]">
                          ATIVO
                        </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/50">
                          DESATIVADO
                        </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-3 text-right whitespace-nowrap space-x-1.5">
                                        <button
                                            onClick={() => abrirModalEdicao(a)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#26262c] border border-[#2e2e36] text-[#e4e4e7] text-[11px] font-bold cursor-pointer"
                                        >
                                            <Pencil size={12} className="text-[#f5c518]" />
                                            <span>Editar</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setFormNovaMatricula({ turmaId: '', porcentagemBolsa: 0 });
                                                setAlunoModalMatricula(a);
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c31] border border-[#323238] text-white text-[11px] font-bold cursor-pointer"
                                        >
                                            <Plus size={13} />
                                            <span>+ Curso</span>
                                        </button>

                                        <button
                                            onClick={() => setConfirmacaoStatusAluno(a)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                                                a.ativo !== false
                                                    ? 'bg-red-950/30 hover:bg-red-950/60 border-red-800/40 text-red-400'
                                                    : 'bg-emerald-950/30 hover:bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                                            }`}
                                        >
                                            <Power size={12} />
                                            <span>{a.ativo !== false ? 'Desativar' : 'Reativar'}</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: Confirmação "Deseja realmente desativar esse aluno?" */}
            <Modal
                aberto={Boolean(confirmacaoStatusAluno)}
                aoFechar={() => setConfirmacaoStatusAluno(null)}
                titulo={
                    confirmacaoStatusAluno?.ativo !== false
                        ? 'Deseja realmente desativar esse aluno?'
                        : 'Deseja reativar o cadastro deste aluno?'
                }
                subtitulo={
                    confirmacaoStatusAluno
                        ? `${confirmacaoStatusAluno.nome} (${confirmacaoStatusAluno.matriculaCodigo})`
                        : ''
                }
            >
                {confirmacaoStatusAluno && (
                    <div className="space-y-4">
                        <div
                            className={`rounded-xl p-4 flex items-start gap-3 border ${
                                confirmacaoStatusAluno.ativo !== false
                                    ? 'bg-red-950/30 border-red-800/40'
                                    : 'bg-[#0d2818]/60 border-[#155e3b]'
                            }`}
                        >
                            <AlertTriangle
                                size={20}
                                className={
                                    confirmacaoStatusAluno.ativo !== false
                                        ? 'text-red-400 shrink-0 mt-0.5'
                                        : 'text-[#34d399] shrink-0 mt-0.5'
                                }
                            />
                            <div className="text-xs text-[#e4e4e7] leading-relaxed">
                                {confirmacaoStatusAluno.ativo !== false ? (
                                    <>
                                        Ao desativar <strong className="text-white">{confirmacaoStatusAluno.nome}</strong>, todas as matrículas ativas dele serão trancadas e <strong>nenhuma nova mensalidade será gerada</strong> para ele nos próximos lotes.
                                    </>
                                ) : (
                                    <>
                                        O cadastro de <strong className="text-white">{confirmacaoStatusAluno.nome}</strong> voltará a ficar ativo no sistema. Você poderá vinculá-lo novamente às turmas desejadas.
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmacaoStatusAluno(null)}
                                className="px-4 py-2 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmarAlternarStatus}
                                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                                    confirmacaoStatusAluno.ativo !== false
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-[#f5c518] text-[#0a0a0c]'
                                }`}
                            >
                                {confirmacaoStatusAluno.ativo !== false
                                    ? 'Sim, Desativar Aluno'
                                    : 'Sim, Reativar Aluno'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 2: Alterar Porcentagem de Bolsa */}
            <Modal
                aberto={Boolean(modalBolsa)}
                aoFechar={() => setModalBolsa(null)}
                titulo="Alterar Bolsa de Estudo (%)"
                subtitulo={
                    modalBolsa ? `${modalBolsa.alunoNome} • Curso: ${modalBolsa.turmaNome}` : ''
                }
            >
                {modalBolsa && (
                    <form onSubmit={handleSalvarNovaBolsa} className="space-y-4">
                        <div>
                            <label className="label-dark flex items-center gap-1.5">
                                <Percent size={12} className="text-[#f5c518]" />
                                PORCENTAGEM DE DESCONTO NA MENSALIDADE (0% A 100%) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                required
                                value={modalBolsa.porcentagemBolsa}
                                onChange={(e) =>
                                    setModalBolsa({ ...modalBolsa, porcentagemBolsa: e.target.value })
                                }
                                className="input-dark text-base font-bold text-[#f5c518]"
                            />
                        </div>

                        {/* Atalhos rápidos de bolsa */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#8e8e96]">Atalhos:</span>
                            {[0, 10, 25, 50, 100].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setModalBolsa({ ...modalBolsa, porcentagemBolsa: val })}
                                    className="px-2.5 py-1 rounded-md bg-[#0b0b0d] hover:bg-[#221d0d] border border-[#26262a] hover:border-[#f5c518] text-xs font-bold text-[#e4e4e7] cursor-pointer"
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalBolsa(null)}
                                className="px-4 py-2 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn-yellow !py-2 !px-5 !text-xs">
                                Salvar Nova Bolsa
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL 3: Confirmação de Desmatrícula de Curso */}
            <Modal
                aberto={Boolean(confirmacaoDesmatricula)}
                aoFechar={() => setConfirmacaoDesmatricula(null)}
                titulo="Desmatricular Aluno do Curso"
                subtitulo="Confirmação de trancamento de turma"
            >
                {confirmacaoDesmatricula && (
                    <div className="space-y-4">
                        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="text-xs text-[#e4e4e7] leading-relaxed">
                                Tem certeza que deseja desmatricular o aluno{' '}
                                <strong className="text-white">{confirmacaoDesmatricula.alunoNome}</strong> do curso{' '}
                                <strong className="text-[#f5c518]">{confirmacaoDesmatricula.turmaNome}</strong>?
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmacaoDesmatricula(null)}
                                className="px-4 py-2 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmarDesmatricula}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
                            >
                                Confirmar Desmatrícula
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 4: Editar Dados do Aluno */}
            <Modal
                aberto={Boolean(alunoModalEdicao)}
                aoFechar={() => setAlunoModalEdicao(null)}
                titulo="Editar Dados do Aluno"
                subtitulo={alunoModalEdicao ? `Matrícula: ${alunoModalEdicao.matriculaCodigo}` : ''}
            >
                <form onSubmit={handleSalvarEdicao} className="space-y-4">
                    <div>
                        <label className="label-dark">NOME COMPLETO DO ALUNO *</label>
                        <input
                            type="text"
                            required
                            value={formEdicao.nome}
                            onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="label-dark">RESPONSÁVEL FINANCEIRO PRINCIPAL *</label>
                        <ResponsavelAutocomplete
                            responsaveis={responsaveis}
                            selecionadoId={formEdicao.responsavelId}
                            aoSelecionar={(id) => setFormEdicao({ ...formEdicao, responsavelId: id })}
                            aoCriarNovoResponsavel={(novo) =>
                                setResponsaveis((prev) => [...prev, novo])
                            }
                        />
                    </div>

                    <div>
                        <label className="label-dark">PARENTESCO</label>
                        <select
                            value={formEdicao.parentesco}
                            onChange={(e) => setFormEdicao({ ...formEdicao, parentesco: e.target.value })}
                            className="input-dark"
                        >
                            {['PAI', 'MAE', 'TUTOR', 'OUTRO'].map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setAlunoModalEdicao(null)}
                            className="px-4 py-2 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-yellow !py-2 !px-5 !text-xs">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 5: Matricular em Nova Turma (Usando TurmaAutocomplete) */}
            <Modal
                aberto={Boolean(alunoModalMatricula)}
                aoFechar={() => setAlunoModalMatricula(null)}
                titulo="Matricular em Novo Curso / Turma"
                subtitulo={alunoModalMatricula ? `Aluno: ${alunoModalMatricula.nome}` : ''}
            >
                <form onSubmit={handleNovaMatricula} className="space-y-4">
                    <div>
                        <label className="label-dark">BUSCAR TURMA *</label>
                        <TurmaAutocomplete
                            turmas={turmas}
                            selecionadaId={formNovaMatricula.turmaId}
                            aoSelecionar={(id) =>
                                setFormNovaMatricula({ ...formNovaMatricula, turmaId: id })
                            }
                        />
                    </div>
                    <div>
                        <label className="label-dark">BOLSA DE DESCONTO NESTA TURMA (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formNovaMatricula.porcentagemBolsa}
                            onChange={(e) =>
                                setFormNovaMatricula({ ...formNovaMatricula, porcentagemBolsa: e.target.value })
                            }
                            className="input-dark"
                        />
                    </div>
                    <button type="submit" className="btn-yellow w-full">
                        Confirmar Matrícula
                    </button>
                </form>
            </Modal>
        </div>
    );
}