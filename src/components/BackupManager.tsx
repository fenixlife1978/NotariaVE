import React, { useState } from 'react';
import { Archive, Download, RefreshCw, ShieldCheck } from 'lucide-react';

type BackupResult = { canceled: boolean; fileName?: string; sha256?: string; createdAt?: string; counts?: Record<string, number> };
type RestoreResult = { canceled: boolean; restored?: boolean; fileName?: string; safetyBackup?: string; counts?: Record<string, number> };

export const BackupManager: React.FC = () => {
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createBackup = async () => {
    setBusy('backup'); setMessage(''); setError('');
    try {
      const result: BackupResult = await window.notariaDesktop.createBackup();
      if (!result.canceled && result.fileName) setMessage('Respaldo creado y verificado: ' + result.fileName + '. SHA-256: ' + result.sha256);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el respaldo.');
    } finally { setBusy(null); }
  };

  const restoreBackup = async () => {
    if (!window.confirm('La restauración reemplazará los datos actuales por los del respaldo seleccionado. Antes se creará una copia de seguridad automática del estado actual. ¿Desea continuar?')) return;
    setBusy('restore'); setMessage(''); setError('');
    try {
      const result: RestoreResult = await window.notariaDesktop.restoreBackup();
      if (result.restored) setMessage('Respaldo verificado: ' + result.fileName + '. Se conservó una copia previa: ' + result.safetyBackup + '. La aplicación volverá a solicitar inicio de sesión.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restaurar el respaldo. La base anterior se conserva.');
    } finally { setBusy(null); }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Archive className="w-5 h-5" /></div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Copias de seguridad locales</h2>
          <p className="text-xs text-slate-500 mt-1">La copia se guarda donde usted elija. No se envía a Internet ni a ningún servicio en la nube.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={createBackup} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-bold">
          <Download className="w-4 h-4" /> {busy === 'backup' ? 'Creando y verificando…' : 'Crear respaldo'}
        </button>
        <button type="button" onClick={restoreBackup} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-800 dark:text-amber-300 px-3.5 py-2 text-xs font-bold">
          <RefreshCw className="w-4 h-4" /> {busy === 'restore' ? 'Verificando y restaurando…' : 'Restaurar respaldo'}
        </button>
      </div>
      {message && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300 flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0" />{message}</p>}
      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
      <p className="text-[11px] text-slate-500">Cada respaldo incluye manifiesto y huella SHA-256. Antes de restaurar se valida la integridad y se crea automáticamente una copia del estado actual.</p>
    </section>
  );
};
