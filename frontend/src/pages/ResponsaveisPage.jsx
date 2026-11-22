import React, { useEffect, useState } from 'react';
import { responsavelService } from '../services/responsavelService';
import { extrairMensagemErro } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { formatarCPF, formatarWhatsapp, limparDigitos } from '../utils/formatters';
import { UserPlus, Search } from 'lucide-react';

export function ResponsaveisPage() {
    const { showToast } = useToast();
    const [responsaveis, setResponsaveis] = useState([]);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);

    const [form, setForm] = useState({
        nome: '',
        cpf: '',
        email: '',
        whatsapp: '',
    });

    const carregarResponsaveis = async () => {
        try {
            setResponsaveis(await responsavelService.listarTodos());
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    useEffect(() => {
        carregarResponsaveis();
    }, []);

    const handleSalvar = async (e) => {
        e.preventDefault();
        try {
            await responsavelService.criar({
                nome: form.nome,
                cpf: limparDigitos(form.cpf),
                email: form.email,
                whatsapp: limparDigitos(form.whatsapp),
            });
            showToast('Responsável financeiro cadastrado com sucesso!');
            setForm({ nome: '', cpf: '', email: '', whatsapp: '' });
            setModalAberto(false);
            carregarResponsaveis();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const responsaveisFiltrados = responsaveis.filter((r) => {
        const termo = busca.toLowerCase().trim();
        return (
            !termo ||
            r.nome?.toLowerCase().includes(termo) ||
            r.cpf?.includes(limparDigitos(termo)) ||
            r.email?.toLowerCase().includes(termo)
        );
    });

    return (
        <div className="space-y-6">
            <div className="card-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-[16px] font-bold text-white">
                            Responsáveis Financeiros Cadastrados ({responsaveisFiltrados.length})
                        </h3>
                        <p className="text-xs text-[#8e8e96] mt-0.5">
                            Pagadores vinculados às cobranças Pix no Asaas e notificações automáticas via WhatsApp
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, CPF ou e-mail..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="input-dark !pl-8 !py-1.5 !text-xs"
                            />
                        </div>

                        <button
                            onClick={() => setModalAberto(true)}
                            className="btn-yellow flex items-center gap-2 !py-2 !px-4 !text-xs"
                        >
                            <UserPlus size={15} />
                            <span>Novo Responsável</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-y border-[#242428] table-header">
                            <th className="py-3.5 px-3">NOME</th>
                            <th className="py-3.5 px-3">CPF</th>
                            <th className="py-3.5 px-3">E-MAIL</th>
                            <th className="py-3.5 px-3 text-right">WHATSAPP</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222226] text-[13px]">
                        {responsaveisFiltrados.map((r) => (
                            <tr key={r.id} className="hover:bg-[#1c1c20]/40 transition-colors">
                                <td className="py-4 px-3 font-bold text-white">{r.nome}</td>
                                <td className="py-4 px-3 font-mono text-xs text-[#a1a1aa] whitespace-nowrap">
                                    {formatarCPF(r.cpf)}
                                </td>
                                <td className="py-4 px-3 text-xs text-[#d4d4d8]">{r.email}</td>
                                <td className="py-4 px-3 text-right whitespace-nowrap">
                                    <a
                                        href={`https://wa.me/${limparDigitos(r.whatsapp)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Abrir conversa no WhatsApp"
                                        className="inline-block px-3 py-1 rounded-full bg-[#241e09] hover:bg-[#332a0c] border border-[#5c4a11] text-[#f5c518] font-mono text-[11px] font-bold transition"
                                    >
                                        {formatarWhatsapp(r.whatsapp)}
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Novo Responsável */}
            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                titulo="Novo Responsável Financeiro"
                subtitulo="Informe um CPF válido para sincronização com o gateway Asaas"
            >
                <form onSubmit={handleSalvar} className="space-y-4">
                    <div>
                        <label className="label-dark">NOME COMPLETO *</label>
                        <input
                            type="text" required placeholder="Ex: Roberto Almeida"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="label-dark">CPF *</label>
                        <input
                            type="text" required placeholder="000.000.000-00"
                            value={form.cpf}
                            onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                            className="input-dark font-mono"
                        />
                    </div>

                    <div>
                        <label className="label-dark">E-MAIL *</label>
                        <input
                            type="email" required placeholder="roberto@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="input-dark"
                        />
                    </div>

                    <div>
                        <label className="label-dark">WHATSAPP *</label>
                        <input
                            type="text" required placeholder="+55 (43) 99999-9999"
                            value={form.whatsapp}
                            onChange={(e) => setForm({ ...form, whatsapp: formatarWhatsapp(e.target.value) })}
                            className="input-dark font-mono"
                        />
                    </div>

                    <button type="submit" className="btn-yellow w-full">
                        Cadastrar Responsável
                    </button>
                </form>
            </Modal>
        </div>
    );
}