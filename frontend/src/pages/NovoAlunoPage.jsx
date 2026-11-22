import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alunoService } from '../services/alunoService';
import { turmaService } from '../services/turmaService';
import { responsavelService } from '../services/responsavelService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ResponsavelAutocomplete } from '../components/ui/ResponsavelAutocomplete';
import { formatarMoeda } from '../utils/formatters';
import { GraduationCap, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TurmaAutocomplete } from '../components/ui/TurmaAutocomplete';

export function NovoAlunoPage() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [turmas, setTurmas] = useState([]);
    const [responsaveis, setResponsaveis] = useState([]);
    const [salvando, setSalvando] = useState(false);

    const [formAluno, setFormAluno] = useState({
        nome: '',
        responsavelId: '',
        parentesco: 'PAI',
        turmaId: '',
        porcentagemBolsa: 0,
    });

    const carregarDependencias = async () => {
        try {
            const [listaTurmas, listaResponsaveis] = await Promise.all([
                turmaService.listarTodas(),
                responsavelService.listarTodos(),
            ]);
            setTurmas(listaTurmas);
            setResponsaveis(listaResponsaveis);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarDependencias();
    }, []);

    const turmaEscolhida = turmas.find((t) => String(t.id) === String(formAluno.turmaId));
    const valorBase = turmaEscolhida ? Number(turmaEscolhida.valorMensalidadePadrao) : 0;
    const percentual = Number(formAluno.porcentagemBolsa || 0);
    const valorDesconto = (valorBase * percentual) / 100;
    const valorFinalPrevisto = Math.max(0, valorBase - valorDesconto);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formAluno.responsavelId) {
            showToast('Selecione ou cadastre um responsável financeiro para o aluno.', 'erro');
            return;
        }
        setSalvando(true);
        try {
            const alunoCriado = await alunoService.cadastrar({
                nome: formAluno.nome,
                matriculaCodigo: null, // Gerado automaticamente pelo Back-End
                responsavelId: Number(formAluno.responsavelId),
                parentesco: formAluno.parentesco,
                turmaId: Number(formAluno.turmaId),
                porcentagemBolsa: Number(formAluno.porcentagemBolsa || 0),
            });
            showToast(
                `Aluno matriculado com sucesso! Código gerado: ${alunoCriado.matriculaCodigo}`
            );
            navigate('/alunos');
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => navigate('/alunos')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#8e8e96] hover:text-white cursor-pointer"
                >
                    <ArrowLeft size={15} /> Voltar para Alunos Matriculados
                </button>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#241e09] border border-[#5c4a11] text-[#f5c518] text-[11px] font-bold">
          <Sparkles size={13} /> Matrícula (RA) Gerada Automaticamente
        </span>
            </div>

            <form onSubmit={handleSubmit} className="card-panel p-8 space-y-6">
                <div className="border-b border-[#242428] pb-4">
                    <h2 className="text-lg font-extrabold text-[#f5c518] flex items-center gap-2.5">
                        <GraduationCap size={22} /> Ficha de Matrícula de Novo Aluno
                    </h2>
                    <p className="text-xs text-[#8e8e96] mt-1">
                        Preencha os dados do aluno, busque ou cadastre o responsável financeiro na hora e defina a turma inicial.
                    </p>
                </div>

                {/* Bloco 1: Identificação do Aluno */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="label-dark">NOME COMPLETO DO ALUNO *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Pedro Henrique Alves"
                            value={formAluno.nome}
                            onChange={(e) => setFormAluno({ ...formAluno, nome: e.target.value })}
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="label-dark">CÓDIGO DE MATRÍCULA</label>
                        <div className="input-dark !bg-[#121215] !text-[#71717a] font-mono flex items-center justify-between select-none">
                            <span>RA{new Date().getFullYear()}•••••</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#222226] text-[#f5c518] font-sans font-bold">
                AUTO
              </span>
                        </div>
                    </div>
                </div>

                {/* Bloco 2: Responsável Financeiro (Autocomplete + Criação Inline) */}
                <div className="space-y-3 border-t border-[#242428] pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="label-dark">
                                RESPONSÁVEL FINANCEIRO PRINCIPAL (BUSQUE POR NOME/CPF OU CADASTRE) *
                            </label>
                            <ResponsavelAutocomplete
                                responsaveis={responsaveis}
                                selecionadoId={formAluno.responsavelId}
                                aoSelecionar={(id) => setFormAluno({ ...formAluno, responsavelId: id })}
                                aoCriarNovoResponsavel={(novo) =>
                                    setResponsaveis((prev) => [...prev, novo])
                                }
                            />
                        </div>

                        <div>
                            <label className="label-dark">GRAU DE PARENTESCO *</label>
                            <select
                                value={formAluno.parentesco}
                                onChange={(e) => setFormAluno({ ...formAluno, parentesco: e.target.value })}
                                className="input-dark"
                            >
                                {['PAI', 'MAE', 'TUTOR', 'OUTRO'].map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bloco 3: Vínculo de Turma e Bolsa */}
                <div className="space-y-4 border-t border-[#242428] pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="md:col-span-2">
                                <label className="label-dark">TURMA INICIAL (BUSQUE PELO NOME OU TURNO) *</label>
                                <TurmaAutocomplete
                                    turmas={turmas}
                                    selecionadaId={formAluno.turmaId}
                                    aoSelecionar={(id) => setFormAluno({ ...formAluno, turmaId: id })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label-dark">BOLSA DE DESCONTO (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formAluno.porcentagemBolsa}
                                onChange={(e) =>
                                    setFormAluno({ ...formAluno, porcentagemBolsa: e.target.value })
                                }
                                className="input-dark"
                            />
                        </div>
                    </div>

                    {/* Resumo Financeiro em Tempo Real */}
                    {turmaEscolhida && (
                        <div className="bg-[#0b0b0d] border border-[#242428] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                <span className="text-[11px] text-[#8e8e96] block">
                  Simulação da Mensalidade ({turmaEscolhida.nome})
                </span>
                                <span className="text-xs text-[#a1a1aa]">
                  Base: R$ {formatarMoeda(valorBase)} | Desconto ({percentual}%): - R${' '}
                                    {formatarMoeda(valorDesconto)}
                </span>
                            </div>
                            <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8e8e96] block">
                  Valor Final Mensal
                </span>
                                <span className="text-lg font-black text-[#f5c518]">
                  R$ {formatarMoeda(valorFinalPrevisto)}
                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/alunos')}
                        className="px-5 py-2.5 rounded-xl bg-[#222226] hover:bg-[#2c2c31] text-xs font-bold text-white cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={salvando}
                        className="btn-yellow flex items-center gap-2 !px-8"
                    >
                        <CheckCircle2 size={16} />
                        <span>{salvando ? 'Matriculando...' : 'Salvar e Matricular Aluno'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}