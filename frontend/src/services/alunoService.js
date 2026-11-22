import { api } from './api';

export const alunoService = {
    listarTodos: () => api.get('/alunos').then((res) => res.data),
    buscarPorId: (id) => api.get(`/alunos/${id}`).then((res) => res.data),
    cadastrar: (payload) => api.post('/alunos', payload).then((res) => res.data),
    atualizar: (id, payload) => api.put(`/alunos/${id}`, payload).then((res) => res.data),
    alternarStatus: (id) => api.patch(`/alunos/${id}/status`).then((res) => res.data),
    matricularEmNovaTurma: (id, payload) =>
        api.post(`/alunos/${id}/matriculas`, payload).then((res) => res.data),
    atualizarBolsa: (id, turmaId, porcentagemBolsa) =>
        api.patch(`/alunos/${id}/matriculas/${turmaId}/bolsa`, { porcentagemBolsa }).then((res) => res.data),
    desmatricularDeTurma: (id, turmaId) =>
        api.delete(`/alunos/${id}/matriculas/${turmaId}`).then((res) => res.data),
};