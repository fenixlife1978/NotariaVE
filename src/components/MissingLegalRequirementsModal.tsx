import React from 'react';
import {
  AlertTriangle,
  Lock,
  X,
  CheckCircle2,
  FileCheck2,
  Scale,
  UserCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { MinimumLegalValidationResult, MinimumLegalCheck } from '../utils/sarenRejectionRules';
import { ClientParty } from '../types/legal';

interface MissingLegalRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  validation: MinimumLegalValidationResult;
  clients: ClientParty[];
  onSelectGrantor: (clientId: string) => void;
  onSelectGrantee: (clientId: string) => void;
  onScrollToSection?: (section: string) => void;
}

export const MissingLegalRequirementsModal: React.FC<MissingLegalRequirementsModalProps> = ({
  isOpen,
  onClose,
  validation,
  clients,
  onSelectGrantor,
  onSelectGrantee,
  onScrollToSection,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/60 dark:bg-rose-950/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600/10 text-rose-700 dark:text-rose-400 border border-rose-600/20">
                  Generación Final Bloqueada
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {validation.failedCount} de {validation.totalChecks} requisitos incompletos
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Validación de Requisitos Mínimos de Ley
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Para prevenir el rechazo inmediato ante el Notario o Registrador (Art. 44 LRPN), el documento debe cumplir todos los campos de identidad y de fondo antes de ser emitido.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Progress bar */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Nivel de Cumplimiento Legal Actual:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {validation.percentageScore}% ({validation.passedCount}/{validation.totalChecks} cumplidos)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${validation.percentageScore}%` }}
              />
            </div>
          </div>

          {/* Missing items list */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Requisitos Obligatorios que Deben Completarse:
            </h3>

            {validation.failedChecks.map((item, index) => (
              <div
                key={item.id || index}
                className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 rounded-xl space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600/10 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 pl-7 text-[11px]">
                      {item.errorMessage}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded shrink-0">
                    {item.category.toUpperCase()}
                  </span>
                </div>

                <div className="pl-7 flex items-center justify-between text-[11px] pt-1 border-t border-rose-100 dark:border-rose-900/40">
                  <span className="text-slate-500 italic">
                    Fundamento Legal: <strong className="text-slate-700 dark:text-slate-300 font-medium">{item.legalBasis}</strong>
                  </span>
                  {item.sectionTarget && onScrollToSection && (
                    <button
                      type="button"
                      onClick={() => {
                        onScrollToSection(item.sectionTarget!);
                        onClose();
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Ir al campo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick 1-Click Client Autocompletion Suggestion */}
          {clients.length > 0 && (
            <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Solución rápida: Autocompletar con un Cliente Almacenado
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Puedes rellenar al instante Cédula, RIF, Estado Civil, datos del Cónyuge (Art. 168 C.C.) y domicilio seleccionando un cliente existente del directorio:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onSelectGrantor(client.id);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-500 text-slate-800 dark:text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Cargar {client.fullName.split(' ')[0]} como Otorgante</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>Exigencia según Ley de Registro Público y del Notariado (G.O. 6.156 Ext.)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Entendido, Completar Formulario
          </button>
        </div>
      </div>
    </div>
  );
};
