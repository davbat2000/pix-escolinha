import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutGrid,
    DollarSign,
    BarChart3,
    GraduationCap,
    UserPlus,
    BookOpen,
    Users,
    QrCode
} from 'lucide-react';

const ITENS_MENU = [
    { to: '/', label: 'Visão Geral', icon: LayoutGrid, end: true },
    { to: '/faturas', label: 'Emitir Cobranças Pix', icon: DollarSign },
    { to: '/relatorios', label: 'Relatórios & BI Financeiro', icon: BarChart3 },
    { to: '/alunos', label: 'Alunos Matriculados', icon: GraduationCap, end: true },
    { to: '/alunos/novo', label: 'Nova Matrícula', icon: UserPlus },
    { to: '/turmas', label: 'Turmas & Mensalidades', icon: BookOpen },
    { to: '/responsaveis', label: 'Responsáveis Financeiros', icon: Users },
];

export function Sidebar() {
    return (
        <aside className="w-[248px] bg-[#141416] border-r border-[#222226] flex flex-col justify-between shrink-0 select-none">
            <div>
                {/* Topo com Logo */}
                <div className="h-[76px] px-5 flex items-center gap-3 border-b border-[#222226]">
                    <div className="w-10 h-10 rounded-xl bg-[#f5c518] text-[#0a0a0c] flex items-center justify-center shadow-md">
                        <QrCode size={22} strokeWidth={2.4} />
                    </div>
                    <div>
                        <div className="text-[15px] font-black tracking-tight leading-none">
                            <span className="text-white">PIX </span>
                            <span className="text-[#f5c518]">ESCOLINHA</span>
                        </div>
                        <span className="text-[11px] text-[#8e8e96] block mt-1">
              Gestão Financeira Escolar
            </span>
                    </div>
                </div>

                {/* Links de Navegação */}
                <nav className="p-3.5 space-y-1.5 mt-2">
                    {ITENS_MENU.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                                        isActive
                                            ? 'bg-[#f5c518] text-[#0a0a0c] shadow-sm'
                                            : 'text-[#9ca3af] hover:bg-[#1c1c20] hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={17} strokeWidth={2.1} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Card Inferior: Conciliação em Tempo Real */}
            <div className="p-3.5">
                <div className="bg-[#0b0b0d] border border-[#222226] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#f5c518]" />
                        <span className="text-[11px] font-bold text-white">
              Conciliação em Tempo Real
            </span>
                    </div>
                    <p className="text-[11px] text-[#71717a] leading-relaxed">
                        Pagamentos via QR Code Pix são compensados automaticamente.
                    </p>
                </div>
            </div>
        </aside>
    );
}