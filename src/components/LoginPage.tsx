import React, { useState } from 'react';
import {
  Scale,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Code2,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: { username: string; role: string; fullName: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Ingrese su usuario y contraseña local.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await window.notariaDesktop.login({ username: username.trim(), password });
      onLogin(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible verificar el acceso local.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* ------------------------------------------------------------- */}
      {/* LOGO DE LA BALANZA GRANDE DE FONDO CENTRADO (LARGE WATERMARK)   */}
      {/* ------------------------------------------------------------- */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Subtle radial glow */}
        <div className="absolute w-[650px] h-[650px] rounded-full bg-amber-500/5 blur-3xl animate-pulse" />
        <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-600/5 blur-3xl" />

        {/* Big centered juridical scale SVG illustration */}
        <svg
          className="w-[580px] h-[580px] md:w-[720px] md:h-[720px] text-amber-500/10 dark:text-amber-400/[0.07] transition-all transform scale-105"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main vertical mast & base */}
          <path d="M12 2v20" strokeWidth="1.2" />
          <path d="M7 22h10" strokeWidth="1.5" />
          <path d="M9 20h6" strokeWidth="1.5" />
          <circle cx="12" cy="3" r="1.5" fill="currentColor" fillOpacity="0.4" />

          {/* Top horizontal beam */}
          <path d="M3 7h18" strokeWidth="1.4" />

          {/* Left balance pan */}
          <path d="M5 7l-3 7h6l-3-7z" strokeWidth="1" />
          <path d="M2 14c0 2 1.34 3.5 3 3.5s3-1.5 3-3.5H2z" fill="currentColor" fillOpacity="0.08" />

          {/* Right balance pan */}
          <path d="M19 7l-3 7h6l-3-7z" strokeWidth="1" />
          <path d="M16 14c0 2 1.34 3.5 3 3.5s3-1.5 3-3.5h-6z" fill="currentColor" fillOpacity="0.08" />

          {/* Decorative juridical rings */}
          <circle cx="12" cy="12" r="9" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="12" cy="12" r="11" strokeWidth="0.3" opacity="0.3" />
        </svg>
      </div>

      {/* Top Bar Branding */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block">
              MVP Notaría VE
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Gestor Notarial y Registral SAREN
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Servicio Activo para Notarías de Venezuela</span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card Box */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

            {/* Header info */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceso Forense Protegido</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Ingrese con sus credenciales autorizadas para gestionar documentos notariales y calcular aranceles SAREN.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* INPUT: USUARIO */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Usuario / Cédula / Correo:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario creado en este equipo"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* INPUT: CONTRASEÑA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                    Contraseña:
                  </label>
                  <span className="text-[11px] text-amber-400/80 hover:text-amber-300 cursor-pointer transition-colors">
                    Verificación local SQLite
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Verificando Acceso...' : 'Ingresar a NotariaVE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>


          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* LOGO ORIGINAL DE EFAS FREELANCER RIF: J-13313521-5 (FOOTER)   */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-sm py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Developer identity block with original custom logo */}
          <div className="flex items-center gap-3">
            {/* Custom geometric logo badge for Efas Freelancer */}
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
              {/* Original EF Monogram Vector Emblem */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xs tracking-tighter shrink-0 border border-cyan-400/30">
                <span className="font-mono text-sm leading-none">EF</span>
              </div>

              {/* Developer details */}
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Desarrollador del Sistema:
                  </span>
                  <span className="text-white font-bold text-xs tracking-wide">
                    Efas Freelancer
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[10px] font-bold">
                    RIF: J-13313521-5
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    · Soluciones de Software Jurídico
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal jurisdiction notice */}
          <div className="text-slate-400 text-center md:text-right text-[11px] leading-relaxed">
            <div>Plataforma ajustada a las leyes, decretos y gacetas de la República Bolivariana de Venezuela</div>
            <div className="text-slate-400 text-[10px]">
              Ley de Registro Público y del Notariado (LRPN) · Código Civil · Código de Comercio
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
