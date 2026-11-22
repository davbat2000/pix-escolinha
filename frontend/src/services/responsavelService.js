import { api } from './api';

export const responsavelService = {
    listarTodos: () => api.get('/responsaveis').then((res) => res.data),
    criar: (payload) => api.post('/responsaveis', payload).then((res) => res.data),
};