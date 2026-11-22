import React, { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Check, X } from 'lucide-react';

export function AlunoAutocomplete({
                                      alunos = [],
                                      selecionadoId,
                                      aoSelecionar,
                                      placeholder = 'Digite o nome do aluno ou código RA...',
                                  }) {
    const [termo, setTermo] = useState('');
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef(null);

    const alunoAtual = alunos.find((a) => String(a.id) === String(selecionadoId));

    useEffect(() => {
        const fecharFora = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setAberto(false);
            }
        };
        document.addEventListener('mousedown', fecharFora);
        return () => document.removeEventListener('mousedown', fecharFora);
    }, []);

    const filtrados = alunos
        .filter((a) => a.ativo !== false)
        .filter((a) => {
            const b = termo.toLowerCase().trim();
            if (!b) return true;
            return (
                a.nome?.toLowerCase().includes(b) ||
                a.matriculaCodigo?.toLowerCase().includes(b) ||
                a.responsavelPrincipalNome?.toLowerCase().includes(b)
            );
        });

    if (alunoAtual) {
        return (
            <div className="flex items-center justify-between bg-[#0b0b0d] border border-[#f5c518]/60 rounded-xl px-3.5 py-2">
                <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <Check size={14} className="text-[#f5c518] shrink-0" />
                        <span className="truncate">{alunoAtual.nome}</span>
                        <span className="font-mono text-[10px] text-[#f5c518]">
              ({alunoAtual.matriculaCodigo})
            </span>
                    </div>
                    <div className="text-[11px] text-[#8e8e96] truncate mt-0.5">
                        Resp: {alunoAtual.responsavelPrincipalNome} • Turmas: {alunoAtual.turmas?.join(', ') || 'Nenhuma'}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        aoSelecionar('');
                        setAberto(true);
                    }}
                    className="ml-2 text-xs text-[#8e8e96] hover:text-white px-2 py-1 rounded bg-[#161618] border border-[#26262a] cursor-pointer shrink-0"
                >
                    Trocar
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={termo}
                    onFocus={() => setAberto(true)}
                    onChange={(e) => {
                        setTermo(e.target.value);
                        setAberto(true);
                    }}
                    className="input-dark !pl-9"
                />
                {termo && (
                    <button
                        type="button"
                        onClick={() => setTermo('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white cursor-pointer"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {aberto && (
                <div className="absolute z-40 w-full mt-1 bg-[#141416] border border-[#2c2c32] rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-[#222226]">
                    {filtrados.map((a) => (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                                aoSelecionar(a.id);
                                setAberto(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#1f1f24] transition flex items-center justify-between cursor-pointer"
                        >
                            <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <GraduationCap size={13} className="text-[#f5c518]" />
                                    <span>{a.nome}</span>
                                    <span className="font-mono text-[10px] text-[#f5c518]">
                    {a.matriculaCodigo}
                  </span>
                                </div>
                                <div className="text-[11px] text-[#8e8e96]">
                                    Resp: {a.responsavelPrincipalNome}
                                </div>
                            </div>
                            <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#241e09] border border-[#5c4a11] text-[#f5c518] font-bold">
                  {a.turmas?.[0] || 'Ativo'}
                </span>
                            </div>
                        </button>
                    ))}
                    {filtrados.length === 0 && (
                        <div className="px-4 py-3 text-xs text-[#71717a] text-center">
                            Nenhum aluno ativo encontrado para "{termo}".
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}