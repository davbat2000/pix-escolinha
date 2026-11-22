import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f5] flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-[1140px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}