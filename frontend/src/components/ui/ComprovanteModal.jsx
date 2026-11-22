import React, { useState } from 'react';
import { Modal } from './Modal';
import { faturaService } from '../../services/faturaService';
import { extrairMensagemErro } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatarMoeda } from '../../utils/formatters';
import {
    FileText,
    Upload,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Download,
    ShieldCheck,
    Printer
} from 'lucide-react';

export function ComprovanteModal({ fatura, aoFechar, aoAtualizar }) {
    const { showToast } = useToast();
    const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
    const [formaPagamento, setFormaPagamento] = useState('PIX');
    const [observacao, setObservacao] = useState('');
    const [aprovarNaHora, setAprovarNaHora] = useState(true);
    const [enviando, setEnviando] = useState(false);

    if (!fatura) return null;

    const pag = fatura.pagamento;
    const urlArquivoLocal = pag?.possuiArquivoLocal
        ? faturaService.obterUrlArquivoComprovante(fatura.id)
        : null;
    const urlExternaAsaas =
        pag?.urlComprovante && pag.urlComprovante.startsWith('http')
            ? pag.urlComprovante
            : null;

    const ehImagemLocal =
        pag?.urlComprovante &&
        /\.(png|jpg|jpeg|webp|gif)$/i.test(pag.urlComprovante);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!arquivoSelecionado) {
            showToast('Selecione um arquivo (PDF ou Imagem) do comprovante.', 'erro');
            return;
        }
        setEnviando(true);
        try {
            await faturaService.uploadArquivoComprovante(
                fatura.id,
                arquivoSelecionado,
                formaPagamento,
                observacao,
                aprovarNaHora
            );
            showToast(
                aprovarNaHora
                    ? 'Comprovante salvo no servidor e fatura liquidada com sucesso!'
                    : 'Comprovante salvo no diretório local para análise!'
            );
            setArquivoSelecionado(null);
            aoAtualizar();
            aoFechar();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        } finally {
            setEnviando(false);
        }
    };

    const handleAprovarExistente = async () => {
        try {
            await faturaService.aprovarManual(fatura.id);
            showToast('Comprovante aprovado e fatura baixada!');
            aoAtualizar();
            aoFechar();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const handleRejeitarExistente = async () => {
        try {
            await faturaService.rejeitarComprovante(
                fatura.id,
                'Comprovante ilegível ou divergente (rejeitado pela secretaria)'
            );
            showToast('Comprovante rejeitado. A fatura voltou para Pendente.');
            aoAtualizar();
            aoFechar();
        } catch (err) {
            showToast(extrairMensagemErro(err), 'erro');
        }
    };

    const formatarDataHora = (iso) => {
        if (!iso) return 'Não registrado';
        return new Date(iso).toLocaleString('pt-BR');
    };

    return (
        <Modal
            aberto={Boolean(fatura)}
            aoFechar={aoFechar}
            titulo="Comprovante & Recibo de Pagamento"
            subtitulo={`Fatura #${fatura.id} • TXID: ${fatura.txid}`}
        >
            <div className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
                {/* BLOCO 1: RECIBO DIGITAL (Para faturas Pagas via Asaas ou com Comprovante Anexado) */}
                {pag ? (
                    <div className="bg-[#0b0b0d] border border-[#26262a] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#222226] pb-2.5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck
                                    size={18}
                                    className={
                                        fatura.status === 'PAGA' ? 'text-[#34d399]' : 'text-[#f5c518]'
                                    }
                                />
                                <span className="text-xs font-extrabold text-white uppercase">
                  {fatura.status === 'PAGA'
                      ? 'Recibo de Liquidação Confirmada'
                      : 'Comprovante em Análise'}
                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161618] text-[#f5c518] border border-[#2c2c32]">
                {pag.formaPagamento}
              </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div>
                                <span className="text-[10px] text-[#8e8e96] block">ALUNO</span>
                                <strong className="text-white">{fatura.alunoNome}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-[#8e8e96] block">RESPONSÁVEL</span>
                                <strong className="text-white">{fatura.responsavelNome}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-[#8e8e96] block">VALOR LIQUIDADO</span>
                                <strong className="text-[#34d399] text-sm">
                                    R$ {formatarMoeda(pag.valorPago)}
                                </strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-[#8e8e96] block">DATA / HORA</span>
                                <span className="text-[#d4d4d8]">{formatarDataHora(pag.dataPagamento)}</span>
                            </div>
                            <div className="col-span-2">
                <span className="text-[10px] text-[#8e8e96] block">
                  AUTENTICAÇÃO / TRANSAÇÃO (ASAAS / SISTEMA)
                </span>
                                <span className="font-mono text-[11px] text-[#f5c518] break-all">
                  {pag.transacaoId || fatura.externalPaymentId || fatura.txid}
                </span>
                            </div>
                            {pag.observacao && (
                                <div className="col-span-2">
                                    <span className="text-[10px] text-[#8e8e96] block">OBSERVAÇÃO</span>
                                    <span className="text-[11px] text-[#a1a1aa]">{pag.observacao}</span>
                                </div>
                            )}
                        </div>

                        {/* Preview se for Arquivo Salvo no Diretório Local */}
                        {urlArquivoLocal && (
                            <div className="border-t border-[#222226] pt-3 space-y-2">
                                <span className="label-dark">ARQUIVO SALVO NO SERVIDOR LOCAL</span>
                                {ehImagemLocal ? (
                                    <img
                                        src={urlArquivoLocal}
                                        alt="Comprovante Anexado"
                                        className="max-h-56 mx-auto rounded-lg border border-[#2c2c32] object-contain bg-black"
                                    />
                                ) : (
                                    <div className="bg-[#141416] border border-[#26262a] rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-[#e4e4e7] flex items-center gap-2 truncate">
                      <FileText size={16} className="text-[#f5c518] shrink-0" />
                      <span className="truncate">{pag.urlComprovante}</span>
                    </span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <a
                                        href={urlArquivoLocal}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#222226] hover:bg-[#2c2c32] text-xs font-bold text-white transition"
                                    >
                                        <ExternalLink size={13} className="text-[#f5c518]" />
                                        Abrir Arquivo Original
                                    </a>
                                    <a
                                        href={urlArquivoLocal}
                                        download
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#161618] hover:bg-[#222226] border border-[#2c2c32] text-xs font-bold text-[#a1a1aa] hover:text-white transition"
                                    >
                                        <Download size={13} /> Baixar
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Link se tiver Recibo Externo do Asaas */}
                        {urlExternaAsaas && (
                            <div className="border-t border-[#222226] pt-3">
                                <a
                                    href={urlExternaAsaas}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#221d0d] hover:bg-[#2e2711] border border-[#5c4a11] text-xs font-bold text-[#f5c518] transition"
                                >
                                    <ExternalLink size={14} />
                                    Consultar Comprovante Oficial Asaas
                                </a>
                            </div>
                        )}

                        {/* Botões de Aprovar / Rejeitar caso esteja EM_ANALISE_MANUAL */}
                        {fatura.status === 'EM_ANALISE_MANUAL' && (
                            <div className="border-t border-[#222226] pt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleAprovarExistente}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#0d2818] hover:bg-[#133923] border border-[#155e3b] text-[#34d399] text-xs font-bold cursor-pointer"
                                >
                                    <CheckCircle2 size={14} /> Aprovar Comprovante
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRejeitarExistente}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-bold cursor-pointer"
                                >
                                    <XCircle size={14} /> Rejeitar
                                </button>
                            </div>
                        )}

                        <div className="border-t border-[#222226] pt-2.5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8e8e96] hover:text-white cursor-pointer"
                            >
                                <Printer size={13} /> Imprimir Recibo
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0b0b0d] border border-[#242428] rounded-xl p-4 text-xs text-[#8e8e96]">
                        Esta fatura ainda não possui comprovante ou pagamento vinculado. Caso o responsável tenha enviado o comprovante por WhatsApp ou e-mail, anexe-o abaixo.
                    </div>
                )}

                {/* BLOCO 2: FORMULÁRIO DE UPLOAD PARA SALVAR OU SUBSTITUIR COMPROVANTE NO DIRETÓRIO LOCAL */}
                <form onSubmit={handleUpload} className="border-t border-[#242428] pt-4 space-y-3.5">
          <span className="label-dark flex items-center gap-1.5">
            <Upload size={13} className="text-[#f5c518]" />
              {pag
                  ? 'ANEXAR OU SUBSTITUIR ARQUIVO DE COMPROVANTE (WHATSAPP / E-MAIL)'
                  : 'SALVAR COMPROVANTE ENVIADO PELO RESPONSÁVEL (DIRETÓRIO LOCAL)'}
          </span>

                    <div>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#2c2c34] hover:border-[#f5c518] rounded-xl bg-[#0b0b0d] cursor-pointer transition px-4 text-center">
                            <Upload size={18} className="text-[#f5c518] mb-1" />
                            <span className="text-xs font-bold text-white truncate max-w-full">
                {arquivoSelecionado
                    ? arquivoSelecionado.name
                    : 'Clique para selecionar o PDF ou Imagem (JPG/PNG)'}
              </span>
                            <span className="text-[10px] text-[#71717a]">
                Salvo localmente em ./uploads/comprovantes (Máx. 10MB)
              </span>
                            <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-dark">MEIO DE PAGAMENTO</label>
                            <select
                                value={formaPagamento}
                                onChange={(e) => setFormaPagamento(e.target.value)}
                                className="input-dark"
                            >
                                {['PIX', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO'].map((fp) => (
                                    <option key={fp} value={fp}>{fp}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label-dark">ORIGEM / OBSERVAÇÃO</label>
                            <input
                                type="text"
                                placeholder="Ex: Enviado no WhatsApp"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                className="input-dark"
                            />
                        </div>
                    </div>

                    {fatura.status !== 'PAGA' && (
                        <label className="flex items-center gap-2 text-xs text-[#d4d4d8] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={aprovarNaHora}
                                onChange={(e) => setAprovarNaHora(e.target.checked)}
                                className="accent-[#f5c518] w-4 h-4 rounded"
                            />
                            <span>Já aprovar pagamento e dar baixa na fatura imediatamente</span>
                        </label>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={aoFechar}
                            className="px-4 py-2 rounded-lg bg-[#222226] text-xs font-bold text-[#a1a1aa] cursor-pointer"
                        >
                            Fechar
                        </button>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="btn-yellow !py-2 !px-5 !text-xs flex items-center gap-1.5"
                        >
                            <Upload size={14} />
                            <span>{enviando ? 'Salvando no servidor...' : 'Salvar Comprovante'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}