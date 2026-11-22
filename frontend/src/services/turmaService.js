import { api } from './api';

export const turmaService = {
    listarTodas: () => api.get('/turmas').then((res) => res.data),
    buscarPorId: (id) => api.get(`/turmas/${id}`).then((res) => res.data),
    criar: (payload) => api.post('/turmas', payload).then((res) => res.data),
};