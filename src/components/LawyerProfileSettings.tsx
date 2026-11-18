import React, { useEffect, useState } from 'react';
import { LawyerProfile } from '../types/legal';

export const LawyerProfileSettings: React.FC<{
  lawyer: LawyerProfile;
  onSave: (value: LawyerProfile) => Promise<void>;
}> = ({ lawyer, onSave }) => {
  const [value, setValue] = useState<LawyerProfile>(lawyer);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => setValue(lawyer), [lawyer]);
  const update = (key: keyof LawyerProfile, next: string) => setValue(previous => ({ ...previous, [key]: next }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setNotice(''); setError('');
    try { await onSave(value); setNotice('Perfil profesional guardado en SQLite local.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil profesional.'); }
    finally { setBusy(false); }
  };
  const fields: Array<{ key: keyof LawyerProfile; label: string; required?: boolean }> = [
    { key: 'fullName', label: 'Nombre completo', required: true },
    { key: 'inpreabogado', label: 'Número INPREABOGADO', required: true },
    { key: 'barAssociationState', label: 'Colegio de Abogados / Estado' },
    { key: 'barRegNumber', label: 'Número de matrícula colegiada' },
    { key: 'officeAddress', label: 'Domicilio profesional' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo electrónico' },
  ];
  return <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi perfil profesional</h1><p className="mt-1 text-sm text-slate-500">Estos datos se incorporan a los documentos que generan el visado profesional. Se guardan únicamente en la base SQLite de este equipo.</p></div>
    <form onSubmit={submit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(field => <label key={field.key} className={"block text-xs font-semibold text-slate-600 dark:text-slate-300 " + (field.key === 'officeAddress' ? 'md:col-span-2' : '')}>
        {field.label}
        <input required={field.required} type={field.key === 'email' ? 'email' : 'text'} value={value[field.key]} onChange={event => update(field.key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white" />
      </label>)}
      {error && <p role="alert" className="md:col-span-2 text-sm text-rose-600">{error}</p>}
      {notice && <p role="status" className="md:col-span-2 text-sm text-emerald-600">{notice}</p>}
      <div className="md:col-span-2 flex justify-end"><button disabled={busy} className="rounded-lg bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar perfil profesional'}</button></div>
    </form>
  </section>;
};
