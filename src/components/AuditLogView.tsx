import React, { useEffect, useState } from 'react';
type AuditEvent = { id: number; actorUsername?: string; actorFullName?: string; action: string; entityType: string; entityId?: string; details: Record<string, unknown>; createdAt: string };
export const AuditLogView: React.FC = () => {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setBusy(true); setError('');
    try { setItems(await window.notariaDesktop.listAuditEvents({ limit: 200 })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo consultar la bitácora local.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void refresh(); }, []);
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">Bitácora de auditoría</h1><p className="mt-1 text-sm text-slate-500">Historial local de accesos, cambios, importaciones, adjuntos y respaldos. Solo lectura; almacenado en SQLite.</p></div>
      <button type="button" onClick={() => void refresh()} disabled={busy} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold disabled:opacity-50">{busy ? 'Actualizando…' : 'Actualizar'}</button>
    </div>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <table className="w-full min-w-[780px] text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500"><tr><th className="p-3">Fecha y hora</th><th className="p-3">Usuario</th><th className="p-3">Acción</th><th className="p-3">Registro</th><th className="p-3">Detalles</th></tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => <tr key={item.id} className="align-top"><td className="p-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td><td className="p-3">{item.actorFullName || 'Sistema'}{item.actorUsername ? <span className="block text-slate-400">@{item.actorUsername}</span> : null}</td><td className="p-3 font-semibold">{item.action}</td><td className="p-3">{item.entityType}{item.entityId ? <span className="block text-slate-400 font-mono">{item.entityId}</span> : null}</td><td className="p-3 max-w-[340px] break-words text-slate-500">{JSON.stringify(item.details)}</td></tr>)}
        </tbody>
      </table>
      {!busy && items.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Todavía no hay eventos registrados.</p>}
      {busy && <p className="p-8 text-center text-sm text-slate-500">Consultando SQLite local…</p>}
    </div>
    <p className="text-xs text-slate-500">Se muestran los 200 eventos más recientes. La bitácora no permite editar ni eliminar registros desde la aplicación.</p>
  </section>;
};
