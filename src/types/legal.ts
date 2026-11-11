export type PartyType = 'natural' | 'juridica';

export type MaritalStatus = 'soltero' | 'casado' | 'divorciado' | 'viudo';

export interface AddressInfo {
  state: string;
  municipality: string;
  parish: string;
  street: string;
  building: string;
  apartment: string;
}

export interface ClientParty {
  id: string;
  type: PartyType;
  fullName: string; // Nombre completo o Razón Social
  idCardType: 'V' | 'E';
  idCardNumber: string;
  rifType: 'V' | 'E' | 'J' | 'G';
  rifNumber: string;
  nationality: string; // venezolano/a, extranjero/a
  maritalStatus: MaritalStatus;
  spouseName?: string;
  spouseIdCard?: string;
  profession: string;
  address: AddressInfo;
  phone: string;
  email: string;
  // Solo para personas jurídicas
  legalRepName?: string;
  legalRepCedula?: string;
  legalRepRole?: string; // Presidente, Director General, etc.
  mercantileRegistrationData?: string; // Inscrita en el Registro Mercantil X en fecha...
  notes?: string;
}

export interface LawyerProfile {
  fullName: string;
  inpreabogado: string;
  barAssociationState: string; // ej. Distrito Capital, Miranda
  barRegNumber: string;
  officeAddress: string;
  phone: string;
  email: string;
}

export type TemplateCategory = 'notarial' | 'mercantil' | 'inmobiliario' | 'declaracion';

export interface VehicleData {
  brand: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string; // Placa
  serialBody: string; // NIV / Serial Carrocería
  serialEngine: string; // Serial Motor
  vehicleClass: string; // Automóvil, Camioneta, Moto
  vehicleType: string; // Sedán, Sport Wagon, Pick-Up
  vehicleUse: string; // Particular, Carga, Transporte
  inttCertificateNumber: string; // Certificado de Registro de Vehículo N°
  salePriceBs: number;
  salePriceUsd: number;
  paymentMethod: string; // Transferencia bancaria, divisas en efectivo, etc.
  bankReference?: string;
  // Exigencias técnicas y municipales estrictas
  technicalInspectionNumber?: string; // Experticia Legal INTT P-51
  technicalInspectionDate?: string;
  municipalVehicleTaxPaid?: boolean; // Trimestres de patente vehicular pagados en el municipio
  spousalConsentArticle168?: boolean; // Consentimiento conyugal Art. 168 C.C.
}

export interface RealEstateData {
  propertyType: 'Apartamento' | 'Casa' | 'Local Comercial' | 'Oficina' | 'Terreno' | 'Galpón Industrial';
  propertyAddress: string;
  municipality: string;
  state: string;
  cadastralCertificateNumber: string; // Cédula Catastral obligatoria emitida por la Alcaldía
  cadastralYear: string;
  municipalSolvencyNumber: string; // Solvencia de Inmuebles Urbanos / Derecho de Frente
  municipalSolvencyYear: string;
  registryTitleData: string; // Registro Inmobiliario de origen: N°, Tomo, Protocolo, Fecha
  northBoundary: string;
  southBoundary: string;
  eastBoundary: string;
  westBoundary: string;
  totalAreaM2: number;
  condominiumPercentage?: number; // % Alícuota en el documento de condominio
  salePriceBs: number;
  salePriceUsd: number;
  paymentMethod: string;
  encumbranceCertificate: boolean; // Certificación de Gravamen al día
  spousalConsentArticle168: boolean;
}

export interface CompanyData {
  companyName: string; // ej. INVERSIONES & SUMINISTROS 2026, C.A.
  fiscalDomicile: string;
  commercialPurpose: string; // Objeto social
  totalCapitalBs: number;
  totalShares: number;
  shareNominalValueBs: number;
  presidentName: string;
  presidentCedula: string;
  vicePresidentName: string;
  vicePresidentCedula: string;
  commissionerName: string; // Comisario
  commissionerCpcNumber: string; // Colegiado CPC N°
  fiscalYearEnd: string; // 31 de diciembre
  reserveFundPercentage: number; // 5% reserva legal Art. 262 C.Com
  reserveFundLimitPercentage: number; // 10%
  openingInventoryCertified: boolean;
  commissionerAcceptanceLetter: boolean;
}

export interface PersonalFirmData {
  tradeName: string; // ej. COMERCIALIZADORA GÓMEZ F.P.
  ownerName: string;
  ownerCedula: string;
  ownerRif: string;
  initialCapitalBs: number;
  commercialActivity: string;
  domicile: string;
}

export interface PowerOfAttorneyData {
  attorneyName: string; // Apoderado
  attorneyCedula: string;
  attorneyRif: string;
  attorneyAddress: string;
  powerScope: string; // Amplio, Específico para venta de inmueble, Representación ante Seniat, etc.
  specificAssetDescription?: string;
  allowSubdelegation: boolean;
}

export interface LeaseData {
  propertyAddress: string;
  propertyCadastralNumber: string;
  propertyRegistrationTitle: string;
  intendedUse: 'Comercial' | 'Residencial' | 'Oficina';
  monthlyRentUsd: number;
  monthlyRentBs: number;
  depositMonths: number;
  contractDurationMonths: number;
  penaltyLateInterest: number;
}

export interface MinorTravelData {
  minorFullName: string;
  minorCedula?: string;
  minorBirthDate: string;
  minorPassportNumber: string;
  fatherFullName: string;
  fatherCedula: string;
  motherFullName: string;
  motherCedula: string;
  travelCompanionName: string;
  travelCompanionCedula: string;
  travelDestination: string; // ej. Madrid, España / Porlamar, Nueva Esparta
  isInternational: boolean;
  departureDate: string;
  returnDate: string;
  airlineOrTransport: string;
}

export interface DocumentFormData {
  templateId: string;
  title: string;
  date: string;
  city: string;
  state: string;
  municipality: string;
  grantorId?: string; // Otorgante / Vendedor / Propietario / Podante
  granteeId?: string; // Adquirente / Comprador / Inquilino / Apoderado
  // Raw party overrides if not using client ID
  grantor: Partial<ClientParty>;
  grantee: Partial<ClientParty>;
  // Specific payload data
  vehicle?: Partial<VehicleData>;
  realEstate?: Partial<RealEstateData>;
  company?: Partial<CompanyData>;
  personalFirm?: Partial<PersonalFirmData>;
  power?: Partial<PowerOfAttorneyData>;
  lease?: Partial<LeaseData>;
  minorTravel?: Partial<MinorTravelData>;
  // Specific clauses toggles
  includeOriginOfFunds: boolean;
  includeLawyerVisa: boolean;
  includeArbitrationClause: boolean;
  strictProtocolFormat: boolean; // Fechas en letras completas, líneas de cierre, 30 líneas
  customClauses: string[];
}

export interface SarenCriteriaConfig {
  state: string;
  municipality: string;
  officeType: 'Notaría Pública' | 'Registro Mercantil' | 'Registro Inmobiliario' | 'Registro Principal';
  officeName: string;
  topMarginMm: number; // default 40
  bottomMarginMm: number; // default 25
  leftMarginMm: number; // default 40 (crucial for protocol stitching)
  rightMarginMm: number; // default 20
  fontFamily: 'Times New Roman' | 'Arial' | 'Courier New';
  fontSizePt: number; // default 12
  lineSpacing: number; // default 1.5
  enableProtocolLines: boolean; // 1-30 protocol lines
  strictSarenFormatting: boolean;
  bcvRate: number; // Official USD to VES rate
}

export interface FeeCalculationItem {
  concept: string;
  basis: string;
  amountBs: number;
  amountUsd: number;
  category: 'saren' | 'timbre_estadal' | 'tasa_municipal' | 'habilitacion' | 'honorarios_abogado';
}

export interface FeeCalculationResult {
  state: string;
  municipalityName: string;
  operationType: string;
  declaredAmountBs: number;
  declaredAmountUsd: number;
  bcvRate: number;
  pageCount: number;
  grantorCount: number;
  expressExpedited: boolean;
  items: FeeCalculationItem[];
  subtotalSarenBs: number;
  subtotalSarenUsd: number;
  subtotalTimbresBs: number;
  subtotalTimbresUsd: number;
  subtotalMunicipalBs: number;
  subtotalMunicipalUsd: number;
  subtotalHonorariosBs: number;
  subtotalHonorariosUsd: number;
  totalBs: number;
  totalUsd: number;
}
