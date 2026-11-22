import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FaturasPage } from './pages/FaturasPage';
import { AlunosPage } from './pages/AlunosPage';
import { NovoAlunoPage } from './pages/NovoAlunoPage';
import { TurmasPage } from './pages/TurmasPage';
import { ResponsaveisPage } from './pages/ResponsaveisPage';
import { RelatoriosPage } from './pages/RelatoriosPage';

export default function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/faturas" element={<FaturasPage />} />
                        <Route path="/relatorios" element={<RelatoriosPage />} />
                        <Route path="/alunos" element={<AlunosPage />} />
                        <Route path="/alunos/novo" element={<NovoAlunoPage />} />
                        <Route path="/turmas" element={<TurmasPage />} />
                        <Route path="/responsaveis" element={<ResponsaveisPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}