import { api } from './api';

export const faturaService = {
    listarTodas: () => api.get('/faturas').then((res) => res.data),
    buscarPorId: (id) => api.get(`/faturas/${id}`).then((res) => res.data),
    gerarMensalidades: (payload) => api.post('/faturas/mensalidades', payload).then((res) => res.data),
    gerarEventuais: (payload) => api.post('/faturas/eventuais', payload).then((res) => res.data),
    enviarComprovante: (id, payload) => api.post(`/faturas/${id}/comprovante`, payload).then((res) => res.data),

    uploadArquivoComprovante: (id, arquivo, formaPagamento, observacao, aprovarImediatamente) => {
        const formData = new FormData();
        formData.append('arquivo', arquivo);
        formData.append('formaPagamento', formaPagamento || 'PIX');
        if (observacao) formData.append('observacao', observacao);
        formData.append('aprovarImediatamente', Boolean(aprovarImediatamente));

        return api
            .post(`/faturas/${id}/comprovante/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => res.data);
    },

    obterUrlArquivoComprovante: (id) => `http://localhost:8080/api/v1/faturas/${id}/comprovante/arquivo`,

    aprovarManual: (id) => api.patch(`/faturas/${id}/aprovar`).then((res) => res.data),
    rejeitarComprovante: (id, motivo) =>
        api.patch(`/faturas/${id}/rejeitar`, null, { params: { motivo } }).then((res) => res.data),
    cancelar: (id) => api.patch(`/faturas/${id}/cancelar`).then((res) => res.data),
    simularWebhookAsaas: (fatura) =>
        api.post('/webhooks/asaas', {
            event: 'PAYMENT_RECEIVED',
            payment: {
                id: fatura.externalPaymentId || `pay_sim_${fatura.txid}`,
                customer: 'cus_sandbox',
                value: fatura.valorFinal,
                netValue: fatura.valorFinal,
                status: 'RECEIVED',
                externalReference: fatura.txid,
                billingType: 'PIX',
                paymentDate: new Date().toISOString().split('T')[0],
                clientPaymentDate: new Date().toISOString().split('T')[0],
                transactionReceiptUrl: `https://sandbox.asaas.com/comprovantes/simulado/${fatura.txid}`,
            },
        }),
};