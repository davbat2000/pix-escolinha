import React, { useState, useEffect, useRef } from 'react';
import { responsavelService } from '../../services/responsavelService';
import { extrairMensagemErro } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatarCPF, formatarWhatsapp, limparDigitos } from '../../utils/formatters';
import { Search, UserPlus, Check, X } from 'lucide-react';

export function ResponsavelAutocomplete({
                                            responsaveis,
                                            selecionadoId,
                                            aoSelecionar,
                                            aoCriarNovoResponsavel,
                                        }) {
    const { showToast } = useToast();
    const [termoBusca, setTermoBusca] = useState('');
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [modoCadastroInline, setModoCadastroInline] = useState(false);
    const [salvandoResp, setSalvandoResp] = useState(false);
    const containerRef = useRef(null);

    const [novoResp, setNovoResp] = useState({
        nome: '',
        cpf: '',
        email: '',
        whatsapp: '',
    });

    const responsavelAtual = responsaveis.find((r) => String(r.id) === String(selecionadoId));

    useEffect(() => {
        const fecharAoClicarFora = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setDropdownAberto(false);
            }
        };
        document.addEventListener('mousedown', fecharAoClicarOutside);
        function fecharAoClicarOutside(e) {
            fecharAoClicarFora(e);
        }
        return () => document.removeEventListener('mousedown', fecharAoClicarOutside);
    }, []);

    const filtrados = responsaveis.filter((r) => {
        const t = termoBusca.toLowerCase().trim();
        if (!t) return true;
        return (
            r.nome?.toLowerCase().includes(t) ||
            r.cpf?.includes(limparDigitos(t)) ||
            r.whatsapp?.includes(limparDigitos(t))
        );
    });

    const abrirFormularioInline = () => {
        setNovoResp({
            nome: termoBusca,
            cpf: '',
            email: '',
            whatsapp: '',
        });
        setDropdownAberto(false);
        setModoCadastroInline(true);
    };

    const salvarNovoResponsavelInline = async () => {
        if (!novoResp.nome || !novoResp.cpf || !novoResp.email || !novoResp.whatsapp) {
            showToast('Preencha todos os campos do novo responsável.', 'erro');
            return;
        }
        setSalvandoResp(true);
        try {
            const criado = await responsavelService.criar({
                nome: novoResp.nome,
                cpf: limparDigitos(novoResp.cpf),
                email: novoResp.email,
                whatsapp: limparDigitos(novoResp.whatsapp),
            });
            showToast(`Responsável ${criado.nome} cadastrado e selecionado!`);
            await aoCriarNovoResponsavel(criado);
            aoSelecionar(criado.id);
            setModoCadastroInline(false);
            setTermoBusca('');
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        } finally {
            setSalvandoResp(false);
        }
    };

    return (
        <div ref={containerRef} className="relative space-y-2">
            {/* Se já houver um responsável selecionado e não estiver cadastrando um novo */}
            {responsavelAtual && !modoCadastroInline ? (
                <div className="flex items-center justify-between bg-[#0b0b0d] border border-[#f5c518]/60 rounded-xl px-3.5 py-2.5">
                    <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Check size={14} className="text-[#f5c518]" />
                            {responsavelAtual.nome}
                        </div>
                        <div className="text-[11px] text-[#8e8e96] font-mono mt-0.5">
                            CPF: {formatarCPF(responsavelAtual.cpf)} • WhatsApp: {formatarWhatsapp(responsavelAtual.whatsapp)}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            aoSelecionar('');
                            setDropdownAberto(true);
                        }}
                        className="text-xs text-[#8e8e96] hover:text-white px-2 py-1 rounded bg-[#161618] border border-[#26262a] cursor-pointer"
                    >
                        Trocar
                    </button>
                </div>
            ) : !modoCadastroInline ? (
                <>
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
                        <input
                            type="text"
                            placeholder="Digite o nome ou CPF do responsável para buscar..."
                            value={termoBusca}
                            onFocus={() => setDropdownAberto(true)}
                            onChange={(e) => {
                                setTermoBusca(e.target.value);
                                setDropdownAberto(true);
                            }}
                            className="input-dark !pl-9"
                        />
                    </div>

                    {dropdownAberto && (
                        <div className="absolute z-40 w-full mt-1 bg-[#141416] border border-[#2c2c32] rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-[#222226]">
                            {filtrados.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        aoSelecionar(r.id);
                                        setDropdownAberto(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-[#1f1f24] transition flex items-center justify-between cursor-pointer"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-white">{r.nome}</div>
                                        <div className="text-[11px] text-[#8e8e96] font-mono">
                                            CPF: {formatarCPF(r.cpf)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#f5c518]">
                    {formatarWhatsapp(r.whatsapp)}
                  </span>
                                </button>
                            ))}

                            {/* Botão sempre visível no final da busca para cadastrar na hora */}
                            <button
                                type="button"
                                onClick={abrirFormularioInline}
                                className="w-full text-left px-4 py-3 bg-[#221d0d]/70 hover:bg-[#221d0d] text-[#f5c518] text-xs font-bold flex items-center gap-2 cursor-pointer"
                            >
                                <UserPlus size={15} />
                                <span>
                  {termoBusca
                      ? `Não encontrou? Cadastrar "${termoBusca}" agora mesmo`
                      : '+ Cadastrar novo responsável financeiro aqui mesmo'}
                </span>
                            </button>
                        </div>
                    )}
                </>
            ) : null}

            {/* Sub-formulário Inline para cadastrar o Responsável sem sair da tela do Aluno */}
            {modoCadastroInline && (
                <div className="bg-[#0b0b0d] border border-[#f5c518]/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#222226] pb-2">
            <span className="text-xs font-bold text-[#f5c518] flex items-center gap-1.5">
              <UserPlus size={14} /> Cadastro Rápido de Responsável
            </span>
                        <button
                            type="button"
                            onClick={() => setModoCadastroInline(false)}
                            className="text-[#8e8e96] hover:text-white cursor-pointer"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="label-dark">NOME DO RESPONSÁVEL *</label>
                            <input
                                type="text"
                                placeholder="Ex: Carlos Eduardo Silva"
                                value={novoResp.nome}
                                onChange={(e) => setNovoResp({ ...novoResp, nome: e.target.value })}
                                className="input-dark !bg-[#141416]"
                            />
                        </div>
                        <div>
                            <label className="label-dark">CPF VÁLIDO *</label>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={novoResp.cpf}
                                onChange={(e) => setNovoResp({ ...novoResp, cpf: formatarCPF(e.target.value) })}
                                className="input-dark !bg-[#141416] font-mono"
                            />
                        </div>
                        <div>
                            <label className="label-dark">E-MAIL *</label>
                            <input
                                type="email"
                                placeholder="carlos@email.com"
                                value={novoResp.email}
                                onChange={(e) => setNovoResp({ ...novoResp, email: e.target.value })}
                                className="input-dark !bg-[#141416]"
                            />
                        </div>
                        <div>
                            <label className="label-dark">WHATSAPP *</label>
                            <input
                                type="text"
                                placeholder="+55 (43) 99999-9999"
                                value={novoResp.whatsapp}
                                onChange={(e) =>
                                    setNovoResp({ ...novoResp, whatsapp: formatarWhatsapp(e.target.value) })
                                }
                                className="input-dark !bg-[#141416] font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setModoCadastroInline(false)}
                            className="px-3 py-1.5 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={salvandoResp}
                            onClick={salvarNovoResponsavelInline}
                            className="btn-yellow !py-1.5 !px-4 !text-xs"
                        >
                            {salvandoResp ? 'Salvando...' : 'Salvar e Vincular Responsável'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}