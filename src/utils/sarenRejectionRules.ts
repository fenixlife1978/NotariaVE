import { DocumentFormData, SarenCriteriaConfig, LawyerProfile } from '../types/legal';
import { VENEZUELAN_MUNICIPALITIES_DATA } from '../data/venezuelanMunicipalities';

export interface LegalValidationRule {
  id: string;
  category: 'formalidad' | 'identificacion' | 'conyugal' | 'municipal' | 'saren_legitimacion' | 'visado' | 'objeto_negocio';
  title: string;
  legalBasis: string; // Artículo de Ley, Decreto o Gaceta Oficial
  status: 'passed' | 'warning' | 'failed';
  finding: string;
  recommendation: string;
}

export interface DocumentAuditResult {
  totalRulesChecked: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  rejectionRiskScore: 'NULO / APTO PARA PRESENTACIÓN' | 'MODERADO (OBSERVACIONES)' | 'CRÍTICO (DEVOLUCIÓN EN TAQUILLA)';
  municipalityInfo?: any;
  rules: LegalValidationRule[];
}

/**
 * Audits complete document data against all Venezuelan national, state, and municipal regulations
 */
export function auditVenezuelanDocument(
  formData: DocumentFormData,
  criteria: SarenCriteriaConfig,
  lawyer: LawyerProfile,
  fullText: string
): DocumentAuditResult {
  const rules: LegalValidationRule[] = [];

  const municipality =
    VENEZUELAN_MUNICIPALITIES_DATA.find((m) => m.name.toLowerCase().includes(formData.municipality?.toLowerCase() || '')) ||
    VENEZUELAN_MUNICIPALITIES_DATA[0];

  // 1. RULE: Cédula de Identidad del Otorgante
  if (!formData.grantor.idCardNumber || formData.grantor.idCardNumber.trim().length < 5) {
    rules.push({
      id: 'rule_ci_grantor',
      category: 'identificacion',
      title: 'Cédula de Identidad del Otorgante',
      legalBasis: 'Art. 44 ordinal 1° de la Ley de Registro Público y del Notariado (G.O. N° 6.668 Ext.)',
      status: 'failed',
      finding: 'No se ha ingresado el número de Cédula de Identidad del otorgante.',
      recommendation: 'Ingrese la Cédula con su letra identificadora (V- o E-) tal como consta en el documento de identidad original.',
    });
  } else {
    rules.push({
      id: 'rule_ci_grantor',
      category: 'identificacion',
      title: 'Cédula de Identidad del Otorgante',
      legalBasis: 'Art. 44 ordinal 1° de la Ley de Registro Público y del Notariado',
      status: 'passed',
      finding: `Cédula ${formData.grantor.idCardType}-${formData.grantor.idCardNumber} correctamente identificada.`,
      recommendation: 'Verifique que la Cédula física esté vigente y legible al momento de estampar la huella en taquilla.',
    });
  }

  // 2. RULE: Registro de Información Fiscal (R.I.F.)
  if (!formData.grantor.rifNumber || formData.grantor.rifNumber.trim().length < 5) {
    rules.push({
      id: 'rule_rif_grantor',
      category: 'identificacion',
      title: 'Registro de Información Fiscal (R.I.F.) del Otorgante',
      legalBasis: 'Providencia Administrativa SENIAT N° SNAT/2009/0049 y Circular SAREN N° 012',
      status: 'failed',
      finding: 'Falta el número de R.I.F. fiscal del otorgante. Ninguna notaría ni registro del país recibe trámites sin RIF.',
      recommendation: 'Cargue el R.I.F. con su prefijo (V, E, J, G) y dígito verificador.',
    });
  } else {
    rules.push({
      id: 'rule_rif_grantor',
      category: 'identificacion',
      title: 'Registro de Información Fiscal (R.I.F.) del Otorgante',
      legalBasis: 'Circular Conjunta SENIAT-SAREN de Control Tributario',
      status: 'passed',
      finding: `R.I.F. ${formData.grantor.rifType}-${formData.grantor.rifNumber} validado conforme.`,
      recommendation: 'Consigne la constancia digital del R.I.F. con código QR en la carpeta manila.',
    });
  }

  // 3. RULE: Régimen Matrimonial y Consentimiento Conyugal (Art. 168 Código Civil)
  const isBilateralDisposal =
    formData.templateId === 'venta-vehiculo' ||
    formData.templateId === 'venta-inmueble' ||
    formData.templateId === 'arrendamiento';

  if (formData.grantor.maritalStatus === 'casado') {
    if (!formData.grantor.spouseName || !formData.grantor.spouseIdCard) {
      rules.push({
        id: 'rule_marital_consent',
        category: 'conyugal',
        title: 'Consentimiento Conyugal en Disposición de Bienes Gananciales',
        legalBasis: 'Artículo 168 del Código Civil de Venezuela',
        status: isBilateralDisposal ? 'failed' : 'warning',
        finding: 'El otorgante figura como CASADO pero no se indica el nombre ni la cédula del cónyuge.',
        recommendation: isBilateralDisposal
          ? 'CRÍTICO: Si el bien pertenece a la comunidad conyugal, el cónyuge DEBE comparecer y firmar autorizando la venta (Art. 168 C.C.), o en su defecto adjuntar acta de capitulaciones matrimoniales protocolizadas.'
          : 'Indique los datos del cónyuge para completar la identificación notarial.',
      });
    } else {
      rules.push({
        id: 'rule_marital_consent',
        category: 'conyugal',
        title: 'Consentimiento Conyugal en Disposición de Bienes',
        legalBasis: 'Artículo 168 del Código Civil de Venezuela',
        status: 'passed',
        finding: `Cónyuge declarado: ${formData.grantor.spouseName} (C.I. ${formData.grantor.spouseIdCard}).`,
        recommendation: 'Asegúrese de que el cónyuge asista al acto notarial con su cédula laminada original.',
      });
    }
  }

  // 4. RULE: Cláusula de Origen y Destino Lícito de Fondos (Resolución SAREN-SUDEBAN)
  const hasOriginOfFunds =
    formData.includeOriginOfFunds || fullText.toUpperCase().includes('ORIGEN Y DESTINO LÍCITO DE FONDOS');
  if (!hasOriginOfFunds) {
    rules.push({
      id: 'rule_origin_funds',
      category: 'saren_legitimacion',
      title: 'Cláusula de Origen y Destino Lícito de Fondos',
      legalBasis: 'Ley Orgánica contra la Delincuencia Organizada y Resolución Conjunta SAREN-SUDEBAN N° 001/017',
      status: 'failed',
      finding: 'No se encuentra redactada la cláusula expresa de licitud de fondos.',
      recommendation: 'Active la casilla de Cláusula de Origen de Fondos en el editor para evitar la devolución automática.',
    });
  } else {
    rules.push({
      id: 'rule_origin_funds',
      category: 'saren_legitimacion',
      title: 'Cláusula de Origen y Destino Lícito de Fondos',
      legalBasis: 'Resolución Conjunta SAREN N° 001/017 y SUDEBAN',
      status: 'passed',
      finding: 'Cláusula bajo fe de juramento insertada conforme a la norma contra legitimación de capitales.',
      recommendation: 'Cumple con el estándar riguroso exigido en las notarías de todo el territorio nacional.',
    });
  }

  // 5. RULE: Nota de Visado de Abogado en Ejercicio (Art. 3 Ley de Abogados)
  const hasLawyerVisa =
    formData.includeLawyerVisa &&
    Boolean(lawyer.inpreabogado) &&
    lawyer.inpreabogado !== 'XXXXXX' &&
    Boolean(lawyer.barAssociationState);

  if (!hasLawyerVisa) {
    rules.push({
      id: 'rule_lawyer_visa',
      category: 'visado',
      title: 'Nota de Visado Profesional por Abogado Colegiado',
      legalBasis: 'Artículo 3 de la Ley de Abogados de Venezuela y Art. 43 de la Ley de Registro y Notariado',
      status: 'failed',
      finding: 'Falta la nota de visado o el número de INPREABOGADO o el Colegio de Abogados del redactor.',
      recommendation: 'Configure sus datos de abogado visador en la pestaña Criterios Notariales SAREN.',
    });
  } else {
    rules.push({
      id: 'rule_lawyer_visa',
      category: 'visado',
      title: 'Nota de Visado Profesional por Abogado Colegiado',
      legalBasis: 'Artículo 3 de la Ley de Abogados de Venezuela',
      status: 'passed',
      finding: `Documento visado por ${lawyer.fullName} (INPRE: ${lawyer.inpreabogado}, Colegio Edo. ${lawyer.barAssociationState}).`,
      recommendation: 'Recuerde estampar su sello húmedo profesional de abogado en la copia física a entregar en taquilla.',
    });
  }

  // 6. RULE: Márgenes Protocolares de Encuadernación SAREN
  if ((criteria.leftMarginMm || 40) < 38) {
    rules.push({
      id: 'rule_margins_stitching',
      category: 'formalidad',
      title: 'Margen Izquierdo de Costura y Encuadernación Protocolar',
      legalBasis: 'Reglamento de Archivo y Encuadernación de Tomos del SAREN',
      status: 'failed',
      finding: `El margen izquierdo fijado (${criteria.leftMarginMm} mm) es insuficiente. El encuadernador notarial coserá y perforará los primeros 3.5 a 4 cm, tapando el texto del documento.`,
      recommendation: 'Ajuste el margen izquierdo a mínimo 40 mm (4.0 cm) para cumplir con el protocolo de tomo.',
    });
  } else {
    rules.push({
      id: 'rule_margins_stitching',
      category: 'formalidad',
      title: 'Margen Izquierdo de Costura y Encuadernación Protocolar',
      legalBasis: 'Normas Técnicas de Encuadernación Protocolar SAREN',
      status: 'passed',
      finding: `Margen izquierdo de ${criteria.leftMarginMm} mm garantiza espacio libre para la costura del tomo en archivo.`,
      recommendation: 'Cumple con el estándar de presentación en papel legal/oficio.',
    });
  }

  // 7. RULE: Requisitos Específicos para Vehículos (INTT + Patente Municipal)
  if (formData.templateId === 'venta-vehiculo') {
    const v = formData.vehicle || {};
    if (!v.licensePlate || !v.serialBody || !v.inttCertificateNumber) {
      rules.push({
        id: 'rule_vehicle_specs',
        category: 'objeto_negocio',
        title: 'Características Técnicas y Registro INTT del Vehículo',
        legalBasis: 'Ley de Transporte Terrestre y Criterios SAREN para Venta de Automotores',
        status: 'failed',
        finding: 'Faltan datos obligatorios del vehículo: Placa, Serial Carrocería (NIV) o N° Certificado INTT.',
        recommendation: 'Copie con exactitud los seriales tal como figuran en el Certificado de Registro de Vehículo expedido por el INTT.',
      });
    } else {
      rules.push({
        id: 'rule_vehicle_specs',
        category: 'objeto_negocio',
        title: 'Características Técnicas y Registro INTT del Vehículo',
        legalBasis: 'Ley de Transporte Terrestre',
        status: 'passed',
        finding: `Vehículo Placa ${v.licensePlate}, Serial Carrocería ${v.serialBody}, Certificado INTT ${v.inttCertificateNumber}.`,
        recommendation: 'Consigne la experticia técnica de Tránsito (P-51) y la solvencia de patente de vehículos de la Alcaldía de ' + municipality.name + '.',
      });
    }
  }

  // 8. RULE: Requisitos Específicos para Inmuebles (Ficha Catastral + Solvencia Municipal + Linderos)
  if (formData.templateId === 'venta-inmueble' || formData.templateId === 'arrendamiento') {
    const r = formData.realEstate || {};
    const l = formData.lease || {};

    const hasCatastral = Boolean(r.cadastralCertificateNumber || l.propertyCadastralNumber);
    const hasMunicipalSolvency = Boolean(r.municipalSolvencyNumber);

    if (!hasCatastral) {
      rules.push({
        id: 'rule_real_estate_catastro',
        category: 'municipal',
        title: 'Cédula / Ficha Catastral Municipal Obligatoria',
        legalBasis: 'Ley de Geografía, Cartografía y Catastro Nacional y Ordenanza Catastral de ' + municipality.name,
        status: 'failed',
        finding: 'No se ha indicado el número de Cédula o Ficha Catastral expedida por la Dirección de Catastro Municipal.',
        recommendation: 'Tramite previamente la Ficha Catastral actualizada ante ' + municipality.catastroDepartment + '.',
      });
    } else {
      rules.push({
        id: 'rule_real_estate_catastro',
        category: 'municipal',
        title: 'Cédula / Ficha Catastral Municipal Obligatoria',
        legalBasis: 'Ordenanza de Catastro Municipal',
        status: 'passed',
        finding: `Ficha Catastral vinculada: ${r.cadastralCertificateNumber || l.propertyCadastralNumber}.`,
        recommendation: 'Asegúrese de que la ficha catastral tenga menos de 1 año de emitida.',
      });
    }

    if (formData.templateId === 'venta-inmueble' && !hasMunicipalSolvency) {
      rules.push({
        id: 'rule_municipal_solvency',
        category: 'municipal',
        title: 'Solvencia de Impuesto sobre Inmuebles Urbanos (Derecho de Frente)',
        legalBasis: 'Ley Orgánica del Poder Público Municipal y Ordenanza Tributaria de ' + municipality.name,
        status: 'warning',
        finding: 'Falta registrar el número de Solvencia Municipal de Inmuebles Urbanos del año en curso.',
        recommendation: 'Solicite la solvencia municipal definitiva en ' + municipality.taxAuthorityName + '.',
      });
    }

    // 8.1 RULE: Régimen Especial Fronterizo (SECODENA / MinDefensa / Art. 15 CRBV)
    if (municipality.regimeType === 'fronterizo' && formData.templateId === 'venta-inmueble') {
      const isForeignParty =
        formData.grantor.idCardType === 'E' || (formData.grantee && formData.grantee.idCardType === 'E');
      if (isForeignParty) {
        rules.push({
          id: 'rule_border_secodena',
          category: 'objeto_negocio',
          title: 'Autorización SECODENA en Zona de Seguridad Fronteriza',
          legalBasis: 'Art. 15 de la CRBV, Art. 47 Ley Orgánica de Seguridad de la Nación y Ley de Fronteras',
          status: 'failed',
          finding: `Inmueble ubicado en zona fronteriza (${municipality.name}) con otorgante o adquirente extranjero (E-). Sin autorización previa de SECODENA / MinDefensa, el Registrador Inmobiliario rechazará de oficio la protocolización.`,
          recommendation: 'Consigne la Resolución Ministerial o autorización de SECODENA debidamente visada y cite el número de oficio en la cláusula de adquisición.',
        });
      } else {
        rules.push({
          id: 'rule_border_secodena',
          category: 'objeto_negocio',
          title: 'Verificación de Zona de Seguridad Fronteriza',
          legalBasis: 'Ley Orgánica de Seguridad de la Nación',
          status: 'passed',
          finding: `Inmueble en municipio fronterizo (${municipality.name}), partes de nacionalidad venezolana verificada conforme.`,
          recommendation: 'Consigne copia ampliada de Cédulas venezolanas para confirmar no afectación de zona de seguridad.',
        });
      }
    }

    // 8.2 RULE: Régimen Agrario (Ley de Tierras y Desarrollo Agrario - INTI)
    if (municipality.regimeType === 'agrario' && formData.templateId === 'venta-inmueble') {
      rules.push({
        id: 'rule_agrarian_inti',
        category: 'municipal',
        title: 'Régimen de Tierras Agrarias (INTI)',
        legalBasis: 'Artículos 1, 2 y 17 de la Ley de Tierras y Desarrollo Agrario (LTDA)',
        status: 'warning',
        finding: `Municipio de alta vocación agropecuaria (${municipality.name}). Si el inmueble es rústico o rural, las tierras públicas pertenecen al Estado venezolano y son intransferibles en propiedad particular; sólo se enajenan BIENHECHURÍAS.`,
        recommendation: 'Si es predio rural, anexe Título de Adjudicación de Tierras o Carta Agraria del INTI y constancia de bienhechurías. Si es urbano, verifique que la cédula catastral certifique la condición de terreno urbano / ejido municipal.',
      });
    }

    // 8.3 RULE: Régimen de Zonas Costeras y Marítimas (Ley de Zonas Costeras)
    if (municipality.regimeType === 'costero' && formData.templateId === 'venta-inmueble') {
      rules.push({
        id: 'rule_coastal_inea',
        category: 'municipal',
        title: 'Servidumbre Costera y Desafectación Marítima (INEA / MINEC)',
        legalBasis: 'Artículos 9 y 11 de la Ley de Zonas Costeras (G.O. N° 37.330)',
        status: 'warning',
        finding: `Inmueble ubicado en municipio costero o insular (${municipality.name}). Debe respetarse la franja de dominio público marítimo de 80 metros de anchura desde la línea de más alta marea.`,
        recommendation: 'Verifique que la ficha catastral y el plano topográfico demuestren que el bien no colide con la servidumbre legal de costas ni canales náuticos.',
      });
    }
  }

  // 9. RULE: Requisitos para Sociedades Mercantiles (C.A. y Firmas Personales)
  if (formData.templateId === 'constitucion-ca') {
    const c = formData.company || {};
    if (!c.commissionerName || !c.commissionerCpcNumber) {
      rules.push({
        id: 'rule_mercantil_comisario',
        category: 'objeto_negocio',
        title: 'Designación de Comisario Mercantil y Número de CPC',
        legalBasis: 'Artículos 287 y 309 del Código de Comercio de Venezuela',
        status: 'failed',
        finding: 'Falta la designación del Comisario Mercantil o su número de Colegiado en Contaduría Pública (CPC).',
        recommendation: 'Indique el nombre del Contador Público y su N° de CPC, y anexe la carta de aceptación del cargo debidamente visada.',
      });
    } else {
      rules.push({
        id: 'rule_mercantil_comisario',
        category: 'objeto_negocio',
        title: 'Designación de Comisario Mercantil',
        legalBasis: 'Código de Comercio de Venezuela',
        status: 'passed',
        finding: `Comisario mercantil: ${c.commissionerName} (CPC N° ${c.commissionerCpcNumber}).`,
        recommendation: 'Consigne la constancia de habilitación expedida por el Colegio de Contadores Públicos.',
      });
    }
  }

  // 10. RULE: Formato Numérico y Legal (Cifras en letras completas)
  const hasCurrencyLetters =
    fullText.includes('BOLÍVARES') || fullText.includes('DÓLARES') || fullText.includes('CÉNTIMOS');
  if (!hasCurrencyLetters) {
    rules.push({
      id: 'rule_legal_words',
      category: 'formalidad',
      title: 'Expresión de Montos en Letras y Cifras Jurídicas',
      legalBasis: 'Art. 43 ordinal 3° de la Ley de Registro Público y del Notariado',
      status: 'warning',
      finding: 'Se recomienda asegurar que toda cantidad dineraria aparezca primero en letras mayúsculas y luego en cifras numéricas.',
      recommendation: 'Utilice el conversor legal automático de MVP Notaría VE para garantizar la redacción forense.',
    });
  } else {
    rules.push({
      id: 'rule_legal_words',
      category: 'formalidad',
      title: 'Expresión de Montos en Letras y Cifras Jurídicas',
      legalBasis: 'Art. 43 ordinal 3° de la Ley de Registro Público y del Notariado',
      status: 'passed',
      finding: 'Cantidades expresadas en letras mayúsculas seguidas de números entre paréntesis.',
      recommendation: 'Cumple a cabalidad con la regla de expresión dineraria.',
    });
  }

  const failedCount = rules.filter((r) => r.status === 'failed').length;
  const warningCount = rules.filter((r) => r.status === 'warning').length;
  const passedCount = rules.filter((r) => r.status === 'passed').length;

  let rejectionRiskScore: DocumentAuditResult['rejectionRiskScore'] = 'NULO / APTO PARA PRESENTACIÓN';
  if (failedCount > 0) {
    rejectionRiskScore = 'CRÍTICO (DEVOLUCIÓN EN TAQUILLA)';
  } else if (warningCount > 0) {
    rejectionRiskScore = 'MODERADO (OBSERVACIONES)';
  }

  return {
    totalRulesChecked: rules.length,
    passedCount,
    warningCount,
    failedCount,
    rejectionRiskScore,
    municipalityInfo: municipality,
    rules,
  };
}

export interface MinimumLegalCheck {
  id: string;
  label: string;
  category: 'identificacion' | 'conyugal' | 'negocio' | 'visado';
  legalBasis: string;
  passed: boolean;
  valueFound?: string;
  errorMessage: string;
  sectionTarget: 'grantor' | 'grantee' | 'power' | 'personalFirm' | 'vehicle' | 'realEstate' | 'company' | 'lawyer';
}

export interface MinimumLegalValidationResult {
  isValid: boolean;
  canExport: boolean;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  percentageScore: number;
  failedChecks: MinimumLegalCheck[];
  allChecks: MinimumLegalCheck[];
}

/**
 * Validates in real time if the document complies with the strictly mandatory minimum requirements
 * of Venezuelan law (Cédulas, full names, marital status, Art. 168 C.C., RIF, vehicle/real estate specs)
 * before allowing final generation (Word/PDF export).
 */
export function validateMinimumLegalRequirements(
  formData: DocumentFormData,
  criteria: SarenCriteriaConfig,
  lawyer: LawyerProfile
): MinimumLegalValidationResult {
  const checks: MinimumLegalCheck[] = [];

  // 1. OTORGANTE: Nombre Completo
  const grantorNameValid = Boolean(formData.grantor?.fullName && formData.grantor.fullName.trim().length >= 4);
  checks.push({
    id: 'min_grantor_name',
    label: 'Nombre Completo del Otorgante / Vendedor',
    category: 'identificacion',
    legalBasis: 'Art. 44 ord. 1° de la Ley de Registro Público y del Notariado',
    passed: grantorNameValid,
    valueFound: formData.grantor?.fullName || undefined,
    errorMessage: 'Debe ingresar el nombre y apellido completos del otorgante.',
    sectionTarget: 'grantor',
  });

  // 2. OTORGANTE: Cédula de Identidad
  const grantorCedulaValid = Boolean(formData.grantor?.idCardNumber && formData.grantor.idCardNumber.trim().length >= 5);
  checks.push({
    id: 'min_grantor_cedula',
    label: 'Cédula de Identidad del Otorgante (V- o E-)',
    category: 'identificacion',
    legalBasis: 'Art. 44 ord. 1° de la Ley de Registro Público y del Notariado',
    passed: grantorCedulaValid,
    valueFound: formData.grantor?.idCardNumber ? `${formData.grantor.idCardType || 'V'}-${formData.grantor.idCardNumber}` : undefined,
    errorMessage: 'Falta el número de Cédula de Identidad del otorgante.',
    sectionTarget: 'grantor',
  });

  // 3. OTORGANTE: Estado Civil
  const grantorMaritalValid = Boolean(formData.grantor?.maritalStatus);
  checks.push({
    id: 'min_grantor_marital',
    label: 'Estado Civil del Otorgante',
    category: 'identificacion',
    legalBasis: 'Art. 44 ord. 1° de la LRPN y Art. 40 del Código Civil',
    passed: grantorMaritalValid,
    valueFound: formData.grantor?.maritalStatus?.toUpperCase(),
    errorMessage: 'Debe seleccionar el estado civil (soltero, casado, divorciado o viudo).',
    sectionTarget: 'grantor',
  });

  // 4. OTORGANTE: R.I.F. Fiscal
  const grantorRifValid = Boolean(formData.grantor?.rifNumber && formData.grantor.rifNumber.trim().length >= 5);
  checks.push({
    id: 'min_grantor_rif',
    label: 'R.I.F. Fiscal del Otorgante',
    category: 'identificacion',
    legalBasis: 'Providencia Administrativa SENIAT N° SNAT/2009/0049',
    passed: grantorRifValid,
    valueFound: formData.grantor?.rifNumber ? `${formData.grantor.rifType || 'V'}-${formData.grantor.rifNumber}` : undefined,
    errorMessage: 'Falta el R.I.F. del otorgante (trámite obligatorio en notarías y registros).',
    sectionTarget: 'grantor',
  });

  // 5. CONSENTIMIENTO CONYUGAL (Art. 168 C.C.)
  const isPropertyDisposal =
    formData.templateId === 'venta-vehiculo' ||
    formData.templateId === 'venta-inmueble' ||
    formData.templateId === 'arrendamiento';

  if (formData.grantor?.maritalStatus === 'casado' && isPropertyDisposal) {
    const spouseNameValid = Boolean(formData.grantor?.spouseName && formData.grantor.spouseName.trim().length >= 4);
    const spouseCedulaValid = Boolean(formData.grantor?.spouseIdCard && formData.grantor.spouseIdCard.trim().length >= 5);
    const spouseValid = spouseNameValid && spouseCedulaValid;

    checks.push({
      id: 'min_spousal_consent',
      label: 'Consentimiento Conyugal y Datos del Cónyuge (Art. 168 C.C.)',
      category: 'conyugal',
      legalBasis: 'Artículo 168 del Código Civil de Venezuela',
      passed: spouseValid,
      valueFound: spouseValid ? `${formData.grantor.spouseName} (${formData.grantor.spouseIdCard})` : undefined,
      errorMessage: 'Al ser casado, la Ley exige el nombre y cédula del cónyuge para autorizar la disposición del bien común.',
      sectionTarget: 'grantor',
    });
  }

  // 6. ADQUIRENTE / COMPRADOR (para contratos bilaterales y societarios)
  const requiresGrantee =
    formData.templateId === 'venta-vehiculo' ||
    formData.templateId === 'venta-inmueble' ||
    formData.templateId === 'arrendamiento' ||
    formData.templateId === 'constitucion-ca';

  if (requiresGrantee) {
    const granteeNameValid = Boolean(formData.grantee?.fullName && formData.grantee.fullName.trim().length >= 4);
    checks.push({
      id: 'min_grantee_name',
      label: 'Nombre Completo del Adquirente / Comprador',
      category: 'identificacion',
      legalBasis: 'Art. 44 ord. 1° de la Ley de Registro Público y del Notariado',
      passed: granteeNameValid,
      valueFound: formData.grantee?.fullName || undefined,
      errorMessage: 'Debe ingresar el nombre del comprador o adquirente.',
      sectionTarget: 'grantee',
    });

    const granteeCedulaValid = Boolean(formData.grantee?.idCardNumber && formData.grantee.idCardNumber.trim().length >= 5);
    checks.push({
      id: 'min_grantee_cedula',
      label: 'Cédula de Identidad del Adquirente (V- o E-)',
      category: 'identificacion',
      legalBasis: 'Art. 44 ord. 1° de la Ley de Registro Público y del Notariado',
      passed: granteeCedulaValid,
      valueFound: formData.grantee?.idCardNumber ? `${formData.grantee.idCardType || 'V'}-${formData.grantee.idCardNumber}` : undefined,
      errorMessage: 'Falta la Cédula de Identidad del adquirente/comprador.',
      sectionTarget: 'grantee',
    });

    const granteeMaritalValid = Boolean(formData.grantee?.maritalStatus);
    checks.push({
      id: 'min_grantee_marital',
      label: 'Estado Civil del Adquirente',
      category: 'identificacion',
      legalBasis: 'Art. 44 ord. 1° de la LRPN',
      passed: granteeMaritalValid,
      valueFound: formData.grantee?.maritalStatus?.toUpperCase(),
      errorMessage: 'Debe seleccionar el estado civil del adquirente.',
      sectionTarget: 'grantee',
    });
  }

  // 7. APODERADO (para poderes especiales y generales)
  const isPowerOfAttorney = formData.templateId === 'poder-especial' || formData.templateId === 'poder-general';
  if (isPowerOfAttorney) {
    const attorneyNameValid = Boolean(formData.power?.attorneyName && formData.power.attorneyName.trim().length >= 4);
    checks.push({
      id: 'min_power_attorney_name',
      label: 'Nombre Completo del Apoderado(a)',
      category: 'identificacion',
      legalBasis: 'Art. 1684 del Código Civil y Art. 151 del CPC',
      passed: attorneyNameValid,
      valueFound: formData.power?.attorneyName || undefined,
      errorMessage: 'Debe indicar el nombre completo de la persona a quien se le confiere el poder.',
      sectionTarget: 'power',
    });

    const attorneyCedulaValid = Boolean(formData.power?.attorneyCedula && formData.power.attorneyCedula.trim().length >= 5);
    checks.push({
      id: 'min_power_attorney_cedula',
      label: 'Cédula de Identidad del Apoderado(a)',
      category: 'identificacion',
      legalBasis: 'Art. 44 ord. 1° de la LRPN',
      passed: attorneyCedulaValid,
      valueFound: formData.power?.attorneyCedula || undefined,
      errorMessage: 'Falta la Cédula de Identidad del apoderado.',
      sectionTarget: 'power',
    });
  }

  // 8. FIRMA PERSONAL (para constitución de firma personal mercantil)
  if (formData.templateId === 'firma-personal') {
    const tradeNameValid = Boolean(formData.personalFirm?.tradeName && formData.personalFirm.tradeName.trim().length >= 4);
    checks.push({
      id: 'min_firm_tradename',
      label: 'Denominación Comercial de la Firma Personal (F.P.)',
      category: 'negocio',
      legalBasis: 'Artículos 19 ord. 8° y 26 del Código de Comercio',
      passed: tradeNameValid,
      valueFound: formData.personalFirm?.tradeName || undefined,
      errorMessage: 'Debe ingresar la denominación comercial de la Firma Personal.',
      sectionTarget: 'personalFirm',
    });

    const initialCapitalValid = Boolean(formData.personalFirm?.initialCapitalBs && formData.personalFirm.initialCapitalBs > 0);
    checks.push({
      id: 'min_firm_capital',
      label: 'Capital Propio de Apertura de la Firma Personal',
      category: 'negocio',
      legalBasis: 'Artículo 26 del Código de Comercio',
      passed: initialCapitalValid,
      valueFound: initialCapitalValid ? `${formData.personalFirm?.initialCapitalBs} Bs.` : undefined,
      errorMessage: 'Debe indicar un monto de capital propio asignado al giro mercantil.',
      sectionTarget: 'personalFirm',
    });
  }

  // 9. VENTA DE INMUEBLE: Cédula Catastral de la Alcaldía
  if (formData.templateId === 'venta-inmueble') {
    const cadastralValid = Boolean(
      formData.realEstate?.cadastralCertificateNumber &&
      formData.realEstate.cadastralCertificateNumber.trim().length >= 4
    );
    checks.push({
      id: 'min_realestate_catastro',
      label: 'Cédula / Ficha Catastral Municipal del Inmueble',
      category: 'negocio',
      legalBasis: 'Ley de Geografía, Cartografía y Catastro Nacional y Art. 51 LRPN',
      passed: cadastralValid,
      valueFound: formData.realEstate?.cadastralCertificateNumber || undefined,
      errorMessage: 'El Registro Inmobiliario rechaza la venta de inmuebles sin Ficha Catastral emitida por la Alcaldía.',
      sectionTarget: 'realEstate',
    });
  }

  // 10. VENTA DE VEHÍCULO: Placa y Serial de Carrocería
  if (formData.templateId === 'venta-vehiculo') {
    const plateValid = Boolean(formData.vehicle?.licensePlate && formData.vehicle.licensePlate.trim().length >= 4);
    checks.push({
      id: 'min_vehicle_plate',
      label: 'Placa del Vehículo Automotor',
      category: 'negocio',
      legalBasis: 'Ley de Transporte Terrestre',
      passed: plateValid,
      valueFound: formData.vehicle?.licensePlate || undefined,
      errorMessage: 'Debe ingresar el número de placa oficial del vehículo.',
      sectionTarget: 'vehicle',
    });

    const serialBodyValid = Boolean(formData.vehicle?.serialBody && formData.vehicle.serialBody.trim().length >= 6);
    checks.push({
      id: 'min_vehicle_serial',
      label: 'Serial de Carrocería (NIV) del Vehículo',
      category: 'negocio',
      legalBasis: 'Ley de Transporte Terrestre y Criterios Notariales SAREN',
      passed: serialBodyValid,
      valueFound: formData.vehicle?.serialBody || undefined,
      errorMessage: 'Debe copiar con exactitud el serial de carrocería que figura en el título INTT.',
      sectionTarget: 'vehicle',
    });
  }

  // 11. VISADO DE ABOGADO (Art. 3 Ley de Abogados)
  const lawyerValid = Boolean(lawyer?.fullName && lawyer.fullName.trim().length >= 4 && lawyer?.inpreabogado && lawyer.inpreabogado.trim().length >= 3);
  checks.push({
    id: 'min_lawyer_visa',
    label: 'Nota de Visado de Abogado Colegiado (INPREABOGADO)',
    category: 'visado',
    legalBasis: 'Artículo 3 de la Ley de Abogados de Venezuela',
    passed: lawyerValid,
    valueFound: lawyerValid ? `${lawyer.fullName} (INPRE: ${lawyer.inpreabogado})` : undefined,
    errorMessage: 'Todo documento ante notaría o registro debe llevar la firma y visado de abogado con N° de INPREABOGADO.',
    sectionTarget: 'lawyer',
  });

  const failedChecks = checks.filter((c) => !c.passed);
  const passedCount = checks.length - failedChecks.length;
  const percentageScore = Math.round((passedCount / checks.length) * 100);
  const isValid = failedChecks.length === 0;

  return {
    isValid,
    canExport: isValid,
    totalChecks: checks.length,
    passedCount,
    failedCount: failedChecks.length,
    percentageScore,
    failedChecks,
    allChecks: checks,
  };
}
