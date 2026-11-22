import React from 'react';
import { Copy } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from '../../context/ToastContext';

export function PixQrModal({ fatura, aoFechar }) {
    const { showToast } = useToast();

    if (!fatura) return null;

    const copiarPayload = () => {
        navigator.clipboard.writeText(fatura.qrCodePix || '');
        showToast('Código Pix Copia e Cola copiado para a área de transferência!');
    };

    return (
        <Modal
            aberto={Boolean(fatura)}
            aoFechar={aoFechar}
            titulo="QR Code Pix Dinâmico (Asaas)"
            subtitulo={`${fatura.descricao} • Aluno: ${fatura.alunoNome}`}
        >
            <div className="space-y-4 text-center">
                {fatura.qrCodeBase64 ? (
                    <img
                        src={`data:image/png;base64,${fatura.qrCodeBase64}`}
                        alt="QR Code Pix"
                        className="w-56 h-56 mx-auto rounded-xl border-4 border-yellow-400 p-2 bg-white"
                    />
                ) : (
                    <div className="py-12 text-zinc-500 text-sm bg-zinc-950 rounded-xl border border-zinc-800">
                        Imagem Base64 não disponível para esta fatura
                    </div>
                )}

                <div>
                    <span className="text-xs text-zinc-400">Valor Final da Cobrança</span>
                    <p className="text-2xl font-black text-white">
                        R$ {Number(fatura.valorFinal).toFixed(2)}
                    </p>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-left">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
            Pix Copia e Cola (EMV)
          </span>
                    <p className="text-xs font-mono break-all text-zinc-300 line-clamp-3">
                        {fatura.qrCodePix || 'Não informado'}
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={copiarPayload}
                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition cursor-pointer"
                    >
                        <Copy size={16} /> Copiar Código Pix
                    </button>
                    <button
                        onClick={aoFechar}
                        className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold cursor-pointer"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
}