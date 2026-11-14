import React, { useEffect, useState } from 'react';
type Role = 'admin' | 'abogado' | 'asistente' | 'consulta';
type UserRow = { id: string; username: string; fullName: string; role: Role; active: boolean; createdAt: string; updatedAt: string };
const roles: Array<{ value: Role; label: string }> = [
  { value: 'admin', label: 'Administrador' }, { value: 'abogado', label: 'Abogado' },
  { value: 'asistente', label: 'Asistente' }, { value: 'consulta', label: 'Solo consulta' },
];
export const UserAdministration: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('abogado');
  const [password, setPassword] = useState('');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const refresh = async () => setUsers(await window.notariaDesktop.listUsers());
  useEffect(() => { void refresh().catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar usuarios.')); }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await window.notariaDesktop.createUser({ username, fullName, role, password });
      setUsername(''); setFullName(''); setPassword(''); setRole('abogado');
      await refresh(); setNotice('Usuario local creado correctamente.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo crear el usuario.'); }
    finally { setBusy(false); }
  };
  const update = async (user: UserRow, patch: { role?: Role; active?: boolean; password?: string }) => {
    setBusy(true); setError(''); setNotice('');
    try {
      await window.notariaDesktop.updateUser({ id: user.id, ...patch });
      setResetPasswords((prev) => ({ ...prev, [user.id]: '' }));
      await refresh(); setNotice('Cambios guardados para ' + user.username + '.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar el usuario.'); }
    finally { setBusy(false); }
  };
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios y permisos locales</h1><p className="text-sm text-slate-500 mt-1">Las cuentas, contraseñas, roles y estados se almacenan exclusivamente en SQLite en este equipo.</p></div>
    <form onSubmit={create} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Usuario<input required minLength={3} maxLength={64} value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm" /></label>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nombre completo<input required minLength={3} maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm" /></label>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Perfil<select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm">{roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Contraseña inicial (mín. 12)<input required type="password" minLength={12} maxLength={256} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm" /></label>
      <div className="flex items-end"><button disabled={busy} className="w-full rounded-lg bg-blue-600 text-white font-bold text-sm p-2 disabled:opacity-50">Crear usuario</button></div>
    </form>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">Cuentas registradas ({users.length})</div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {users.map((user) => <div key={user.id} className="p-4 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr_1.5fr_auto] gap-3 items-end">
          <div><div className="font-semibold text-sm">{user.fullName}</div><div className="text-xs text-slate-500">@{user.username} · {user.active ? 'Activa' : 'Desactivada'}</div></div>
          <label className="text-xs text-slate-500">Perfil<select disabled={busy} value={user.role} onChange={(e) => void update(user, { role: e.target.value as Role })} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm text-slate-900 dark:text-white">{roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
          <label className="text-xs text-slate-500">Nueva contraseña<input type="password" minLength={12} maxLength={256} placeholder="Opcional, mín. 12" value={resetPasswords[user.id] || ''} onChange={(e) => setResetPasswords((prev) => ({ ...prev, [user.id]: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm" /></label>
          <div className="text-[11px] text-slate-500">Creado: {new Date(user.createdAt).toLocaleDateString()}</div>
          <div className="flex gap-2"><button disabled={busy || !(resetPasswords[user.id] || '').trim()} onClick={() => void update(user, { password: resetPasswords[user.id] })} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Restablecer</button><button disabled={busy} onClick={() => void update(user, { active: !user.active })} className={`rounded-lg px-3 py-2 text-xs font-semibold ${user.active ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.active ? 'Desactivar' : 'Activar'}</button></div>
        </div>)}
      </div>
    </div>
    <p className="text-xs text-slate-500">Los permisos se verifican en Electron, no solo en la interfaz. Administrador: control total. Abogado: clientes, expedientes y perfil profesional. Asistente: captura y edición de clientes/expedientes. Solo consulta: lectura sin cambios.</p>
  </section>;
};
