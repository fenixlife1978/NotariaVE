import { FeeCalculationItem, FeeCalculationResult } from '../types/legal';
import { VENEZUELAN_STATES_TAX_DATA } from '../data/venezuelaTaxData';
import { VENEZUELAN_MUNICIPALITIES_DATA } from '../data/venezuelanMunicipalities';

export interface FeeInputParams {
  stateId: string;
  municipalityId?: string;
  operationType:
    | 'venta-vehiculo'
    | 'venta-inmueble'
    | 'constitucion-ca'
    | 'firma-personal'
    | 'poder-especial'
    | 'poder-general'
    | 'declaracion'
    | 'arrendamiento';
  amountCurrency: 'BS' | 'USD';
  amountValue: number;
  bcvRate: number; // e.g. 68.50 Bs / USD
  pageCount: number;
  grantorCount: number;
  expressExpedited: boolean;
  vehicleLawyerFeeMode?: 'percentage' | 'minimum' | 'custom';
  customVehicleLawyerFeeUsd?: number;
}

export function calculateVenezuelanFees(params: FeeInputParams): FeeCalculationResult {
  const {
    stateId,
    municipalityId,
    operationType,
    amountCurrency,
    amountValue,
    bcvRate,
    pageCount,
    grantorCount,
    expressExpedited,
    vehicleLawyerFeeMode = 'percentage',
    customVehicleLawyerFeeUsd = 60,
  } = params;

  if (!Number.isFinite(bcvRate) || bcvRate <= 0) {
    throw new Error('La tasa BCV debe ser un número válido mayor que cero.');
  }
  if (!Number.isFinite(amountValue) || amountValue < 0) {
    throw new Error('La cuantía declarada debe ser un número válido igual o mayor que cero.');
  }
  if (!Number.isInteger(pageCount) || pageCount < 1 || !Number.isInteger(grantorCount) || grantorCount < 1) {
    throw new Error('Las páginas y los otorgantes deben ser números enteros mayores que cero.');
  }
  if (!['percentage', 'minimum', 'custom'].includes(vehicleLawyerFeeMode)) {
    throw new Error('Seleccione una modalidad de honorarios válida.');
  }

  const stateRule =
    VENEZUELAN_STATES_TAX_DATA.find((s) => s.id === stateId) || VENEZUELAN_STATES_TAX_DATA[0];

  const municipality =
    VENEZUELAN_MUNICIPALITIES_DATA.find((m) => m.id === municipalityId) ||
    VENEZUELAN_MUNICIPALITIES_DATA[0];

  // Normalize amounts to both Bs and USD
  const amountBs = amountCurrency === 'BS' ? amountValue : amountValue * bcvRate;
  const amountUsd = amountCurrency === 'USD' ? amountValue : amountValue / (bcvRate || 1);

  const items: FeeCalculationItem[] = [];

  // 1. SAREN ARANCELES (Base según Ley de Registro Público y del Notariado - G.O. N° 6.668 Ext.)
  let sarenBaseBs = 0;

  if (operationType === 'venta-inmueble') {
    // Registro Inmobiliario SAREN: Alícuota escalonada del 1.5% al 2.0% del precio de venta o valor catastral
    const alicuota = 0.015; // 1.5%
    sarenBaseBs = Math.max(amountBs * alicuota, 500 * (bcvRate / 68));
    items.push({
      concept: 'Arancel de Registro Inmobiliario SAREN (Protocolización 1.5%)',
      basis: `1.5% sobre el mayor valor entre el precio declarado y el avalúo catastral (${amountBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs.)`,
      amountBs: sarenBaseBs,
      amountUsd: sarenBaseBs / bcvRate,
      category: 'saren',
    });
  } else if (operationType === 'venta-vehiculo' || operationType === 'arrendamiento') {
    // Notaría Pública SAREN: Alícuota del 1.2%
    const alicuota = 0.012; // 1.2%
    sarenBaseBs = Math.max(amountBs * alicuota, 180 * (bcvRate / 68));
    items.push({
      concept: 'Arancel Notarial SAREN (Alícuota por cuantía 1.2%)',
      basis: `1.2% sobre valor de compraventa o canon anual (${amountBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs.)`,
      amountBs: sarenBaseBs,
      amountUsd: sarenBaseBs / bcvRate,
      category: 'saren',
    });
  } else if (operationType === 'constitucion-ca') {
    // Registro Mercantil: 1.5% sobre capital suscrito + derechos de protocolización
    sarenBaseBs = Math.max(amountBs * 0.015, 300 * (bcvRate / 68));
    items.push({
      concept: 'Arancel de Registro Mercantil SAREN (Inscripción y Capital 1.5%)',
      basis: `1.5% sobre capital social declarado (${amountBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs.)`,
      amountBs: sarenBaseBs,
      amountUsd: sarenBaseBs / bcvRate,
      category: 'saren',
    });
  } else if (operationType === 'firma-personal') {
    // Registro Mercantil Firma Personal: tasa fija + 1% sobre capital
    sarenBaseBs = Math.max(amountBs * 0.01, 180 * (bcvRate / 68));
    items.push({
      concept: 'Arancel Registro Mercantil (Firma Personal)',
      basis: `1.0% sobre capital propio (${amountBs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs.)`,
      amountBs: sarenBaseBs,
      amountUsd: sarenBaseBs / bcvRate,
      category: 'saren',
    });
  } else if (operationType === 'poder-general') {
    // Poder general notarial
    sarenBaseBs = 25 * bcvRate;
    items.push({
      concept: 'Tasa Arancelaria SAREN (Poder General Amplio)',
      basis: 'Derechos de protocolo y otorgamiento notarial',
      amountBs: sarenBaseBs,
      amountUsd: 25,
      category: 'saren',
    });
  } else if (operationType === 'poder-especial') {
    // Poder especial notarial
    sarenBaseBs = 15 * bcvRate;
    items.push({
      concept: 'Tasa Arancelaria SAREN (Poder Especial Determinado)',
      basis: 'Derechos de autenticación notarial',
      amountBs: sarenBaseBs,
      amountUsd: 15,
      category: 'saren',
    });
  } else {
    // Declaración jurada
    sarenBaseBs = 10 * bcvRate;
    items.push({
      concept: 'Tasa Arancelaria SAREN (Declaración Jurada Notarial)',
      basis: 'Derechos de inserción y autenticación de testimonio',
      amountBs: sarenBaseBs,
      amountUsd: 10,
      category: 'saren',
    });
  }

  // Derechos por foliatura / páginas SAREN
  const pageDutyBs = pageCount * 45; // ~45 Bs por página
  items.push({
    concept: `Derechos de Foliatura y Encuadernación SAREN (${pageCount} páginas)`,
    basis: `Tasa por plana protocolar (${pageCount} págs x 45 Bs)`,
    amountBs: pageDutyBs,
    amountUsd: pageDutyBs / bcvRate,
    category: 'saren',
  });

  // 2. TIMBRES FISCALES ESTADALES
  const stampsPerSheetTotalBs = pageCount * stateRule.stampDutyPerSheetBs;
  items.push({
    concept: `Timbres Fiscales Estadales por Plana (${stateRule.name})`,
    basis: `${pageCount} planas x ${stateRule.stampDutyPerSheetBs} Bs. (${stateRule.taxAuthorityName})`,
    amountBs: stampsPerSheetTotalBs,
    amountUsd: stampsPerSheetTotalBs / bcvRate,
    category: 'timbre_estadal',
  });

  const stampsPerGrantorTotalBs = grantorCount * stateRule.stampDutyPerGrantorBs;
  items.push({
    concept: `Timbres Fiscales por Otorgante (${grantorCount} otorgantes)`,
    basis: `${grantorCount} otorgantes x ${stateRule.stampDutyPerGrantorBs} Bs.`,
    amountBs: stampsPerGrantorTotalBs,
    amountUsd: stampsPerGrantorTotalBs / bcvRate,
    category: 'timbre_estadal',
  });

  // 3. TASAS Y TRIBUTOS MUNICIPALES (Armonización Tributaria LOCAPTEM)
  if (operationType === 'venta-inmueble') {
    // Tasa administrativa por Ficha Catastral y Solvencia Municipal
    const municipalCatastroBs = 0.5 * 30 * bcvRate; // Equivalente referencial tasa LOCAPTEM (~$15 USD)
    items.push({
      concept: `Tasa Municipal de Catastro y Solvencia Inmobiliaria (${municipality.name})`,
      basis: `Trámite de verificación catastral y solvencia de derecho de frente en ${municipality.taxAuthorityName}`,
      amountBs: municipalCatastroBs,
      amountUsd: municipalCatastroBs / bcvRate,
      category: 'tasa_municipal',
    });
  } else if (operationType === 'venta-vehiculo') {
    // Tasa por verificación de solvencia de patente de vehículos
    const municipalVehicleTaxBs = 0.25 * 30 * bcvRate; // ~$7.50 USD
    items.push({
      concept: `Tasa Municipal de Solvencia Vehicular (${municipality.name})`,
      basis: `Verificación de solvencia de patente de vehículos (Trimestres Municipales)`,
      amountBs: municipalVehicleTaxBs,
      amountUsd: municipalVehicleTaxBs / bcvRate,
      category: 'tasa_municipal',    });
  }

  // 4. TASA DE HABILITACIÓN EXPRÉS (si aplica)
  if (expressExpedited) {
    const habilitacionBs = sarenBaseBs * 0.5; // 50% de recargo sobre arancel notarial
    items.push({
      concept: 'Tasa de Habilitación por Urgencia SAREN (Trámite Exprés)',
      basis: 'Recargo del 50% sobre derechos de procesamiento para firma el mismo día',
      amountBs: habilitacionBs,
      amountUsd: habilitacionBs / bcvRate,
      category: 'habilitacion',
    });
  }

  // 5. HONORARIOS DEL ABOGADO: modalidad expresamente elegida en el presupuesto.
  let lawyerFeeUsd = 0;
  let lawyerBasis = '';
  if (vehicleLawyerFeeMode === 'minimum') {
    lawyerFeeUsd = 60;
    lawyerBasis = 'Mínimo seleccionado por el abogado: US$ 60';
  } else if (vehicleLawyerFeeMode === 'custom') {
    const customFee = Number(customVehicleLawyerFeeUsd);
    if (!Number.isFinite(customFee) || customFee < 0) {
      throw new Error('El monto libre de honorarios debe ser un número igual o mayor que cero.');
    }
    lawyerFeeUsd = customFee;
    lawyerBasis = 'Monto libre acordado por el abogado: US$ ' + customFee.toFixed(2);
  } else {
    lawyerFeeUsd = amountUsd * 0.03;
    lawyerBasis = '3% de la cuantía declarada: US$ ' + lawyerFeeUsd.toFixed(2);
  }

  const lawyerFeeBs = lawyerFeeUsd * bcvRate;
  items.push({
    concept: 'Honorarios profesionales del abogado',
    basis: lawyerBasis,
    amountBs: lawyerFeeBs,
    amountUsd: lawyerFeeUsd,
    category: 'honorarios_abogado',
  });

  // Calculate Subtotals
  const subtotalSarenBs = items
    .filter((i) => i.category === 'saren' || i.category === 'habilitacion')
    .reduce((acc, curr) => acc + curr.amountBs, 0);
  const subtotalSarenUsd = subtotalSarenBs / bcvRate;

  const subtotalTimbresBs = items
    .filter((i) => i.category === 'timbre_estadal')
    .reduce((acc, curr) => acc + curr.amountBs, 0);
  const subtotalTimbresUsd = subtotalTimbresBs / bcvRate;

  const subtotalMunicipalBs = items
    .filter((i) => i.category === 'tasa_municipal')
    .reduce((acc, curr) => acc + curr.amountBs, 0);
  const subtotalMunicipalUsd = subtotalMunicipalBs / bcvRate;

  const subtotalHonorariosBs = items
    .filter((i) => i.category === 'honorarios_abogado')
    .reduce((acc, curr) => acc + curr.amountBs, 0);
  const subtotalHonorariosUsd = subtotalHonorariosBs / bcvRate;

  const totalBs = subtotalSarenBs + subtotalTimbresBs + subtotalMunicipalBs + subtotalHonorariosBs;
  const totalUsd = totalBs / bcvRate;

  return {
    state: stateRule.name,
    municipalityName: municipality.name,
    operationType,
    declaredAmountBs: amountBs,
    declaredAmountUsd: amountUsd,
    bcvRate,
    pageCount,
    grantorCount,
    expressExpedited,
    items,
    subtotalSarenBs,
    subtotalSarenUsd,
    subtotalTimbresBs,
    subtotalTimbresUsd,
    subtotalMunicipalBs,
    subtotalMunicipalUsd,
    subtotalHonorariosBs,
    subtotalHonorariosUsd,
    totalBs,
    totalUsd,
  };
}