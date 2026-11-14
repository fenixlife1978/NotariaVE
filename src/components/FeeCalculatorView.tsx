import React, { useState } from 'react';
import { Calculator, Printer, FileDown, Building, Info, Landmark } from 'lucide-react';
import { calculateVenezuelanFees, FeeInputParams } from '../utils/feeCalculator';
import { VENEZUELAN_STATES_TAX_DATA } from '../data/venezuelaTaxData';
import { VENEZUELAN_MUNICIPALITIES_DATA } from '../data/venezuelanMunicipalities';
import { exportToWordDocx } from '../utils/docxExporter';
import { SarenCriteriaConfig } from '../types/legal';

interface FeeCalculatorViewProps {
  criteria: SarenCriteriaConfig;
  onUpdateBcvRate: (rate: number) => void;
}

export const FeeCalculatorView: React.FC<FeeCalculatorViewProps> = ({ criteria, onUpdateBcvRate }) => {
  const [stateId, setStateId] = useState<string>('distrito-capital');
  const [municipalityId, setMunicipalityId] = useState<string>('mun-libertador-dc');
  const [operationType, setOperationType] = useState<FeeInputParams['operationType']>('venta-inmueble');
  const [currency, setCurrency] = useState<'USD' | 'BS'>('USD');
  const [amountValue, setAmountValue] = useState<number>(50000);
  const [pageCount, setPageCount] = useState<number>(4);
  const [grantorCount, setGrantorCount] = useState<number>(2);
  const [expressExpedited, setExpressExpedited] = useState<boolean>(false);
  const [bcvRate, setBcvRate] = useState<number>(criteria.bcvRate || 0);
  const hasValidBcvRate = Number.isFinite(bcvRate) && bcvRate > 0;

  const handleRateChange = (newRate: number) => {
    setBcvRate(newRate);
    onUpdateBcvRate(newRate);
  };

  const calculation = calculateVenezuelanFees({
    stateId,
    municipalityId,
    operationType,
    amountCurrency: currency,
    amountValue: amountValue || 0,
    bcvRate: hasValidBcvRate ? bcvRate : 1,
    pageCount: pageCount || 1,
    grantorCount: grantorCount || 1,
    expressExpedited,
  });

  const selectedStateRule =
    VENEZUELAN_STATES_TAX_DATA.find((s) => s.id === stateId) || VENEZUELAN_STATES_TAX_DATA[0];

  const selectedMunicipality =
    VENEZUELAN_MUNICIPALITIES_DATA.find((m) => m.id === municipalityId) ||
    VENEZUELAN_MUNICIPALITIES_DATA[0];

  const handleExportStatementDocx = async () => {
    if (!hasValidBcvRate) return;
    const textStatement = `HOJA DE LIQUIDACIÓN Y ESTIMACIÓN DE GASTOS NOTARIALES, REGISTRALES Y MUNICIPALES
ESTADO: ${calculation.state.toUpperCase()}
MUNICIPIO: ${calculation.municipalityName.toUpperCase()}
ADMINISTRACIÓN TRIBUTARIA MUNICIPAL: ${selectedMunicipality.taxAuthorityName}
AUTORIDAD TRIBUTARIA ESTADAL: ${selectedStateRule.taxAuthorityName}
TIPO DE OPERACIÓN: ${calculation.operationType.toUpperCase()}
MONTO BASE DECLARADO: Bs. ${calculation.declaredAmountBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} (Ref. US$ ${calculation.declaredAmountUsd.toLocaleString('es-VE', { maximumFractionDigits: 2 })})
TASA OFICIAL BCV: ${calculation.bcvRate.toFixed(2)} Bs./USD
NÚMERO DE PÁGINAS / PLANAS: ${calculation.pageCount}
OTORGANTES: ${calculation.grantorCount}
TRÁMITE EXPRÉS / HABILITACIÓN: ${calculation.expressExpedited ? 'SÍ (RECARGO POR URGENCIA)' : 'NO'}

--------------------------------------------------------------------------------
DESGLOSE DETALLADO DE RUBROS Y TASAS:
${calculation.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.concept}
   Base Legal: ${item.basis}
   Monto: Bs. ${item.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | US$ ${item.amountUsd.toFixed(2)}`
  )
  .join('\n\n')}

--------------------------------------------------------------------------------
RESUMEN DE LIQUIDACIÓN:
• Subtotal Aranceles SAREN: Bs. ${calculation.subtotalSarenBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (US$ ${calculation.subtotalSarenUsd.toFixed(2)})
• Subtotal Timbres Fiscales Estadales (${selectedStateRule.taxAuthorityName}): Bs. ${calculation.subtotalTimbresBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (US$ ${calculation.subtotalTimbresUsd.toFixed(2)})
• Subtotal Tasas Municipales (${selectedMunicipality.name} - LOCAPTEM): Bs. ${calculation.subtotalMunicipalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (US$ ${calculation.subtotalMunicipalUsd.toFixed(2)})
• Honorarios Mínimos Sugeridos de Abogado (Reglamento Federación): Bs. ${calculation.subtotalHonorariosBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (US$ ${calculation.subtotalHonorariosUsd.toFixed(2)})

TOTAL GENERAL ESTIMADO (NO OFICIAL):
Bs. ${calculation.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BOLÍVARES
(Equivalente a US$ ${calculation.totalUsd.toFixed(2)} Dólares de los Estados Unidos de América a Tasa Oficial BCV)

Estimación orientativa no oficial. Los porcentajes, mínimos y tasas incluidos en este modelo aún requieren contraste documental con la Gaceta Oficial, las normas aplicables y la ordenanza vigente de la jurisdicción.`;

    await exportToWordDocx(
      'Liquidación de Gastos Notariales y Municipales',
      textStatement,
      criteria,
      `liquidacion_gastos_${stateId}_${selectedMunicipality.id}.docx`
    );
  };

  const handlePrint = () => {
    if (!hasValidBcvRate) return;
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-amber-500" />
            Estimador Orientativo de Gastos Notariales, Registrales y Municipales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Estimaciones internas no oficiales. Verifique cada tarifa, porcentaje y vigencia directamente con SAREN, la autoridad estadal y la alcaldía competente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportStatementDocx}
            disabled={!hasValidBcvRate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Descargar Presupuesto Word</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!hasValidBcvRate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-amber-500" />
            Parámetros del Trámite y Jurisdicción
          </h2>

          {/* State selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Estado / Jurisdicción Estadal (24 Entidades Federales):
            </label>
            <select
              value={stateId}
              onChange={(e) => {
                const newStateId = e.target.value;
                setStateId(newStateId);
                const matchingMuns = VENEZUELAN_MUNICIPALITIES_DATA.filter((m) => m.stateId === newStateId);
                if (matchingMuns.length > 0) {
                  setMunicipalityId(matchingMuns[0].id);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium"
            >
              {VENEZUELAN_STATES_TAX_DATA.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name} — {state.taxAuthorityName.split('(')[0]}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 block mt-1">
              {selectedStateRule.notes}
            </span>
          </div>

          {/* Municipality selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Municipio Competente ({selectedStateRule.name.split('(')[0].trim()}):
            </label>
            <select
              value={municipalityId}
              onChange={(e) => setMunicipalityId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium"
            >
              {VENEZUELAN_MUNICIPALITIES_DATA.filter(
                (mun) => !stateId || mun.stateId === stateId
              ).map((mun) => (
                <option key={mun.id} value={mun.id}>
                  {mun.name} ({mun.taxAuthorityName.split('(')[0]})
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Tributos: {selectedMunicipality.taxAuthorityName.split('(')[0]}
              </span>
              {selectedMunicipality.regimeType === 'fronterizo' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ZONA FRONTERIZA (Art. 15 CRBV / SECODENA)
                </span>
              )}
              {selectedMunicipality.regimeType === 'agrario' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ZONA AGROPECUARIA (Ley de Tierras - INTI)
                </span>
              )}
              {selectedMunicipality.regimeType === 'puerto_libre' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  PUERTO LIBRE / RÉGIMEN ESPECIAL
                </span>
              )}
              {selectedMunicipality.regimeType === 'costero' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  ZONA COSTERA (80m Servidumbre INEA)
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1.5">
              Catastro: {selectedMunicipality.catastroDepartment} | Cód: {selectedMunicipality.cadastralCodeFormat}
            </span>
          </div>

          {/* Operation Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Acto o Negocio Jurídico:
            </label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="venta-inmueble">Venta de Inmueble (Registro Inmobiliario SAREN)</option>
              <option value="venta-vehiculo">Compraventa de Vehículo Automotor (Notaría)</option>
              <option value="constitucion-ca">Constitución de C.A. / Pyme (Registro Mercantil)</option>
              <option value="firma-personal">Constitución de Firma Personal (Registro Mercantil)</option>
              <option value="poder-general">Poder General Notarial de Administración</option>
              <option value="poder-especial">Poder Especial Determinado</option>
              <option value="arrendamiento">Contrato de Arrendamiento Inmobiliario</option>
              <option value="declaracion">Declaración Jurada Notarial</option>
            </select>
          </div>

          {/* Amount declared */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Monto o Cuantía Declarada del Acto:
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    currency === 'USD'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  DÓLARES ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('BS')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    currency === 'BS'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  BOLÍVARES (Bs.)
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                value={amountValue}
                onChange={(e) => setAmountValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">
                {currency}
              </span>
            </div>

            {/* Equivalent calculation */}
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Equivalente:{' '}
              {!hasValidBcvRate ? (
                <span>Ingrese una tasa BCV válida para convertir.</span>
              ) : currency === 'USD' ? (
                <span>
                  Bs. {(amountValue * bcvRate).toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                </span>
              ) : (
                <span>US$ {(amountValue / bcvRate).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* BCV Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tasa BCV introducida manualmente (verifique fuente y fecha):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={bcvRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-500 font-mono shrink-0">Bs. / USD</span>
            </div>
          </div>

          {/* Pages and Grantors count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Planas (Hojas):
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Otorgantes:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={grantorCount}
                onChange={(e) => setGrantorCount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Expedited checkbox */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={expressExpedited}
                onChange={(e) => setExpressExpedited(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Trámite Exprés / Habilitación Notarial por Urgencia
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Recargo del 50% sobre derechos de procesamiento SAREN para firma el mismo día.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!hasValidBcvRate ? (
            <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-200">
              No hay una tasa BCV válida guardada. Introduzca manualmente la tasa vigente y verifique su fuente y fecha antes de calcular. No se utilizará una tasa ficticia.
            </div>
          ) : <>
          {/* Main Total Highlight Card */}
          <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Total Estimado de Liquidación (SAREN + Estado + Municipio)
                </span>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
                  Bs. {calculation.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm font-mono text-emerald-400 font-semibold mt-0.5">
                  ≈ US$ {calculation.totalUsd.toFixed(2)} Dólares (Tasa BCV {calculation.bcvRate.toFixed(2)})
                </div>
              </div>

              <div className="text-xs text-slate-400 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5">
                <span className="text-slate-500 block">Municipio:</span>
                <span className="text-white font-semibold">{calculation.municipalityName}</span>
                <span className="text-slate-500 block mt-1">Autoridad Fiscal:</span>
                <span className="text-amber-400">{selectedMunicipality.taxAuthorityName.split('(')[0]}</span>
              </div>
            </div>

            {/* Subtotal mini bar */}
            <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">SAREN:</span>
                <span className="font-mono font-bold text-white">
                  Bs. {calculation.subtotalSarenBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Timbres Edo.:</span>
                <span className="font-mono font-bold text-white">
                  Bs. {calculation.subtotalTimbresBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Tasas Mun.:</span>
                <span className="font-mono font-bold text-white">
                  Bs. {calculation.subtotalMunicipalBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Honorarios:</span>
                <span className="font-mono font-bold text-amber-400">
                  Bs. {calculation.subtotalHonorariosBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Desglose Ítem por Ítem de Aranceles, Estampillas y Tasas Municipales
              </h3>
              <span className="text-xs text-slate-500">
                {calculation.items.length} conceptos calculados
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {calculation.items.map((item, idx) => {
                let badgeClass = 'text-blue-600 dark:text-blue-400';
                let categoryLabel = 'SAREN';
                if (item.category === 'timbre_estadal') {
                  badgeClass = 'text-purple-600 dark:text-purple-400';
                  categoryLabel = 'TIMBRES EDO';
                } else if (item.category === 'tasa_municipal') {
                  badgeClass = 'text-emerald-600 dark:text-emerald-400';
                  categoryLabel = 'MUNICIPIO';
                } else if (item.category === 'habilitacion') {
                  badgeClass = 'text-rose-600 dark:text-rose-400';
                  categoryLabel = 'EXPRÉS';
                } else if (item.category === 'honorarios_abogado') {
                  badgeClass = 'text-amber-600 dark:text-amber-400';
                  categoryLabel = 'HONORARIOS';
                }

                return (
                  <div
                    key={idx}
                    className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${badgeClass}`}>
                          [{categoryLabel}]
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.concept}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.basis}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        Bs. {item.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        US$ {item.amountUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Advertencia:</strong> Este módulo genera una estimación interna no oficial. Sus porcentajes, mínimos y tasas no están certificados como vigentes. Confirme cada concepto, su base legal y su fecha de vigencia con SAREN, la autoridad tributaria estadal y la alcaldía de {selectedMunicipality.name} antes de cobrar o emitir una liquidación.
            </p>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
};
