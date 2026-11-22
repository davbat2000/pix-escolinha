import React from 'react';
import { X } from 'lucide-react';

export function Modal({ aberto, aoFechar, titulo, subtitulo, children }) {
    if (!aberto) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-yellow-400">{titulo}</h3>
                        {subtitulo && <p className="text-xs text-zinc-400 mt-0.5">{subtitulo}</p>}
                    </div>
                    <button
                        onClick={aoFechar}
                        className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}