import { useState } from 'react';
import { api } from '../services/api';

export function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, senha });
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuarioNome', data.nome);
            onLoginSuccess();
        } catch {
            setErro('E-mail ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-yellow-400">Pix Escolinha</h1>
                    <p className="text-sm text-zinc-400">Acesso Administrativo</p>
                </div>

                {erro && <p className="text-sm text-red-400 bg-red-950/50 p-2 rounded text-center">{erro}</p>}

                <div>
                    <label className="block text-sm text-zinc-300 mb-1">E-mail</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder="admin@pixescolinha.com"
                    />
                </div>

                <div>
                    <label className="block text-sm text-zinc-300 mb-1">Senha</label>
                    <input
                        type="password"
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}