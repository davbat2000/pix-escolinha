import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { turmaService } from '../services/turmaService';
import { alunoService } from '../services/alunoService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { formatarMoeda } from '../utils/formatters';
import { BookOpen, Users, ArrowRight, Plus, Search } from 'lucide-react';

export function TurmasPage() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [turmas, setTurmas] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        turno: 'MATUTINO',
        valorMensalidadePadrao: '',
        diaVencimentoPadrao: 10,
    });

    const carregarDados = async () => {
        try {
            const [listaTurmas, listaAlunos] = await Promise.all([
                turmaService.listarTodas(),
                alunoService.listarTodos(),
            ]);
            setTurmas(listaTurmas);
            setAlunos(listaAlunos);
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            await turmaService.criar({
                ...form,
                valorMensalidadePadrao: Number(form.valorMensalidadePadrao),
                diaVencimentoPadrao: Number(form.diaVencimentoPadrao),
            });
            showToast('Turma cadastrada com sucesso!');
            setForm({ nome: '', turno: 'MATUTINO', valorMensalidadePadrao: '', diaVencimentoPadrao: 10 });
            setModalAberto(false);
            carregarDados();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const contarAlunosNaTurma = (nomeTurma) =>
        alunos.filter((a) => a.ativo !== false && a.turmas?.includes(nomeTurma)).length;

    const turmasFiltradas = turmas.filter((t) =>
        t.nome?.toLowerCase().includes(busca.toLowerCase().trim())
    );

    return (
        <div className="space-y-6">
            {/* Barra de Topo */}
            <div className="card-panel p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-[16px] font-bold text-white">
                        Cursos e Turmas Cadastradas ({turmasFiltradas.length})
                    </h2>
                    <p className="text-xs text-[#8e8e96] mt-0.5">
                        Visualize os alunos ativos por turma ou dispare o faturamento mensal diretamente pelo card
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                        <input
                            type="text"
                            placeholder="Buscar turma..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="input-dark !pl-8 !py-1.5 !text-xs"
                        />
                    </div>

                    <button
                        onClick={() => setModalAberto(true)}
                        className="btn-yellow flex items-center gap-2 !py-2 !px-4 !text-xs"
                    >
                        <Plus size={15} />
                        <span>Nova Turma</span>
                    </button>
                </div>
            </div>

            {/* Grid Full-Width de 3 Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {turmasFiltradas.map((t) => {
                    const qtdAlunos = contarAlunosNaTurma(t.nome);
                    return (
                        <div key={t.id} className="card-panel p-6 flex flex-col justify-between space-y-5">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#f5c518] text-[#0a0a0c] text-[10px] font-black uppercase">
                    {t.turno}
                  </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-[#a1a1aa] font-medium">
                    <Users size={13} className="text-[#f5c518]" />
                                        {qtdAlunos} aluno(s) • Turma #{t.id}
                  </span>
                                </div>
                                <h3 className="text-[16px] font-extrabold text-white">{t.nome}</h3>
                            </div>

                            <div className="border-t border-[#242428] pt-3.5 flex items-end justify-between">
                                <div>
                                    <span className="text-[11px] text-[#8e8e96] block">Mensalidade Base</span>
                                    <span className="text-[18px] font-black text-[#f5c518] whitespace-nowrap">
                    R$ {formatarMoeda(t.valorMensalidadePadrao)}
                  </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-[#8e8e96] block">Vencimento Padrão</span>
                                    <span className="text-[12px] font-bold text-white">
                    Todo dia {t.diaVencimentoPadrao}
                  </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/faturas', { state: { turmaId: t.id } })}
                                className="w-full py-2 px-3 rounded-lg bg-[#0b0b0d] hover:bg-[#1c1c20] border border-[#26262a] text-xs font-bold text-[#f5c518] flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <span>Emitir Mensalidades desta Turma</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal: Cadastrar Nova Turma */}
            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                titulo="Cadastrar Nova Turma"
                subtitulo="Defina turno, valor base e dia de vencimento padrão"
            >
                <form onSubmit={handleSalvar} className="space-y-4">
                    <div>
                        <label className="label-dark">NOME DA TURMA *</label>
                        <input
                            type="text" required placeholder="Ex: Intensivo ENEM 2026"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="label-dark">TURNO *</label>
                        <select
                            value={form.turno}
                            onChange={(e) => setForm({ ...form, turno: e.target.value })}
                            className="input-dark"
                        >
                            {['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-dark">MENSALIDADE (R$) *</label>
                            <input
                                type="number" step="0.01" required placeholder="950.00"
                                value={form.valorMensalidadePadrao}
                                onChange={(e) => setForm({ ...form, valorMensalidadePadrao: e.target.value })}
                                className="input-dark"
                            />
                        </div>

                        <div>
                            <label className="label-dark">DIA VENCIMENTO (1-31) *</label>
                            <input
                                type="number" min="1" max="31" required
                                value={form.diaVencimentoPadrao}
                                onChange={(e) => setForm({ ...form, diaVencimentoPadrao: e.target.value })}
                                className="input-dark"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-yellow w-full">
                        Salvar Turma
                    </button>
                </form>
            </Modal>
        </div>
    );
}