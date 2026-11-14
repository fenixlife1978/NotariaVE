import React from 'react';
import { Scale, FileText, Calculator, Users, Settings, Plus, LogOut, User } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'calculator' | 'clients' | 'settings';
  setActiveTab: (tab: 'editor' | 'calculator' | 'clients' | 'settings') => void;
  onNewDocument: () => void;
  bcvRate: number;
  currentUser?: { username: string; role: string; fullName: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewDocument,
  bcvRate,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <button
              onClick={() => setActiveTab('editor')}
              className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
            >
              MVP Notaría VE
            </button>
          </div>

          {/* Zone 2: 4 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'editor'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Redactor de Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora de Aranceles</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Directorio de Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Criterios Notariales SAREN</span>
            </button>
          </nav>

          {/* Zone 3: Actions & User Session */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">TASA BCV:</span>
              <span className="text-emerald-400 font-semibold tabular-nums">{bcvRate > 0 ? `${bcvRate.toFixed(2)} Bs/import React from 'react';
import { Scale, FileText, Calculator, Users, Settings, Plus, LogOut, User } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'calculator' | 'clients' | 'settings';
  setActiveTab: (tab: 'editor' | 'calculator' | 'clients' | 'settings') => void;
  onNewDocument: () => void;
  bcvRate: number;
  currentUser?: { username: string; role: string; fullName: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewDocument,
  bcvRate,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <button
              onClick={() => setActiveTab('editor')}
              className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
            >
              MVP Notaría VE
            </button>
          </div>

          {/* Zone 2: 4 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'editor'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Redactor de Documentos</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora de Aranceles</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Directorio de Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Criterios Notariales SAREN</span>
            </button>
          </nav>

          {/* Zone 3: Actions & User Session */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">TASA BCV:</span>
               : 'Sin registrar'}</span>
            </div>

            <button
              onClick={onNewDocument}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Doc</span>
            </button>

            {/* Current user & Logout button */}
            {currentUser && onLogout && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden xl:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-amber-400">
                    {currentUser.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
