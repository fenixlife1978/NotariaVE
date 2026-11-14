import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  Folder,
  FileCheck,
  Building,
  Scale,
} from 'lucide-react';
import { DocumentFormData, SarenCriteriaConfig, LawyerProfile } from '../types/legal';
import { auditVenezuelanDocument, DocumentAuditResult } from '../utils/sarenRejectionRules';

interface SarenComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: DocumentFormData;
  criteria: SarenCriteriaConfig;
  lawyer: LawyerProfile;
  fullDraftText: string;
}

export const SarenComplianceModal: React.FC<SarenComplianceModalProps> = ({
  isOpen,
  onClose,
  formData,
  criteria,
  lawyer,
  fullDraftText,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'municipal_requirements'>('audit');
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  if (!isOpen) return null;

  const auditResult: DocumentAuditResult = auditVenezuelanDocument(
    formData,
    criteria,
    lawyer,
    fullDraftText
  );

  const { rules, failedCount, warningCount, passedCount, rejectionRiskScore, municipalityInfo } =
    auditResult;

  let riskColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  if (failedCount > 0) {
    riskColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  } else if (warningCount > 0) {
    riskColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  }



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Auditor de Cumplimiento Normativo Notarial y Registral SAREN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verificación legal estricta para evitar devoluciones y objeciones de fondo o forma en taquilla
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

        {/* Tab switch */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Auditoría Legal ({rules.length} Leyes y Criterios)</span>
          </button>

          <button
            onClick={() => setActiveTab('municipal_requirements')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'municipal_requirements'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Recaudos Municipales ({municipalityInfo.name})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'audit' && (
            <>
              {/* Risk Level Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${riskColor}`}>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    Estatus del Documento ante Taquilla Notarial/Registral:
                  </div>
                  <div className="text-base font-extrabold mt-0.5">{rejectionRiskScore}</div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">{failedCount}</span> objeciones críticas ·{' '}
                  <span className="font-bold text-amber-600 dark:text-amber-400">{warningCount}</span> advertencias ·{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{passedCount}</span> requisitos conformes
                </div>
              </div>

              {/* Rules Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Chequeo de Invariantes y Leyes Venezolanas Aplicables:
                </h4>

                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-3"
                  >
                    {rule.status === 'passed' && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {rule.status === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    {rule.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rule.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded self-start sm:self-auto">
                          {rule.legalBasis}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                        {rule.finding}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        Acción preventiva: {rule.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deep AI Forensic Check */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Auditoría Forense con Inteligencia Artificial (Criterios de Taquilla)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      La auditoría externa está deshabilitada. Esta revisión local no envía el documento a ningún servicio.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={true}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                  >
                    {isAiAuditing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Auditando...</span>
                      </>
                    ) : (
                      <span>IA externa deshabilitada</span>
                    )}
                  </button>
                </div>

                {aiReport && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Dictamen del Auditor Notarial:
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      Riesgo: <strong>{aiReport.rejectionRisk}</strong> · Estatus: <strong>{aiReport.status}</strong>
                    </div>
                    {aiReport.criticalIssues?.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-rose-600 dark:text-rose-400 block">Objeciones encontradas:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                          {aiReport.criticalIssues.map((issue: string, i: number) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiReport.recommendations?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">Recomendaciones:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                          {aiReport.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'municipal_requirements' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {municipalityInfo.name} ({municipalityInfo.state})
                  </h4>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    {municipalityInfo.taxAuthorityName.split('(')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dirección de Catastro: <strong>{municipalityInfo.catastroDepartment}</strong>
                </p>
                <div className="text-[11px] text-slate-500">
                  Formato de Cédula Catastral: <code>{municipalityInfo.cadastralCodeFormat}</code> (Vigencia:{' '}
                  {municipalityInfo.cadastralValidityMonths} meses)
                </div>
              </div>

              {/* Mandatory Checklist for the Municipality */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  Checklist de Recaudos Físicos Previos para Presentación:
                </h5>
                <div className="space-y-2">
                  {municipalityInfo.mandatoryPreRequirements.map((req: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder & presentation requirement */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
                <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Especificación de Carpeta y Foliatura en este Municipio:
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {municipalityInfo.folderRequirement}. No use grapas metálicas que perforen el texto.
                  </span>
                </div>
              </div>

              {/* Local Decrees & Municipal Gazettes */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">
                  Gacetas Municipales y Marco Tributario Local:
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {municipalityInfo.legalNotesAndDecrees.map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <span className="text-xs text-slate-500">
            Jurisdicción: {criteria.officeName} · {formData.municipality || criteria.municipality}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
