import React, { useState } from 'react';
import { Sparkles, X, Check, Loader2, BookOpen, AlertCircle } from 'lucide-react';

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

export const AiClauseModal: React.FC<AiClauseModalProps> = ({
  isOpen,
  onClose,
  documentType,
  notaryState,
  onInsertClause,
}) => {
  const [prompt, setPrompt] = useState('');
  const [currentClause, setCurrentClause] = useState('');
  const [generatedClause, setGeneratedClause] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError('La IA externa está deshabilitada en la edición de escritorio. El texto del documento no se envía a servicios externos.');
  };

  const handleInsert = () => {
    if (generatedClause) {
      onInsertClause(generatedClause);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Asistente de Redacción Jurídica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La integración externa está desactivada; no se transmiten documentos ni datos personales.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Quick preset suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              Sugerencias de cláusulas frecuentes:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="text-left text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* User Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ¿Qué cláusula o estipulación especial deseas redactar o adaptar?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ej: Redacta una cláusula de arras confirmatorias por el 20% del precio total de venta con penalidad del doble si el vendedor se retracta..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Optional context */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Texto base o cláusula previa (opcional, para reformular o robustecer):
            </label>
            <textarea
              value={currentClause}
              onChange={(e) => setCurrentClause(e.target.value)}
              rows={2}
              placeholder="Pega aquí una cláusula existente si deseas mejorar su terminología forense..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={true}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redactando con lenguaje forense...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>IA externa deshabilitada</span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Result */}
          {generatedClause && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Propuesta de Redacción Notarial:
                </span>
                <span className="text-xs text-slate-500">
                  Lista para insertar en el documento
                </span>
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all">
                {generatedClause}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!generatedClause}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Insertar en el Borrador</span>
          </button>
        </div>
      </div>
    </div>
  );
};
