import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const extrairMensagemErro = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    return 'Falha de comunicação com a API (verifique se o servidor está ativo na porta 8080).';
};