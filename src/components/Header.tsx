import React from 'react';
import { Scale, FileText, Calculator, Users, Settings, Plus, LogOut, ShieldCheck } from 'lucide-react';

type Tab = 'editor' | 'calculator' | 'clients' | 'settings' | 'users';
interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onNewDocument: () => void;
  bcvRate: number;
  currentUser?: { username: string; role: string; fullName: string } | null;
  onLogout?: () => void;
}
export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onNewDocument, bcvRate, currentUser, onLogout }) => {
  const admin = currentUser?.role === 'admin';
  const nav: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'editor', label: 'Redactor', icon: <FileText className="w-4 h-4" /> },
    { id: 'calculator', label: 'Aranceles', icon: <Calculator className="w-4 h-4" /> },
    { id: 'clients', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    ...(admin ? [{ id: 'settings' as Tab, label: 'Configuración', icon: <Settings className="w-4 h-4" /> }, { id: 'users' as Tab, label: 'Usuarios', icon: <ShieldCheck className="w-4 h-4" /> }] : []),
  ];
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 min-h-16 py-2">
          <button onClick={() => setActiveTab('editor')} className="flex items-center gap-3 shrink-0 text-lg font-bold tracking-tight hover:text-amber-400">
            <span className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400"><Scale className="w-5 h-5" /></span>
            <span className="hidden sm:inline">NotariaVE</span>
          </button>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm font-medium">
            {nav.map((item) => <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors ${activeTab === item.id ? 'text-amber-400 border-b-2 border-amber-400 font-semibold' : 'text-slate-300 hover:text-white'}`}>{item.icon}<span>{item.label}</span></button>)}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono"><span>TASA BCV:</span><span className="text-emerald-400 font-semibold">{bcvRate > 0 ? `${bcvRate.toFixed(2)} Bs/$` : 'Sin registrar'}</span></div>
            <button onClick={onNewDocument} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg whitespace-nowrap"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo</span></button>
            {currentUser && onLogout && <div className="flex items-center gap-2 pl-2 border-l border-slate-700"><span className="hidden lg:block text-right text-xs"><strong className="block text-slate-200">{currentUser.fullName}</strong><span className="text-amber-400">{currentUser.username}</span></span><button onClick={onLogout} title="Cerrar sesión" className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 border border-slate-700 text-xs"><LogOut className="w-4 h-4" /></button></div>}
          </div>
        </div>
      </div>
    </header>
  );
};
