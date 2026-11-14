import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck, UserRound, AlertCircle } from 'lucide-react';

interface Props {
  onCreated: (user: { username: string; role: string; fullName: string }) => void;
}

export const SetupAdminPage: React.FC<Props> = ({ onCreated }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      const user = await window.notariaDesktop.bootstrapAdmin({ username, fullName, password });
      onCreated(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible crear el administrador local.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <ShieldCheck className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold text-white">Configuración inicial</h1>
            <p className="text-xs text-slate-400">Administrador local de NotariaVE</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">Cree la primera cuenta administradora. Las credenciales se verificarán exclusivamente contra la base SQLite de este equipo.</p>
        {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        <label className="block text-xs font-semibold text-slate-300">Nombre completo
          <input required minLength={3} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <label className="block text-xs font-semibold text-slate-300">Usuario local
          <span className="relative block mt-1"><UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required minLength={3} maxLength={64} pattern="[A-Za-z0-9._-]+" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-white" /></span>
        </label>
        <label className="block text-xs font-semibold text-slate-300">Contraseña (mínimo 12 caracteres)
          <span className="relative block mt-1"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input required minLength={12} maxLength={256} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-white" /></span>
        </label>
        <label className="block text-xs font-semibold text-slate-300">Confirmar contraseña
          <input required minLength={12} maxLength={256} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <button disabled={busy} className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? 'Creando administrador…' : 'Crear administrador local'}</button>
      </form>
    </main>
  );
};
