import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((mensagem, tipo = 'sucesso') => {
        setToast({ mensagem, tipo });
        setTimeout(() => {
            setToast(null);
        }, 4500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl transition-all ${
                        toast.tipo === 'erro'
                            ? 'bg-red-950/95 border-red-500/60 text-red-200'
                            : 'bg-zinc-900/95 border-yellow-400 text-yellow-300'
                    }`}
                >
                    {toast.tipo === 'erro' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span className="text-sm font-medium">{toast.mensagem}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);