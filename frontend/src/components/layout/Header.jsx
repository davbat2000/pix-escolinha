import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ShieldCheck } from 'lucide-react';

const TITULOS_PAGINA = {
    '/': 'Painel de Conciliação Financeira',
    '/faturas': 'Emissão de Faturas e Cobranças Pix',
    '/relatorios': 'Relatórios, Projeções e BI Financeiro',
    '/alunos': 'Diretório de Alunos Matriculados',
    '/alunos/novo': 'Nova Matrícula e Vínculo de Bolsa',
    '/turmas': 'Gestão de Turmas e Mensalidades',
    '/responsaveis': 'Cadastro de Responsáveis Financeiros',
};

export function Header() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const titulo = TITULOS_PAGINA[pathname] || TITULOS_PAGINA['/'];
    const estaEmFaturas = pathname === '/faturas';

    return (
        <header className="h-[76px] bg-[#141416] border-b border-[#222226] px-8 flex items-center justify-between shrink-0">
            <div>
                <h1 className="text-[18px] font-extrabold text-white leading-tight">
                    {titulo}
                </h1>
                <p className="text-[12px] text-[#8e8e96] mt-0.5">
                    Controle integrado de matrículas, faturamento e recebimentos
                </p>
            </div>

            {!estaEmFaturas ? (
                <button
                    onClick={() => navigate('/faturas')}
                    className="btn-yellow flex items-center gap-2 !py-2.5 !px-4 !text-xs !rounded-lg"
                >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>Emitir Cobrança</span>
                </button>
            ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0b0b0d] border border-[#242428] text-xs text-[#a1a1aa]">
                    <ShieldCheck size={15} className="text-[#34d399]" />
                    <span>Gateway Asaas & RabbitMQ Ativos</span>
                </div>
            )}
        </header>
    );
}