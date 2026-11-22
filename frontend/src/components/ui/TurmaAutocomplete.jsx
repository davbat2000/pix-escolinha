import React, { useState, useEffect, useRef } from 'react';
import { formatarMoeda } from '../../utils/formatters';
import { Search, BookOpen, Check, X } from 'lucide-react';

export function TurmaAutocomplete({
                                      turmas = [],
                                      selecionadaId,
                                      aoSelecionar,
                                      placeholder = 'Digite o nome da turma ou turno para buscar...',
                                      permitirTodas = false,
                                  }) {
    const [termo, setTermo] = useState('');
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef(null);

    const turmaAtual = turmas.find((t) => String(t.id) === String(selecionadaId));

    useEffect(() => {
        const fecharFora = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setAberto(false);
            }
        };
        document.addEventListener('mousedown', fecharFora);
        return () => document.removeEventListener('mousedown', fecharFora);
    }, []);

    const filtradas = turmas.filter((t) => {
        const b = termo.toLowerCase().trim();
        if (!b) return true;
        return (
            t.nome?.toLowerCase().includes(b) ||
            t.turno?.toLowerCase().includes(b)
        );
    });

    if (turmaAtual) {
        return (
            <div className="flex items-center justify-between bg-[#0b0b0d] border border-[#f5c518]/60 rounded-xl px-3.5 py-2">
                <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <Check size={14} className="text-[#f5c518] shrink-0" />
                        <span className="truncate">{turmaAtual.nome}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#221d0d] text-[#f5c518] text-[9px] uppercase font-black">
              {turmaAtual.turno}
            </span>
                    </div>
                    <div className="text-[11px] text-[#8e8e96] mt-0.5">
                        Mensalidade: R$ {formatarMoeda(turmaAtual.valorMensalidadePadrao)} • Venc. dia {turmaAtual.diaVencimentoPadrao}
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
                    {permitirTodas && (
                        <button
                            type="button"
                            onClick={() => {
                                aoSelecionar('');
                                setTermo('');
                                setAberto(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#1f1f24] text-xs font-bold text-[#f5c518] cursor-pointer"
                        >
                            Todas as turmas (Geral)
                        </button>
                    )}
                    {filtradas.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                                aoSelecionar(t.id);
                                setAberto(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#1f1f24] transition flex items-center justify-between cursor-pointer"
                        >
                            <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <BookOpen size={13} className="text-[#f5c518]" />
                                    <span>{t.nome}</span>
                                </div>
                                <div className="text-[11px] text-[#8e8e96]">
                                    Turno: {t.turno} • Vencimento padrão dia {t.diaVencimentoPadrao}
                                </div>
                            </div>
                            <span className="text-xs font-extrabold text-[#f5c518] whitespace-nowrap">
                R$ {formatarMoeda(t.valorMensalidadePadrao)}
              </span>
                        </button>
                    ))}
                    {filtradas.length === 0 && (
                        <div className="px-4 py-3 text-xs text-[#71717a] text-center">
                            Nenhuma turma encontrada para "{termo}".
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}