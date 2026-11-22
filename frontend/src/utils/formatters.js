export const formatarMoeda = (valor) => {
    const numero = Number(valor || 0);
    return numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const formatarCPF = (valor = '') => {
    const limpo = valor.replace(/\D/g, '').slice(0, 11);
    return limpo
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatarWhatsapp = (valor = '') => {
    const limpo = valor.replace(/\D/g, '').slice(0, 13);
    if (limpo.length <= 2) return limpo;
    if (limpo.length <= 4) return `+${limpo.slice(0, 2)} (${limpo.slice(2)}`;
    if (limpo.length <= 9) return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4)}`;
    return `+${limpo.slice(0, 2)} (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9, 13)}`;
};

export const limparDigitos = (valor = '') => valor.replace(/\D/g, '');

export const resumirTxid = (txid = '') => {
    if (!txid || txid.length <= 14) return txid;
    return `${txid.slice(0, 6)}...${txid.slice(-4)}`;
};

export const calcularDataVencimento = (ano, mes, diaPadrao = 10) => {
    const anoNum = Number(ano) || new Date().getFullYear();
    const mesNum = Number(mes) || new Date().getMonth() + 1;
    const ultimoDiaDoMes = new Date(anoNum, mesNum, 0).getDate();
    const diaValido = Math.min(Math.max(1, Number(diaPadrao) || 10), ultimoDiaDoMes);

    const mesStr = String(mesNum).padStart(2, '0');
    const diaStr = String(diaValido).padStart(2, '0');
    return `${anoNum}-${mesStr}-${diaStr}`;
};