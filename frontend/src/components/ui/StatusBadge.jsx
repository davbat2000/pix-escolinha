import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export function StatusBadge({ status, comIcone = false }) {
    if (status === 'PAGA') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#0d2818] text-[#34d399] border border-[#155e3b]">
        {comIcone && <CheckCircle2 size={12} />}
                PAGA
      </span>
        );
    }

    if (status === 'EM_ANALISE_MANUAL') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-950/60 text-blue-400 border border-blue-700/50">
        {comIcone && <AlertCircle size={12} />}
                EM ANÁLISE
      </span>
        );
    }

    if (status === 'CANCELADA') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-950/60 text-red-400 border border-red-800/50">
        {comIcone && <XCircle size={12} />}
                CANCELADA
      </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#241e09] text-[#f5c518] border border-[#5c4a11]">
      {comIcone && <Clock size={12} />}
            PENDENTE
    </span>
    );
}