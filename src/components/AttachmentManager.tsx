import React, { useEffect, useState } from 'react';
type Attachment = { id: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string; createdAt: string };
type Option = { id: string; title: string };
export const AttachmentManager: React.FC<{ documents: Option[]; clients: Option[]; role: string }> = ({ documents, clients, role }) => {
  const [entityType, setEntityType] = useState<'document' | 'client'>('document');
  const [entityId, setEntityId] = useState('');
  const [items, setItems] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const canAdd = ['admin', 'abogado', 'asistente'].includes(role);
  const canDelete = ['admin', 'abogado'].includes(role);
  const options = entityType === 'document' ? documents : clients.map((c) => ({ ...c, title: c.title }));
  useEffect(() => { setEntityId(options[0]?.id || ''); }, [entityType, documents.length, clients.length]);
  const refresh = async () => {
    if (!entityId) { setItems([]); return; }
    setItems(await window.notariaDesktop.listAttachments({ entityType, entityId }));
  };
  useEffect(() => { void refresh().catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar los adjuntos.')); }, [entityType, entityId]);
  const add = async () => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await window.notariaDesktop.addAttachment({ entityType, entityId }); if (!result.canceled) setNotice('Archivo guardado dentro de SQLite y vinculado al registro.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el adjunto.'); }
    finally { setBusy(false); }
  };
  const exportFile = async (id: string) => {
    setBusy(true); setError('');
    try { const result = await window.notariaDesktop.exportAttachment(id); if (!result.canceled) setNotice('Copia exportada y verificada.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo exportar el adjunto.'); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este adjunto de la base SQLite? Esta acción no se puede deshacer.')) return;
    setBusy(true); setError('');
    try { await window.notariaDesktop.deleteAttachment(id); await refresh(); setNotice('Adjunto eliminado y acción auditada.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar el adjunto.'); }
    finally { setBusy(false); }
  };
  const bytes = (size: number) => size < 1024 ? size + ' B' : size < 1024 * 1024 ? (size / 1024).toFixed(1) + ' KB' : (size / 1024 / 1024).toFixed(1) + ' MB';
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div><h1 className="text-xl font-bold">Documentos adjuntos locales</h1><p className="text-sm text-slate-500 mt-1">Los archivos se guardan como BLOB dentro de la misma base SQLite, participan en el respaldo y no se envían a la nube. Máximo 20 MB por archivo.</p></div>
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-end">
      <label className="text-xs font-semibold">Vincular a<select value={entityType} onChange={(e) => setEntityType(e.target.value as 'document' | 'client')} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm"><option value="document">Expediente</option><option value="client">Cliente</option></select></label>
      <label className="text-xs font-semibold">Registro<select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-transparent text-sm"><option value="">Seleccione…</option>{options.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {canAdd && <button disabled={busy || !entityId} onClick={() => void add()} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-40">Adjuntar archivo</button>}
    </div>
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
      <div className="p-4 font-bold text-sm">Archivos vinculados ({items.length})</div>
      {items.map((item) => <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="font-semibold text-sm break-all">{item.originalName}</div><div className="text-xs text-slate-500">{bytes(item.sizeBytes)} · {item.mimeType} · {new Date(item.createdAt).toLocaleString()}</div><div className="text-[10px] text-slate-400 font-mono break-all">SHA-256: {item.sha256}</div></div><div className="flex gap-2"><button disabled={busy} onClick={() => void exportFile(item.id)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Exportar copia</button>{canDelete && <button disabled={busy} onClick={() => void remove(item.id)} className="rounded-lg bg-rose-100 text-rose-700 px-3 py-2 text-xs font-semibold">Eliminar</button>}</div></div>)}
      {items.length === 0 && <p className="p-6 text-sm text-slate-500 text-center">No hay archivos adjuntos para este registro.</p>}
    </div>
  </section>;
};
