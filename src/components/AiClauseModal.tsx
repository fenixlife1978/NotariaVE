import React, { useEffect, useState } from 'react';
import { Sparkles, X, Check, Loader2, BookOpen, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';

interface AiClauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  notaryState: string;
  onInsertClause: (clauseText: string) => void;
}

const PRESET_PROMPTS = [
  'Redactar cláusula de Reserva de Dominio para venta a crédito con 4 cuotas mensuales.',
  'Redactar cláusula penal de indemnización por incumplimiento o demora en la entrega.',
  'Redactar cláusula de arbitraje comercial ante el Centro de Arbitraje de la Cámara de Caracas (CACC).',
  'Ampliar el objeto social para actividades de tecnología, telecomunicaciones y desarrollo de software.',
  'Redactar cláusula para Poder Notarial con facultades expresas de movilización de cuentas bancarias en divisas.',
  'Redactar cláusula de saneamiento estricto por evicción y vicios ocultos según el Código Civil.',
];

export const AiClauseModal: React.FC<AiClauseModalProps> = ({ isOpen, onClose, documentType, notaryState, onInsertClause }) => {
  const [prompt, setPrompt] = useState('');
  const [currentClause, setCurrentClause] = useState('');
  const [generatedClause, setGeneratedClause] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setGeneratedClause('');
    setConsent(false);
    window.notariaDesktop.getAiStatus()
      .then(status => { setConfigured(status.configured); setShowKeySetup(!status.configured); })
      .catch(err => setError(err instanceof Error ? err.message : 'No se pudo verificar la configuración de IA.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = async () => {
    setError(null); setSavingKey(true);
    try {
      await window.notariaDesktop.saveAiKey(apiKey);
      setConfigured(true); setShowKeySetup(false); setApiKey('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la API key.'); }
    finally { setSavingKey(false); }
  };

  const handleRemoveKey = async () => {
    setError(null);
    try { await window.notariaDesktop.clearAiKey(); setConfigured(false); setShowKeySetup(true); setGeneratedClause(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo retirar la API key.'); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Escribe qué cláusula necesitas.'); return; }
    if (!consent) { setError('Marca la autorización para enviar este texto a Gemini antes de generar.'); return; }
    setIsLoading(true); setError(null); setGeneratedClause('');
    try {
      const result = await window.notariaDesktop.generateAiClause({ prompt, currentClause, context: `Documento: ${documentType}; estado/jurisdicción: ${notaryState}`, consent });
      setGeneratedClause(result.text);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo generar la propuesta.'); }
    finally { setIsLoading(false); }
  };

  const handleInsert = () => { if (generatedClause.trim()) { onInsertClause(generatedClause); onClose(); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Asistente de Redacción Jurídica · Gemini</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{configured ? 'Proveedor configurado; envío externo requiere autorización.' : 'Configura una API key gratuita de Google AI Studio para activar la redacción.'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {!configured || showKeySetup ? (
            <section className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2"><KeyRound className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" /><div><strong>Configurar Gemini (API gratuita, con cuota y límites)</strong><p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Obtén tu API key en Google AI Studio. Se cifra y guarda en SQLite local mediante el cifrado del sistema operativo; no se muestra ni se envía al repositorio.</p></div></div>
              <input type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Pega aquí tu API key de Gemini" className="w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-2"><button type="button" onClick={handleSaveKey} disabled={!apiKey.trim() || savingKey} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{savingKey ? 'Guardando…' : 'Guardar clave cifrada'}</button>{configured && <button type="button" onClick={() => setShowKeySetup(false)} className="rounded-lg border px-3 py-2 text-xs">Cancelar cambio</button>}</div>
              <p className="text-xs"><a className="text-blue-600 underline" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Abrir Google AI Studio para obtener una API key</a></p>
            </section>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs"><span className="text-emerald-700 dark:text-emerald-300">Gemini configurado · clave almacenada cifrada localmente</span><div className="flex gap-2"><button type="button" onClick={() => setShowKeySetup(true)} className="underline">Cambiar</button><button type="button" onClick={handleRemoveKey} className="underline text-rose-600">Eliminar</button></div></div>
          )}

          <div><label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Sugerencias frecuentes:</label><div className="flex flex-wrap gap-1.5">{PRESET_PROMPTS.map((preset, idx) => <button key={idx} type="button" onClick={() => setPrompt(preset)} className="text-left text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200">{preset}</button>)}</div></div>
          <div><label className="block text-xs font-semibold mb-1">¿Qué cláusula o estipulación deseas redactar o adaptar?</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="Describe la cláusula, condiciones, partes, obligaciones y supuestos que deseas cubrir…" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100" /></div>
          <div><label className="block text-xs font-semibold mb-1">Texto base o cláusula previa (opcional):</label><textarea value={currentClause} onChange={e => setCurrentClause(e.target.value)} rows={3} placeholder="Pega aquí el texto que deseas reformular…" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100" /></div>
          <div className="rounded-md border border-rose-300 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-800 dark:text-rose-200"><strong>Privacidad de la cuota gratuita:</strong> Google indica que el contenido del nivel gratuito puede utilizarse para mejorar sus productos. No envíes datos identificativos, documentos íntegros, claves ni información confidencial; usa texto anonimizado y revisa las condiciones de Google antes de activarlo.</div>
          <label className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3 text-xs"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" /><span><strong>Autorizo el envío de los textos que he escrito arriba a Google Gemini.</strong> No pegues datos personales sensibles ni documentos completos si no es necesario. La respuesta es un borrador y debe revisarse jurídicamente.</span></label>
          <div className="flex justify-end"><button type="button" onClick={handleGenerate} disabled={!configured || isLoading || !consent || !prompt.trim()} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs disabled:opacity-50">{isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generando propuesta…</> : <><Sparkles className="w-4 h-4" />Redactar con Gemini</>}</button></div>
          {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          {generatedClause && <section className="space-y-2"><div className="flex items-center gap-1 text-xs font-bold uppercase"><ShieldAlert className="w-4 h-4 text-amber-500" />Borrador generado — verificar normas y citas</div><div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all">{generatedClause}</div></section>}
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 dark:bg-slate-950"><button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium">Cancelar</button><button type="button" onClick={handleInsert} disabled={!generatedClause} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs disabled:opacity-50"><Check className="w-4 h-4" />Insertar en el Borrador</button></div>
      </div>
    </div>
  );
};
