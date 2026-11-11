import React from 'react';
import { Settings, Shield, UserCheck, Ruler, DollarSign, Check } from 'lucide-react';
import { SarenCriteriaConfig, LawyerProfile } from '../types/legal';
import { VENEZUELAN_STATES_TAX_DATA } from '../data/venezuelaTaxData';

interface SarenSettingsProps {
  criteria: SarenCriteriaConfig;
  onUpdateCriteria: (criteria: SarenCriteriaConfig) => void;
  lawyer: LawyerProfile;
  onUpdateLawyer: (lawyer: LawyerProfile) => void;
}

export const SarenSettingsView: React.FC<SarenSettingsProps> = ({
  criteria,
  onUpdateCriteria,
  lawyer,
  onUpdateLawyer,
}) => {
  const [localCriteria, setLocalCriteria] = React.useState<SarenCriteriaConfig>(criteria);
  const [localLawyer, setLocalLawyer] = React.useState<LawyerProfile>(lawyer);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCriteria(localCriteria);
    onUpdateLawyer(localLawyer);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-500" />
          Criterios Notariales SAREN y Perfil Profesional
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajusta los márgenes legales de encuadernación, el despacho notarial/mercantil por defecto, la tasa BCV oficial y tus datos de abogado visador (INPREABOGADO).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Lawyer profile (Visado Art. 3) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Perfil del Abogado Redactor / Visador (Art. 3 Ley de Abogados)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aparecerá automáticamente en todas las notas de visado de los documentos generados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo del Abogado:
              </label>
              <input
                type="text"
                required
                value={localLawyer.fullName}
                onChange={(e) => setLocalLawyer({ ...localLawyer, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de INPREABOGADO:
              </label>
              <input
                type="text"
                required
                value={localLawyer.inpreabogado}
                onChange={(e) => setLocalLawyer({ ...localLawyer, inpreabogado: e.target.value })}
                placeholder="148.902"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Colegio de Abogados del Estado:
              </label>
              <input
                type="text"
                value={localLawyer.barAssociationState}
                onChange={(e) => setLocalLawyer({ ...localLawyer, barAssociationState: e.target.value })}
                placeholder="Distrito Capital / Miranda / Carabobo"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                N° de Matrícula / Registro Colegiado:
              </label>
              <input
                type="text"
                value={localLawyer.barRegNumber}
                onChange={(e) => setLocalLawyer({ ...localLawyer, barRegNumber: e.target.value })}
                placeholder="45.120"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domicilio Profesional del Escritorio Jurídico:
              </label>
              <input
                type="text"
                value={localLawyer.officeAddress}
                onChange={(e) => setLocalLawyer({ ...localLawyer, officeAddress: e.target.value })}
                placeholder="Av. Francisco de Miranda, Edificio Centro Plaza, Torre B, Piso 14, Caracas"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: SAREN Office & State Defaults */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Despacho Notarial o Registral SAREN Predeterminado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define el encabezado de despacho oficial y las normas impositivas aplicables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado de la Circunscripción Judicial:
              </label>
              <select
                value={localCriteria.state}
                onChange={(e) => setLocalCriteria({ ...localCriteria, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {VENEZUELAN_STATES_TAX_DATA.map((state) => (
                  <option key={state.id} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Municipio de Presentación:
              </label>
              <input
                type="text"
                value={localCriteria.municipality}
                onChange={(e) => setLocalCriteria({ ...localCriteria, municipality: e.target.value })}
                placeholder="Libertador / Chacao / Baruta"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Despacho SAREN:
              </label>
              <select
                value={localCriteria.officeType}
                onChange={(e) => setLocalCriteria({ ...localCriteria, officeType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Notaría Pública">Notaría Pública</option>
                <option value="Registro Mercantil">Registro Mercantil</option>
                <option value="Registro Inmobiliario">Registro Inmobiliario</option>
                <option value="Registro Principal">Registro Principal</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Oficial del Despacho Notarial / Registral:
              </label>
              <input
                type="text"
                value={localCriteria.officeName}
                onChange={(e) => setLocalCriteria({ ...localCriteria, officeName: e.target.value })}
                placeholder="Notaría Pública Segunda de Caracas (Distrito Capital)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Margins & Protocol Format */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Ruler className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Márgenes Protocolares y Tipografía Notarial SAREN
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El margen izquierdo de 4.0 cm (40 mm) es obligatorio para permitir la costura y encuadernación en los libros protocolares del tomo sin tapar texto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margen Izquierdo (Encuadernación):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={35}
                  max={60}
                  value={localCriteria.leftMarginMm}
                  onChange={(e) => setLocalCriteria({ ...localCriteria, leftMarginMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-500 text-xs">mm</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                Recomendado: 40 mm (4.0 cm)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margen Superior:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={25}
                  max={50}
                  value={localCriteria.topMarginMm}
                  onChange={(e) => setLocalCriteria({ ...localCriteria, topMarginMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-500 text-xs">mm</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margen Derecho:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={15}
                  max={40}
                  value={localCriteria.rightMarginMm}
                  onChange={(e) => setLocalCriteria({ ...localCriteria, rightMarginMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-500 text-xs">mm</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Margen Inferior:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={20}
                  max={40}
                  value={localCriteria.bottomMarginMm}
                  onChange={(e) => setLocalCriteria({ ...localCriteria, bottomMarginMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-500 text-xs">mm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipografía Legal Protocolar:
              </label>
              <select
                value={localCriteria.fontFamily}
                onChange={(e) => setLocalCriteria({ ...localCriteria, fontFamily: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Times New Roman">Times New Roman (Clásico Notarial)</option>
                <option value="Arial">Arial (Criterio Moderno SAREN)</option>
                <option value="Courier New">Courier New (Estilo Máquina / Protocolar)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interlineado:
              </label>
              <select
                value={localCriteria.lineSpacing}
                onChange={(e) => setLocalCriteria({ ...localCriteria, lineSpacing: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value={1.5}>1.5 líneas (Estándar Notarial)</option>
                <option value={2.0}>Doble espacio</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tasa de Cambio Oficial BCV (Bs. / USD):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={localCriteria.bcvRate}
                  onChange={(e) => setLocalCriteria({ ...localCriteria, bcvRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button and status */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-4 h-4" />
              <span>Criterios y perfil actualizados con éxito</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Los cambios se aplicarán inmediatamente a los nuevos borradores generados.
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
          >
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
};
