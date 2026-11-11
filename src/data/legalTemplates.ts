import { DocumentFormData, LawyerProfile, SarenCriteriaConfig, RealEstateData, VehicleData, CompanyData } from '../types/legal';
import { formatLegalCurrency, numberToSpanishWords } from '../utils/numberToSpanishWords';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'notarial' | 'mercantil' | 'inmobiliario' | 'declaracion';
  categoryLabel: string;
  sarenOfficeType: 'Notaría Pública' | 'Registro Mercantil' | 'Registro Inmobiliario' | 'Registro Principal';
  description: string;
  requiredFields: string[];
  defaultTitle: string;
  legalFramework: string;
}

export const LEGAL_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'venta-vehiculo',
    name: 'Venta de Vehículo Automotor (Notaría)',
    category: 'notarial',
    categoryLabel: 'Notaría Pública',
    sarenOfficeType: 'Notaría Pública',
    description: 'Contrato notarial con características técnicas de título INTT, experticia P-51, solvencia de patente vehicular municipal, saneamiento y régimen conyugal.',
    requiredFields: ['grantor', 'grantee', 'vehicle'],
    defaultTitle: 'VENTA DE VEHÍCULO AUTOMOTOR',
    legalFramework: 'Ley de Transporte Terrestre, Arts. 1504 y 168 del Código Civil, Resoluciones SAREN',
  },
  {
    id: 'venta-inmueble',
    name: 'Venta de Inmueble (Registro Inmobiliario)',
    category: 'inmobiliario',
    categoryLabel: 'Registro Inmobiliario',
    sarenOfficeType: 'Registro Inmobiliario',
    description: 'Documento traslativo de dominio inmobiliario con Cédula Catastral de la Alcaldía, Solvencia de Derecho de Frente, linderos exactos y tradición.',
    requiredFields: ['grantor', 'grantee', 'realEstate'],
    defaultTitle: 'DOCUMENTO TRASLATIVO DE PROPIEDAD DE BIEN INMUEBLE',
    legalFramework: 'Ley de Registro Público y del Notariado (Art. 43-44), Ley de Geografía y Catastro, Código Civil',
  },
  {
    id: 'poder-especial',
    name: 'Poder Especial Notarial',
    category: 'notarial',
    categoryLabel: 'Notaría Pública',
    sarenOfficeType: 'Notaría Pública',
    description: 'Instrumento notarial para facultades determinadas (bancarias, enajenación de bien mueble/inmueble, judiciales o sucesorales).',
    requiredFields: ['grantor', 'power'],
    defaultTitle: 'PODER ESPECIAL DETERMINADO',
    legalFramework: 'Código Civil (Arts. 1684 y ss.) y Código de Procedimiento Civil (Arts. 151 y ss.)',
  },
  {
    id: 'poder-general',
    name: 'Poder General de Administración y Disposición',
    category: 'notarial',
    categoryLabel: 'Notaría Pública',
    sarenOfficeType: 'Notaría Pública',
    description: 'Poder amplio y cumplido para administración, riguroso dominio, disposición de bienes y representación procesal integral.',
    requiredFields: ['grantor', 'power'],
    defaultTitle: 'PODER GENERAL DE ADMINISTRACIÓN Y DISPOSICIÓN',
    legalFramework: 'Código Civil (Arts. 1687 y ss.), Código de Procedimiento Civil (Arts. 154 y ss.)',
  },
  {
    id: 'constitucion-ca',
    name: 'Constitución de C.A. / Pyme (Registro Mercantil)',
    category: 'mercantil',
    categoryLabel: 'Registro Mercantil',
    sarenOfficeType: 'Registro Mercantil',
    description: 'Estatutos sociales de Compañía Anónima conforme al Código de Comercio (Art. 211 y ss.), reserva legal 5% (Art. 262) y Comisario con CPC.',
    requiredFields: ['grantor', 'company'],
    defaultTitle: 'DOCUMENTO CONSTITUTIVO Y ESTATUTOS SOCIALES DE COMPAÑÍA ANÓNIMA',
    legalFramework: 'Código de Comercio (Arts. 200, 211, 242, 262, 287), Providencias SAREN Mercantil',
  },
  {
    id: 'firma-personal',
    name: 'Constitución de Firma Personal',
    category: 'mercantil',
    categoryLabel: 'Registro Mercantil',
    sarenOfficeType: 'Registro Mercantil',
    description: 'Manifestación de comerciante individual ante el Registro Mercantil para el ejercicio del comercio bajo denominación comercial.',
    requiredFields: ['grantor', 'personalFirm'],
    defaultTitle: 'DOCUMENTO CONSTITUTIVO DE FIRMA PERSONAL',
    legalFramework: 'Código de Comercio (Arts. 19 ord. 8° y 26)',
  },
  {
    id: 'declaracion-origen-fondos',
    name: 'Declaración Jurada de Origen Lícito de Fondos',
    category: 'declaracion',
    categoryLabel: 'Notarial / Bancaria',
    sarenOfficeType: 'Notaría Pública',
    description: 'Declaración jurada obligatoria según normativas SUDEBAN y SAREN contra legitimación de capitales y financiamiento al terrorismo.',
    requiredFields: ['grantor'],
    defaultTitle: 'DECLARACIÓN JURADA DE ORIGEN Y DESTINO LÍCITO DE FONDOS',
    legalFramework: 'Ley Orgánica contra la Delincuencia Organizada, Resolución SAREN-SUDEBAN N° 001/017',
  },
  {
    id: 'declaracion-no-vivienda',
    name: 'Declaración Jurada de No Poseer Vivienda',
    category: 'declaracion',
    categoryLabel: 'Notarial / Vivienda',
    sarenOfficeType: 'Notaría Pública',
    description: 'Manifestación jurada para trámites de adquisición de vivienda principal, créditos BANAVIH y exenciones fiscales.',
    requiredFields: ['grantor'],
    defaultTitle: 'DECLARACIÓN JURADA DE NO POSEER VIVIENDA PROPIA',
    legalFramework: 'Ley del Régimen Prestacional de Vivienda y Hábitat',
  },
  {
    id: 'arrendamiento-inmueble',
    name: 'Contrato de Arrendamiento Inmobiliario',
    category: 'inmobiliario',
    categoryLabel: 'Notaría / Registro Inmobiliario',
    sarenOfficeType: 'Notaría Pública',
    description: 'Arrendamiento de local comercial o vivienda con fijación de canon, fianza en garantía, conservación de inmueble y jurisdicción.',
    requiredFields: ['grantor', 'grantee', 'lease'],
    defaultTitle: 'CONTRATO DE ARRENDAMIENTO INMOBILIARIO',
    legalFramework: 'Decreto Ley de Arrendamiento Inmobiliario para el Uso Comercial (G.O. 40.418)',
  },
  {
    id: 'autorizacion-viaje-menor',
    name: 'Autorización de Viaje para Menores (LOPNNA)',
    category: 'notarial',
    categoryLabel: 'Notaría Pública',
    sarenOfficeType: 'Notaría Pública',
    description: 'Autorización notarial otorgada por los progenitores para viajes nacionales o internacionales de niños y adolescentes.',
    requiredFields: ['minorTravel'],
    defaultTitle: 'AUTORIZACIÓN NOTARIAL DE VIAJE PARA MENOR DE EDAD',
    legalFramework: 'Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (Arts. 392 y 393 LOPNNA)',
  },
];

/**
 * Builds standard Venezuelan identification paragraph for natural persons without abbreviations
 */
export function formatNaturalPersonIdentification(party: any, role: string = 'PARTE'): string {
  if (!party || !party.fullName) {
    return `[DATOS DE ${role.toUpperCase()} PENDIENTES]`;
  }

  const nacionalidad = party.nationality || 'venezolano(a)';
  const estadoCivil = party.maritalStatus || 'soltero(a)';
  const profesion = party.profession || 'comerciante';
  const cedulaLetra = party.idCardType || 'V';
  const cedulaNum = party.idCardNumber || '00.000.000';
  const rifLetra = party.rifType || 'V';
  const rifNum = party.rifNumber || '00000000-0';

  let spouseSnippet = '';
  if (party.maritalStatus === 'casado' && party.spouseName) {
    spouseSnippet = `, casado(a) con el/la ciudadano(a) ${party.spouseName.toUpperCase()}${
      party.spouseIdCard ? `, titular de la Cédula de Identidad número ${party.spouseIdCard}` : ''
    }`;
  }

  const addr = party.address;
  let addressText = 'domiciliado(a) en la República Bolivariana de Venezuela';
  if (addr) {
    const parts = [
      addr.street ? `Calle o Avenida ${addr.street}` : '',
      addr.building ? `Edificio o Casa ${addr.building}` : '',
      addr.apartment ? `Piso o Apartamento ${addr.apartment}` : '',
      addr.parish ? `Parroquia ${addr.parish}` : '',
      addr.municipality ? `Municipio ${addr.municipality}` : '',
      addr.state ? `Estado ${addr.state}` : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      addressText = `domiciliado(a) en ${parts.join(', ')}`;
    }
  }

  return `${party.fullName.toUpperCase()}, ${nacionalidad}, mayor de edad, de estado civil ${estadoCivil}${spouseSnippet}, de profesión u ocupación ${profesion}, titular de la Cédula de Identidad número ${cedulaLetra}-${cedulaNum}, y del Registro de Información Fiscal (R.I.F.) número ${rifLetra}-${rifNum}, ${addressText}`;
}

/**
 * Converts standard date string to formal legal words in Spanish
 * Example: "08/11/2026" -> "a los ocho días del mes de noviembre del año dos mil veintiséis"
 */
export function formatDateToLegalWords(dateStr: string): string {
  try {
    let day = 8;
    let monthIndex = 10;
    let year = 2026;

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      day = parseInt(parts[0], 10) || 8;
      monthIndex = (parseInt(parts[1], 10) || 11) - 1;
      year = parseInt(parts[2], 10) || 2026;
    } else {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        day = d.getDate();
        monthIndex = d.getMonth();
        year = d.getFullYear();
      }
    }

    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    const dayText = day === 1 ? 'al primer día' : `a los ${numberToSpanishWords(day).toLowerCase()} días`;
    const monthText = meses[monthIndex] || 'noviembre';
    const yearText = numberToSpanishWords(year).toLowerCase();

    return `${dayText} del mes de ${monthText} del año ${yearText}`;
  } catch {
    return 'en la fecha de su autenticación notarial';
  }
}

/**
 * Builds Lawyer Visa Paragraph (Art. 3 Ley de Abogados de Venezuela)
 */
export function formatLawyerVisaNote(lawyer: LawyerProfile): string {
  return `Documento redactado y visado por el abogado en ejercicio de la profesión ${lawyer.fullName.toUpperCase()}, debidamente inscrito en el Instituto de Previsión Social del Abogado (INPREABOGADO) bajo el número ${lawyer.inpreabogado || 'XXXXXX'}, y miembro activo del Colegio de Abogados del Estado ${lawyer.barAssociationState || 'Distrito Capital'} bajo el Registro número ${lawyer.barRegNumber || 'XXXXX'}, con domicilio procesal en ${lawyer.officeAddress || 'República Bolivariana de Venezuela'}.`;
}

/**
 * Builds SAREN Origin of Funds Mandatory Clause
 */
export const SAREN_ORIGIN_OF_FUNDS_CLAUSE = `CLÁUSULA DE ORIGEN Y DESTINO LÍCITO DE FONDOS: De conformidad con las disposiciones imperativas establecidas en la Ley Orgánica contra la Delincuencia Organizada y el Financiamiento al Terrorismo, la Ley de Registro Público y del Notariado (Gaceta Oficial N° 6.668 Extraordinario), así como las Resoluciones y Circulares conjuntas emanadas del Servicio Autónomo de Registros y Notarías (SAREN) y la Superintendencia de las Instituciones del Sector Bancario (SUDEBAN), LAS PARTES DECLARAN BAJO FE DE JURAMENTO que los fondos, dineros, valores, activos patrimoniales y recursos económicos utilizados para la celebración y pago del presente acto jurídico, provienen y se destinan a fines de estricta y absoluta licitud, derivados exclusivamente del legítimo y cotidiano ejercicio de sus actividades comerciales, profesionales y patrimoniales comprobables, y que de ninguna manera proceden ni guardan vinculación con actividades delictivas, de legitimación de capitales o de financiamiento al terrorismo nacional o internacional.`;

/**
 * Master Document Generator Function: Generates authentic Venezuelan legal draft adhering to all laws
 */
export function generateDocumentText(
  formData: DocumentFormData,
  criteria: SarenCriteriaConfig,
  lawyer: LawyerProfile
): string {
  const { templateId, grantor, grantee, vehicle, realEstate, company, personalFirm, power, lease, minorTravel, customClauses } = formData;
  const notaryOffice = `${criteria.officeType.toUpperCase()} DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}`;

  const grantorText = formatNaturalPersonIdentification(grantor, 'Otorgante');
  const granteeText = formatNaturalPersonIdentification(grantee, 'Adquirente');

  let body = '';

  switch (templateId) {
    // 1. COMPRAVENTA DE VEHÍCULO AUTOMOTOR
    case 'venta-vehiculo': {
      const v = vehicle || {};
      const priceText = formatLegalCurrency(v.salePriceBs || 0, 'BS');
      const usdRefText = v.salePriceUsd ? ` [con valor referencial de ${formatLegalCurrency(v.salePriceUsd, 'USD')}]` : '';

      let spousalClause = '';
      if (grantor?.maritalStatus === 'casado') {
        spousalClause = `\n\nCLÁUSULA DE CONSENTIMIENTO CONYUGAL (ARTÍCULO 168 DEL CÓDIGO CIVIL): Presente en este mismo acto el/la ciudadano(a) ${grantor.spouseName ? grantor.spouseName.toUpperCase() : '[NOMBRE DEL CÓNYUGE]'}, titular de la Cédula de Identidad número ${grantor.spouseIdCard || 'XX.XXX.XXX'}, cónyuge del VENDEDOR, debidamente facultado(a), quien expone: "Declaro que presto mi libre, formal y expreso consentimiento conyugal a mi cónyuge antes identificado para la venta, enajenación y traspaso definitivo del vehículo automotor objeto de este contrato, en cumplimiento de lo establecido en el Artículo 168 del Código Civil Venezolano, manifestando que no tengo objeción alguna que oponer al presente acto".`;
      }

      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, a quien en lo sucesivo y para los efectos de este contrato se denominará "EL VENDEDOR", por medio del presente documento declaro:

PRIMERO (OBJETO): Que doy en venta real, pura, simple, perfecta e irrevocable al ciudadano ${granteeText}, en lo sucesivo denominado "EL COMPRADOR", un vehículo de mi exclusiva propiedad, cuyas características técnicas y de identificación constan plenamente en el Certificado de Registro de Vehículo expedido por el Instituto Nacional de Transporte Terrestre (I.N.T.T.), bajo el número ${v.inttCertificateNumber || 'XXXXXXXXXX'}, y que a continuación se detallan:
• MARCA: ${v.brand ? v.brand.toUpperCase() : 'NO ESPECIFICADA'}
• MODELO: ${v.model ? v.model.toUpperCase() : 'NO ESPECIFICADO'}
• AÑO DE FABRICACIÓN: ${v.year || 'XXXX'}
• COLOR: ${v.color ? v.color.toUpperCase() : 'NO ESPECIFICADO'}
• CLASE: ${v.vehicleClass ? v.vehicleClass.toUpperCase() : 'AUTOMÓVIL'}
• TIPO: ${v.vehicleType ? v.vehicleType.toUpperCase() : 'SEDÁN'}
• USO: ${v.vehicleUse ? v.vehicleUse.toUpperCase() : 'PARTICULAR'}
• PLACAS: ${v.licensePlate ? v.licensePlate.toUpperCase() : 'XXX-XXX'}
• SERIAL DE CARROCERÍA (N.I.V.): ${v.serialBody ? v.serialBody.toUpperCase() : 'XXXXXXXXXXXXXXXXX'}
• SERIAL DE MOTOR: ${v.serialEngine ? v.serialEngine.toUpperCase() : 'XXXXXXXXXXXXXXXXX'}

SEGUNDO (PRECIO): El precio convenido y pactado para esta enajenación es la cantidad de ${priceText}${usdRefText}, suma que EL VENDEDOR declara haber recibido íntegramente a su entera y cabal satisfacción mediante ${v.paymentMethod || 'transferencia bancaria nacional'}, sirviendo el presente instrumento como formal y suficiente recibo de finiquito y cancelación total.

TERCERO (TRADICIÓN Y SANEAMIENTO): EL VENDEDOR hace formal tradición legal y entrega material de la posesión, llaves, documentación original y carnet de circulación del vehículo antes descrito a EL COMPRADOR, transmitiéndole la plena propiedad, el dominio y todas las acciones civiles y penales derivadas del mismo. Asimismo, EL VENDEDOR declara bajo fe de juramento que sobre dicho bien mueble no pesa ninguna clase de gravamen, medida judicial de embargo, prohibición de enajenar y gravar, prenda ni vicio oculto que impida o limite su libre transferencia, obligándose al saneamiento de ley conforme al Artículo 1.504 y concordantes del Código Civil venezolano.

CUARTO (EXPERTICIA Y PATENTE MUNICIPAL): Las partes hacen constar que el presente vehículo cuenta con la correspondiente constancia de Revisión Técnica y Legal de Verificación (Experticia P-51) practicada por las autoridades de Transporte Terrestre de la Policía Nacional Bolivariana ${v.technicalInspectionNumber ? `bajo el N° ${v.technicalInspectionNumber}` : ''}, así como la solvencia de pago del Impuesto sobre Patente de Vehículos (Trimestres Municipales) ante la Alcaldía del Municipio ${formData.municipality || criteria.municipality}.

QUINTO (RESPONSABILIDAD POSTERIOR Y TRASPASO): A partir del otorgamiento y autenticación de este documento ante este Despacho Notarial, EL COMPRADOR asume la total responsabilidad civil, penal, administrativa y fiscal derivada de la tenencia, conducción, circulación y uso del referido vehículo automotor, obligándose a tramitar ante el Instituto Nacional de Transporte Terrestre (INTT) el correspondiente traspaso y expedición del título a su nombre dentro del lapso fijado por la Ley de Tránsito Terrestre.${spousalClause}`;
      break;
    }

    // 2. COMPRAVENTA DE BIEN INMUEBLE (REGISTRO INMOBILIARIO SAREN)
    case 'venta-inmueble': {
      const r = realEstate || {};
      const priceText = formatLegalCurrency(r.salePriceBs || 0, 'BS');
      const usdRefText = r.salePriceUsd ? ` [con valor referencial de ${formatLegalCurrency(r.salePriceUsd, 'USD')}]` : '';

      let spousalClause = '';
      if (grantor?.maritalStatus === 'casado') {
        spousalClause = `\n\nCLÁUSULA DE CONSENTIMIENTO CONYUGAL (ARTÍCULO 168 DEL CÓDIGO CIVIL): Presente en este acto el/la ciudadano(a) ${grantor.spouseName ? grantor.spouseName.toUpperCase() : '[NOMBRE DEL CÓNYUGE]'}, titular de la Cédula de Identidad número ${grantor.spouseIdCard || 'XX.XXX.XXX'}, cónyuge del VENDEDOR, quien expone: "De conformidad con lo establecido en el Artículo 168 del Código Civil Venezolano, declaro que presto mi formal, libre y expreso consentimiento a mi referido cónyuge para la enajenación, venta pura, simple y perfecta del bien inmueble objeto del presente documento, no teniendo nada que reclamar al respecto".`;
      }

      body = `CIUDADANO:
REGISTRADOR INMOBILIARIO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, en lo sucesivo denominado "EL VENDEDOR", por medio del presente documento declaro:

PRIMERO (DESCRIPCIÓN DEL INMUEBLE): Que soy único y exclusivo propietario de un bien inmueble constituido por un ${r.propertyType ? r.propertyType.toUpperCase() : 'APARTAMENTO'}, ubicado en: ${r.propertyAddress || 'República Bolivariana de Venezuela'}, en jurisdicción del Municipio ${r.municipality || formData.municipality || criteria.municipality}, Estado ${r.state || criteria.state}, constante de una superficie aproximada de ${r.totalAreaM2 || 120} metros cuadrados (${r.totalAreaM2 || 120} m²)${r.condominiumPercentage ? `, al cual le corresponde un porcentaje de alícuota sobre las cosas comunes del ${r.condominiumPercentage}% según el Documento de Condominio` : ''}, cuyos linderos y medidas perimetrales son los siguientes:
• NORTE: ${r.northBoundary || 'Colinda con área común o calle pública'}
• SUR: ${r.southBoundary || 'Colinda con inmueble vecino'}
• ESTE: ${r.eastBoundary || 'Colinda con fachada principal o pasillo común'}
• OESTE: ${r.westBoundary || 'Colinda con lindero posterior'}

SEGUNDO (TRADICIÓN LEGAL): El inmueble antes descrito me pertenece en plena propiedad según consta en documento debidamente protocolizado ante el ${r.registryTitleData || 'Registro Inmobiliario competente de la Circunscripción Judicial del Estado ' + criteria.state + ' bajo el N° XX, Tomo YY, Protocolo Primero'}.

TERCERO (CATASTRO Y SOLVENCIA MUNICIPAL): El inmueble se encuentra debidamente inscrito en el Catastro Municipal, asignándosele el Código de Cédula Catastral número ${r.cadastralCertificateNumber || 'CATASTRO-XXXXX'}, expedida por la Dirección de Catastro de la Alcaldía del Municipio ${r.municipality || formData.municipality || criteria.municipality}, encontrándose plenamente solvente con el Impuesto sobre Inmuebles Urbanos (Derecho de Frente) bajo la Solvencia Municipal número ${r.municipalSolvencyNumber || 'SOLV-XXXXX'}, correspondiente al año fiscal ${r.municipalSolvencyYear || '2026'}.

CUARTO (PRECIO Y FORMA DE PAGO): El precio convenido para esta venta es la cantidad de ${priceText}${usdRefText}, suma que EL VENDEDOR declara haber recibido íntegramente a su entera satisfacción mediante ${r.paymentMethod || 'transferencia bancaria bancaria'}, otorgando formal recibo de finiquito y cancelación total por el presente documento.

QUINTO (TRADICIÓN Y SANEAMIENTO): EL VENDEDOR transmite a EL COMPRADOR la plena propiedad, posesión y dominio del inmueble libre de todo gravamen, hipoteca, anticresis, prohibición judicial de enajenar y gravar o litigio pendiente, obligándose al saneamiento de ley conforme al Artículo 1.504 del Código Civil venezolano.${spousalClause}`;
      break;
    }

    // 3. PODER ESPECIAL
    case 'poder-especial': {
      const p = power || {};
      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, por el presente instrumento declaro: Que confiero PODER ESPECIAL, pero tan amplio y suficiente cuanto en derecho se requiera, al ciudadano(a) ${p.attorneyName ? p.attorneyName.toUpperCase() : '[NOMBRE DEL APODERADO]'}, titular de la Cédula de Identidad número ${p.attorneyCedula || 'XX.XXX.XXX'}, y Registro de Información Fiscal (R.I.F.) número ${p.attorneyRif || 'V-XXXXXXXX-X'}, domiciliado(a) en ${p.attorneyAddress || criteria.state}, para que en mi propio nombre, representación y beneficio, sostenga, defienda y ejecute las facultades que a continuación se discriminan:

FACULTADES CONFERIDAS:
${p.powerScope || 'Gestionar, tramitar y suscribir cuantas peticiones, solicitudes, recursos y declaraciones sean pertinentes ante cualquier ente u organismo público o privado de la República Bolivariana de Venezuela, especialmente ante el Servicio Autónomo de Registros y Notarías (SAREN), Servicio Nacional Integrado de Administración Aduanera y Tributaria (SENIAT), Instituto Venezolano de los Seguros Sociales (IVSS), instituciones bancarias públicas y privadas nacionales, así como ante autoridades administrativas y municipales.'}

${p.specificAssetDescription ? `SOBRE EL SIGUIENTE BIEN U OBJETO ESPECÍFICO: ${p.specificAssetDescription}` : ''}

Asimismo, faculto expresamente a mi apoderado(a) para que firme y consigne solicitudes, reciba y retire documentos originales, cheques, constancias, notificaciones y resoluciones; convenga, desista, transija y comprometa en árbitros conforme a derecho${
        p.allowSubdelegation
          ? ', facultándolo expresamente para sustituir el presente poder en todo o en parte en abogado de su confianza, reservándose o no su ejercicio.'
          : ', quedando expresamente prohibida la sustitución o delegación del presente mandato sin mi previa y escrita autorización.'
      }

En consecuencia, el presente poder confiere la personería jurídica necesaria para llevar a su término cabal el encargo conferido.`;
      break;
    }

    // 4. PODER GENERAL
    case 'poder-general': {
      const p = power || {};
      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, por el presente documento declaro: Que confiero PODER GENERAL DE ADMINISTRACIÓN Y DISPOSICIÓN, amplio, cumplido y bastante cuanto en derecho sea menester, al ciudadano(a) ${p.attorneyName ? p.attorneyName.toUpperCase() : '[NOMBRE DEL APODERADO]'}, titular de la Cédula de Identidad número ${p.attorneyCedula || 'XX.XXX.XXX'}, domiciliado(a) en ${p.attorneyAddress || criteria.state}, para que ejerza la más amplia y soberana representación de todos mis derechos, bienes, acciones y negocios de cualquier naturaleza jurídica que posea en la República Bolivariana de Venezuela o en el extranjero.

En ejercicio del presente mandato, mi apoderado(a) queda facultado expresamente para:
1. FACULTADES DE ADMINISTRACIÓN: Administrar todos mis bienes muebles e inmuebles, derechos reales y créditos; darlos en arrendamiento por plazos superiores o inferiores a dos (2) años, fijar cánones, exigir solvencias, percibir y cobrar sumas de dinero adeudadas, otorgar cartas de pago y recibos de finiquito.
2. FACULTADES DE DISPOSICIÓN: Vender, gravar, enajenar, permutar, ceder, donar, pignorar o hipotecar bienes muebles e inmuebles de mi propiedad, fijando precios, términos, plazos y condiciones, y suscribir los correspondientes documentos públicos o auténticos ante Notarías Públicas y Registros Mercantiles e Inmobiliarios del SAREN.
3. FACULTADES BANCARIAS Y MERCANTILES: Abrir, movilizar, clausurar cuentas corrientes, de ahorros y en moneda extranjera en cualquier banco del Sistema Financiero Nacional; librar, endosar, protestar y cobrar cheques, pagarés, letras de cambio y transferencias electrónicas.
4. REPRESENTACIÓN JUDICIAL: Representarme en juicio ante cualquier Tribunal de la República, sea de jurisdicción ordinaria o especial, de conformidad con lo establecido en los Artículos 151, 154 y siguientes del Código de Procedimiento Civil venezolano, con facultades para convenir, desistir, transigir, darse por citado y notificado, absolver y promover posiciones juradas, recusar y nombrar árbitros o conjueces.

El apoderado queda autorizado para suscribir los finiquitos necesarios en defensa de mis legítimos intereses patrimoniales.`;
      break;
    }

    // 5. CONSTITUCIÓN DE COMPAÑÍA ANÓNIMA (REGISTRO MERCANTIL)
    case 'constitucion-ca': {
      const c = company || {};
      const capitalText = formatLegalCurrency(c.totalCapitalBs || 150000, 'BS');
      const shareValText = formatLegalCurrency(c.shareNominalValueBs || 100, 'BS');

      body = `CIUDADANO:
REGISTRADOR MERCANTIL DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Nosotros, ${grantorText}, y ${granteeText}, por medio del presente documento declaramos: Que hemos convenido en constituir, como en efecto formalmente constituimos mediante este acto, una Sociedad Mercantil bajo la forma de Compañía Anónima (C.A.), la cual se regirá por las cláusulas de este Documento Constitutivo, redactado con la suficiente amplitud para que sirva a la vez de Estatutos Sociales, y en lo no previsto, por las disposiciones pertinentes del Código de Comercio de la República Bolivariana de Venezuela.

TÍTULO I: DENOMINACIÓN, DOMICILIO, OBJETO Y DURACIÓN
CLÁUSULA PRIMERA: La denominación de la sociedad es "${c.companyName ? c.companyName.toUpperCase() : 'EMPRESA COMERCIAL, C.A.'}".
CLÁUSULA SEGUNDA: El domicilio procesal y fiscal de la compañía se establece en ${c.fiscalDomicile || 'la ciudad de Caracas, Municipio Libertador, Distrito Capital'}, pudiendo establecer sucursales, agencias o representaciones en cualquier otro lugar del territorio nacional o en el exterior.
CLÁUSULA TERCERA: El objeto de la sociedad mercantil será: ${c.commercialPurpose || 'La compra, venta, importación, exportación, distribución, comercialización al mayor y detal de bienes, suministros industriales, equipos tecnológicos, así como la prestación de servicios profesionales de asesoría, consultoría técnica y cualesquiera otros actos de lícito comercio conexos.'}
CLÁUSULA CUARTA: La duración de la sociedad será de cincuenta (50) años, contados a partir de su inscripción en el Registro Mercantil, prorrogables por decisión de la Asamblea General de Accionistas.

TÍTULO II: CAPITAL SOCIAL, ACCIONES Y RESERVA LEGAL
CLÁUSULA QUINTA: El capital social de la compañía es la cantidad de ${capitalText}, dividido y representado en ${c.totalShares || 1500} acciones nominativas no convertibles al portador, con un valor nominal de ${shareValText} cada una, las cuales confieren iguales derechos y obligaciones a sus titulares.
CLÁUSULA SEXTA: El capital social ha sido íntegramente suscrito y pagado por los accionistas según inventario de bienes muebles de apertura debidamente certificado por Contador Público Colegiado o comprobante de depósito bancario que se acompaña al presente documento.
CLÁUSULA SÉPTIMA (FONDO DE RESERVA LEGAL OBLIGATORIO - ARTÍCULO 262 DEL CÓDIGO DE COMERCIO): De las utilidades líquidas y recaudadas obtenidas por la sociedad en cada ejercicio económico, se apartará un cinco por ciento (5%) anual para formar el Fondo de Reserva Legal, hasta que este fondo alcance por lo menos al diez por ciento (10%) del capital social.

TÍTULO III: DE LA ADMINISTRACIÓN Y DIRECCIÓN
CLÁUSULA OCTAVA: La dirección y administración general de la sociedad estará a cargo de una Junta Directiva integrada por un Presidente (${c.presidentName ? c.presidentName.toUpperCase() : 'PRESIDENTE'}) y un Vicepresidente (${c.vicePresidentName ? c.vicePresidentName.toUpperCase() : 'VICEPRESIDENTE'}), quienes durarán cinco (5) años en sus cargos y podrán ser reelegidos indefinidamente.
CLÁUSULA NOVENA: El Presidente y el Vicepresidente tendrán las más amplias facultades de administración y disposición para obligar a la sociedad, suscribir contratos, aperturar y movilizar cuentas bancarias en bolívares y moneda extranjera, contratar personal y otorgar poderes.

TÍTULO IV: DEL COMISARIO Y EJERCICIO ECONÓMICO
CLÁUSULA DÉCIMA: La sociedad tendrá un Comisario mercantil titular designado por la Asamblea, quien tendrá las atribuciones fijadas por el Código de Comercio. Para el primer período estatutario se designa al Licenciado en Contaduría Pública ${c.commissionerName ? c.commissionerName.toUpperCase() : 'LIC. COMISARIO CPC'}, titular del CPC número ${c.commissionerCpcNumber || 'XXXXX'}, acompañándose la correspondiente carta de aceptación del cargo.
CLÁUSULA DÉCIMA PRIMERA: El ejercicio económico fiscal de la compañía comenzará el primero (1°) de enero y finalizará el treinta y uno (31) de diciembre de cada año, con excepción del primer ejercicio que comenzará en la fecha de registro.`;
      break;
    }

    // 6. FIRMA PERSONAL
    case 'firma-personal': {
      const f = personalFirm || {};
      const capitalText = formatLegalCurrency(f.initialCapitalBs || 50000, 'BS');

      body = `CIUDADANO:
REGISTRADOR MERCANTIL DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, ocurro respetuosamente ante su competente autoridad a fin de manifestar:
De conformidad con lo dispuesto en el Artículo 19, ordinal 8°, y Artículo 26 del Código de Comercio vigente, he resuelto establecer formalmente una FIRMA PERSONAL para el ejercicio de actividades mercantiles y comerciales en el territorio de la República Bolivariana de Venezuela, la cual operará bajo las siguientes especificaciones:

PRIMERA: La Firma Personal girará bajo la denominación comercial de "${f.tradeName ? f.tradeName.toUpperCase() : 'DISTRIBUIDORA Y COMERCIALIZADORA COMERCIAL F.P.'}".
SEGUNDA: El domicilio fiscal de la Firma Personal queda fijado en: ${f.domicile || 'la ciudad de Caracas, República Bolivariana de Venezuela'}, pudiendo aperturar sucursales o depósitos en cualquier parte del país.
TERCERA: El objeto y actividad comercial principal a que se dedicará la firma será: ${f.commercialActivity || 'La compra, venta, consignación, distribución, comercialización al mayor y detal de víveres, mercancía seca, repuestos, suministros y prestación de servicios generales de lícito comercio.'}
CUARTA: El capital propio y exclusivo que destino para la explotación del giro comercial de esta Firma Personal es la cantidad de ${capitalText}, el cual he aportado íntegramente de mi propio peculio e inventario de apertura.

Ruego a usted, ciudadano Registrador Mercantil, se sirva ordenar la inscripción, fijación y publicación del presente documento constitutivo conforme a la Ley, y expedirme las copias certificadas de rigor.`;
      break;
    }

    // 7. DECLARACIÓN JURADA DE ORIGEN DE FONDOS
    case 'declaracion-origen-fondos': {
      body = `CIUDADANO:
NOTARIO PÚBLICO / REGISTRADOR PRINCIPAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, en pleno goce de mis facultades mentales y en estricto cumplimiento de la Ley Orgánica contra la Delincuencia Organizada y Financiamiento al Terrorismo, la normativa dictada por la SUDEBAN y las directrices emanadas del Servicio Autónomo de Registros y Notarías (SAREN), procedo a formalizar bajo fe de juramento la presente:

DECLARACIÓN JURADA DE ORIGEN Y DESTINO LÍCITO DE FONDOS:

PRIMERO: Declaro de manera formal, expresa, libre y bajo juramento, que todos los fondos, dineros, valores, activos patrimoniales y recursos económicos que actualmente poseo, movilizo y destino para la ejecución de actos jurídicos, notariales, registrales o bancarios, son producto legítimo del fruto de mi trabajo lícito, continuado y honesto en el ejercicio de mis actividades profesionales, comerciales y productivas legalmente demostrables.

SEGUNDO: Igualmente declaro que dichos caudales y recursos no provienen de actividades relacionadas de manera directa o indirecta con el narcotráfico, tráfico de estupefacientes y sustancias psicotrópicas, legitimación de capitales, corrupción, delincuencia organizada, financiamiento al terrorismo ni de ninguna otra actividad tipificada y sancionada por la legislación penal venezolana o tratados internacionales ratificados por la República.

TERCERO: Autorizo plenamente a los entes de fiscalización, órganos jurisdiccionales y entidades bancarias a verificar la veracidad de la información patrimonial suministrada, asumiendo cualquier responsabilidad penal o civil en caso de falsedad u omisión.`;
      break;
    }

    // 8. DECLARACIÓN JURADA DE NO POSEER VIVIENDA
    case 'declaracion-no-vivienda': {
      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Yo, ${grantorText}, ante usted respetuosamente comparezco para exponer:
A los fines de dar cumplimiento a los requerimientos normativos del Banco Nacional de Vivienda y Hábitat (BANAVIH), de conformidad con la Ley del Régimen Prestacional de Vivienda y Hábitat y la Ley Especial de Protección al Deudor Hipotecario de Vivienda, declaro bajo la gravedad del juramento lo siguiente:

PRIMERO: Que no soy propietario(a), ni copropietario(a), ni beneficiario(a) de ningún inmueble destinado a vivienda principal en todo el territorio de la República Bolivariana de Venezuela, ni disfruto de derecho de habitación vitalicio sobre bien inmueble residencial alguno.

SEGUNDO: Que mi núcleo familiar actual habita en calidad de ${grantor.maritalStatus === 'casado' ? 'inquilinos / agregados' : 'inquilino / residencia temporal'}, y que la adquisición que pretendo celebrar recae sobre un bien inmueble que será destinado estricta y exclusivamente a constituir el asiento del hogar y la VIVIENDA PRINCIPAL mía y de mi grupo familiar inmediato.

TERCERO: Presto la presente declaración jurada a fin de que surta los plenos efectos legales para las exoneraciones arancelarias e impositivas previstas en la Ley ante el Servicio Autónomo de Registros y Notarías (SAREN) y los organismos de administración tributaria.`;
      break;
    }

    // 9. CONTRATO DE ARRENDAMIENTO INMOBILIARIO
    case 'arrendamiento-inmueble': {
      const l = lease || {};
      const canonBsText = formatLegalCurrency(l.monthlyRentBs || 0, 'BS');
      const canonUsdText = l.monthlyRentUsd ? ` [equivalente a ${formatLegalCurrency(l.monthlyRentUsd, 'USD')}]` : '';

      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Entre el ciudadano ${grantorText}, denominado en lo adelante "EL ARRENDADOR", por una parte; y por la otra, el ciudadano ${granteeText}, denominado en lo adelante "EL ARRENDATARIO", se ha convenido en celebrar el presente CONTRATO DE ARRENDAMIENTO INMOBILIARIO bajo las siguientes estipulaciones:

PRIMERA (INMUEBLE): EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO un bien inmueble de su propiedad ubicado en: ${l.propertyAddress || 'República Bolivariana de Venezuela'}, identificado catastralmente bajo el número ${l.propertyCadastralNumber || 'CATASTRO-XXXXXXXX'}, cuyos linderos y medidas se encuentran debidamente descritos en el título de propiedad protocolizado.

SEGUNDA (DESTINO): El inmueble objeto del presente contrato será destinado única y exclusivamente para el uso ${l.intendedUse || 'COMERCIAL'}, no pudiendo EL ARRENDATARIO variar su destino, ni subarrendarlo, cederlo o traspasarlo en todo o en parte sin la previa y expresa autorización por escrito de EL ARRENDADOR.

TERCERA (CANON Y PAGO): El canon mensual de arrendamiento convenido entre las partes es la cantidad de ${canonBsText}${canonUsdText}, el cual deberá ser cancelado dentro de los primeros cinco (5) días hábiles de cada mes mediante transferencia bancaria a la cuenta designada por EL ARRENDADOR.

CUARTA (DEPÓSITO EN GARANTÍA): EL ARRENDATARIO entrega a EL ARRENDADOR en este acto la cantidad equivalente a ${l.depositMonths || 3} meses de canon en concepto de depósito en garantía, el cual servirá para responder por desperfectos causados al inmueble o deudas pendientes de servicios públicos (electricidad, agua potable, aseo urbano, telecomunicaciones), siendo reintegrado al término del contrato previa entrega formal del inmueble desocupado y en perfecto estado.

QUINTA (DURACIÓN): El término de duración del presente contrato se fija en doce (12) meses fijos y consecutivos a partir de la firma del presente instrumento, renovable de mutuo acuerdo mediante documento autenticado.`;
      break;
    }

    // 10. AUTORIZACIÓN DE VIAJE PARA MENOR
    case 'autorizacion-viaje-menor': {
      const m = minorTravel || {};
      body = `CIUDADANO:
NOTARIO PÚBLICO DE LA CIRCUNSCRIPCIÓN JUDICIAL DEL ESTADO ${criteria.state.toUpperCase()}.
SU DESPACHO.-

Nosotros, ${m.fatherFullName ? m.fatherFullName.toUpperCase() : '[NOMBRE DEL PADRE]'}, venezolano, mayor de edad, titular de la Cédula de Identidad número V-${m.fatherCedula || 'XX.XXX.XXX'}; y ${m.motherFullName ? m.motherFullName.toUpperCase() : '[NOMBRE DE LA MADRE]'}, venezolana, mayor de edad, titular de la Cédula de Identidad número V-${m.motherCedula || 'XX.XXX.XXX'}, ambos en pleno ejercicio de la PATRIA POTESTAD sobre nuestro(a) hijo(a) menor de edad: ${m.minorFullName ? m.minorFullName.toUpperCase() : '[NOMBRE DEL MENOR]'}, nacido(a) en fecha ${m.minorBirthDate || 'XX de mes de XXXX'}, titular de la Cédula de Identidad / Pasaporte número ${m.minorPassportNumber || 'XXXXXXXXX'}; de conformidad con lo establecido en el Artículo 392 y 393 de la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (LOPNNA), por medio del presente documento declaramos:

PRIMERO: Autorizamos expresamente a nuestro(a) referido(a) hijo(a) menor de edad para que realice un viaje con destino a: ${m.travelDestination ? m.travelDestination.toUpperCase() : 'EL EXTERIOR'}.
SEGUNDO: El viaje se llevará a cabo ${m.isInternational ? 'en ruta INTERNACIONAL' : 'en ruta NACIONAL'} mediante ${m.airlineOrTransport || 'transporte aéreo comercial'}, con fecha de salida estimada el ${m.departureDate || 'XX/XX/XXXX'} y fecha de retorno fijada para el ${m.returnDate || 'XX/XX/XXXX'}.
TERCERO: El menor viajará bajo el cuidado, supervisión y compañía exclusiva del ciudadano(a) ${m.travelCompanionName ? m.travelCompanionName.toUpperCase() : '[NOMBRE DEL ACOMPAÑANTE]'}, titular de la Cédula de Identidad número ${m.travelCompanionCedula || 'XX.XXX.XXX'}, quien velará por su bienestar e integridad durante todo el trayecto.

Solicitamos a las autoridades migratorias del SAIME, del INAC y demás cuerpos policiales y de protección, prestar la debida colaboración para el libre tránsito del menor.`;
      break;
    }

    default:
      body = `DOCUMENTO JURÍDICO NOTARIAL / REGISTRAL\n\nOtorgante: ${grantorText}\nAdquirente: ${granteeText}`;
  }

  // Include SAREN Origin of Funds clause if toggled or mandated
  let originOfFundsSnippet = '';
  if (formData.includeOriginOfFunds) {
    originOfFundsSnippet = `\n\n${SAREN_ORIGIN_OF_FUNDS_CLAUSE}`;
  }

  // Custom clauses added by lawyer
  let customClausesSnippet = '';
  if (customClauses && customClauses.length > 0) {
    customClausesSnippet = '\n\n' + customClauses.map((c, idx) => `CLÁUSULA ESPECIAL ADICIONAL ${idx + 1}: ${c}`).join('\n\n');
  }

  // Strict Protocol closure lines if requested
  let closureLines = '';
  if (formData.strictProtocolFormat) {
    closureLines = `\n\n----------------------------------------------------------------------------------------------------\n(LÍNEA DE CIERRE PROTOCOLAR SAREN - PROHIBIDO CUALQUIER AGREGADO POSTERIOR)\n----------------------------------------------------------------------------------------------------`;
  }

  // Lawyer visa note (Art. 3 Ley de Abogados)
  let visaSnippet = '';
  if (formData.includeLawyerVisa) {
    visaSnippet = `\n\n----------------------------------------------------------------------------------------------------\nNOTA DE VISADO DE ABOGADO (Art. 3 Ley de Abogados):\n${formatLawyerVisaNote(lawyer)}`;
  }

  // Date and Signatures block
  const formattedLegalDate = formatDateToLegalWords(formData.date);
  const cityText = formData.city || criteria.municipality || 'Caracas';

  const signaturesSnippet = `\n\nEn la ciudad de ${cityText}, ${formattedLegalDate}, a la fecha de su inserción en el Protocolo Notarial/Registral respectivo.


________________________________________              ________________________________________
             EL OTORGANTE                                          EL ADQUIRENTE / RECEPTOR
    Cédula de Identidad N° ${grantor?.idCardType || 'V'}-${grantor?.idCardNumber || 'XX.XXX.XXX'}                       Cédula de Identidad N° ${grantee?.idCardType || 'V'}-${grantee?.idCardNumber || 'XX.XXX.XXX'}
    R.I.F. N° ${grantor?.rifType || 'V'}-${grantor?.rifNumber || 'XXXXXXXX-X'}                  R.I.F. N° ${grantee?.rifType || 'V'}-${grantee?.rifNumber || 'XXXXXXXX-X'}`;

  return `${body}${originOfFundsSnippet}${customClausesSnippet}${closureLines}${visaSnippet}${signaturesSnippet}`;
}
