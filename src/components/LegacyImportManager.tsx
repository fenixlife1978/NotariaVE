import React, { useState } from 'react';
import { FileUp, ShieldCheck, AlertTriangle, Users } from 'lucide-react';

type Preview = {
  token: string; fileName: string; clientsCount: number; suspectedDemoClients: number;
  hasLawyer: boolean; suspectedDemoLawyer: boolean; hasCriteria: boolean; suspectedDemoCriteria: boolean;
};
type ImportResult = {
  fileName: string; importedClients: number; skippedDuplicates: number; skippedDemoClients: number;
  lawyerImported: boolean; lawyerSkippedDemo: boolean; criteriaImported: boolean; criteriaSkippedDemo: boolean;
};

export const LegacyImportManager: React.FC<{ onImported: () => Promise<void> }> = ({ onImported }) => {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [includeDemoRecords, setIncludeDemoRecords] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectFile = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await window.notariaDesktop.selectLegacyImport();
      if (!result.canceled && result.token && result.fileName) {
        setPreview(result as Preview);
        setIncludeDemoRecords(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo revisar el archivo.');
    } finally { setBusy(false); }
  };

  const importData = async () => {
    if (!preview) return;
    const demoChoice = includeDemoRecords ? 'Se incluirán también los registros de demostración detectados porque usted lo ha marcado.' : 'Los registros de demostración conocidos se omitirán.';
    const accepted = window.confirm('Se importarán los clientes que no estén duplicados. El perfil profesional y los criterios SAREN del archivo reemplazarán la configuración local actual si existen. ' + demoChoice + ' La sesión antigua no se importa y no se borrarán datos existentes. ¿Desea continuar?');
    if (!accepted) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result: ImportResult = await window.notariaDesktop.importLegacyData(preview.token, { includeDemoRecords });
      await onImported();
      setPreview(null);
      setMessage('Migración completada: ' + result.importedClients + ' clientes importados; ' + result.skippedDuplicates + ' duplicados omitidos; ' + result.skippedDemoClients + ' clientes de demostración omitidos. ' + (result.lawyerImported ? 'Perfil profesional importado. ' : '') + (result.criteriaImported ? 'Criterios notariales importados.' : ''));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo importar el archivo.');
    } finally { setBusy(false); }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Migrar datos del NotariaVE anterior</h2>
          <p className="text-xs text-slate-500 mt-1">Importa clientes, perfil profesional y criterios desde un archivo exportado en el navegador anterior. La sesión y contraseña antiguas no se importan.</p>
        </div>
      </div>
      <button type="button" onClick={selectFile} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 text-blue-800 dark:text-blue-300 px-3.5 py-2 text-xs font-bold">
        <FileUp className="w-4 h-4" /> {busy ? 'Procesando…' : 'Seleccionar archivo de exportación'}
      </button>
      {preview && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{preview.fileName}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="rounded bg-slate-50 dark:bg-slate-950 p-2"><strong>{preview.clientsCount}</strong><span className="block text-slate-500">Clientes encontrados</span></div>
            <div className="rounded bg-slate-50 dark:bg-slate-950 p-2"><strong>{preview.hasLawyer ? 'Sí' : 'No'}</strong><span className="block text-slate-500">Perfil profesional</span></div>
            <div className="rounded bg-slate-50 dark:bg-slate-950 p-2"><strong>{preview.hasCriteria ? 'Sí' : 'No'}</strong><span className="block text-slate-500">Criterios SAREN</span></div>
            <div className="rounded bg-slate-50 dark:bg-slate-950 p-2"><strong>{preview.suspectedDemoClients}</strong><span className="block text-slate-500">Clientes demo detectados</span></div>
          </div>
          {(preview.suspectedDemoClients > 0 || preview.suspectedDemoLawyer || preview.suspectedDemoCriteria) && <p className="text-xs text-amber-700 dark:text-amber-300 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />Se detectaron valores de demostración conocidos; {includeDemoRecords ? 'se incluirán porque usted lo autorizó.' : 'se omitirán para no incorporarlos como datos profesionales.'}</p>}
          <p className="text-[11px] text-slate-500">Los clientes duplicados se omiten sin sobrescribir los registros locales. Los datos nuevos se importan en una transacción SQLite y quedan registrados en la auditoría.</p>
          {(preview.suspectedDemoClients > 0 || preview.suspectedDemoLawyer || preview.suspectedDemoCriteria) && (
            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={includeDemoRecords} onChange={(event) => setIncludeDemoRecords(event.target.checked)} className="mt-0.5" />
              <span>Incluir también los valores de demostración detectados. Márquelo solo si reconoce que esos registros contienen información suya modificada.</span>
            </label>
          )}
          <button type="button" onClick={importData} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-bold"><ShieldCheck className="w-4 h-4" /> Confirmar importación a SQLite</button>
        </div>
      )}
      {message && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
    </section>
  );
};
