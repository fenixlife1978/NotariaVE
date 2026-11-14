import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Sparkles,
  ShieldCheck,
  Check,
  Edit3,
  Eye,
  UserCheck,
  Car,
  Building,
  KeyRound,
  FileCheck2,
  AlertCircle,
  Landmark,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Info,
  Briefcase,
  ArrowRightLeft,
  Ruler,
  Scale,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  XCircle,
  Save,
  Search,
  FolderOpen,
} from 'lucide-react';
import {
  ClientParty,
  DocumentFormData,
  LawyerProfile,
  SarenCriteriaConfig,
  VehicleData,
  RealEstateData,
  CompanyData,
  PersonalFirmData,
  PowerOfAttorneyData,
  LeaseData,
  MinorTravelData,
} from '../types/legal';
import {
  LEGAL_TEMPLATES,
  TemplateDefinition,
  generateDocumentText,
} from '../data/legalTemplates';
import {
  VENEZUELAN_MUNICIPALITIES_DATA,
  VenezuelanMunicipalityDetail,
} from '../data/venezuelanMunicipalities';
import { VENEZUELAN_STATES_TAX_DATA } from '../data/venezuelaTaxData';
import { exportToWordDocx } from '../utils/docxExporter';
import {
  auditVenezuelanDocument,
  validateMinimumLegalRequirements,
  MinimumLegalValidationResult,
  MinimumLegalCheck,
} from '../utils/sarenRejectionRules';
import { AiClauseModal } from './AiClauseModal';
import { SarenComplianceModal } from './SarenComplianceModal';
import { MissingLegalRequirementsModal } from './MissingLegalRequirementsModal';

type SavedDocument = {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  revision: number;
  payload: any;
};

interface DocumentEditorProps {
  clients: ClientParty[];
  lawyer: LawyerProfile;
  criteria: SarenCriteriaConfig;
  initialFormData?: DocumentFormData | null;
  savedDocuments: SavedDocument[];
  onSaveDocument: (input: { id?: string; title: string; templateId: string; payload: Record<string, unknown> }) => Promise<SavedDocument>;
  canSave?: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  clients,
  lawyer,
  criteria,
  initialFormData,
  savedDocuments,
  onSaveDocument,
  canSave = true,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialFormData?.templateId || 'venta-vehiculo'
  );

  const selectedTemplate = useMemo(
    () => LEGAL_TEMPLATES.find((t) => t.id === selectedTemplateId) || LEGAL_TEMPLATES[0],
    [selectedTemplateId]
  );

  // Form State
  const [formData, setFormData] = useState<DocumentFormData>(() => initialFormData || ({
    templateId: 'venta-vehiculo',
    title: 'VENTA DE VEHÍCULO AUTOMOTOR',
    date: new Date().toLocaleDateString('es-VE'),
    city: '',
    state: criteria.state || 'Distrito Capital',
    municipality: criteria.municipality || 'Libertador',
    grantor: {},
    grantee: {},
    vehicle: {
      brand: '', model: '', year: '', color: '', licensePlate: '',
      serialBody: '', serialEngine: '', vehicleClass: '', vehicleType: '',
      vehicleUse: '', inttCertificateNumber: '', salePriceBs: 0, salePriceUsd: 0,
      paymentMethod: '', municipalVehicleTaxPaid: false, spousalConsentArticle168: false,
    },
    realEstate: {
      propertyType: 'Apartamento', propertyAddress: '', municipality: '', state: '',
      cadastralCertificateNumber: '', cadastralYear: '', municipalSolvencyNumber: '',
      municipalSolvencyYear: '', registryTitleData: '', northBoundary: '',
      southBoundary: '', eastBoundary: '', westBoundary: '', totalAreaM2: 0,
      salePriceBs: 0, salePriceUsd: 0, paymentMethod: '',
      encumbranceCertificate: false, spousalConsentArticle168: false,
    },
    company: {
      companyName: '', fiscalDomicile: '', commercialPurpose: '', totalCapitalBs: 0,
      totalShares: 0, shareNominalValueBs: 0, presidentName: '', presidentCedula: '',
      vicePresidentName: '', vicePresidentCedula: '', commissionerName: '',
      commissionerCpcNumber: '', fiscalYearEnd: '', reserveFundPercentage: 5,
      reserveFundLimitPercentage: 10, openingInventoryCertified: false,
      commissionerAcceptanceLetter: false,
    },
    personalFirm: {
      tradeName: '', ownerName: '', ownerCedula: '', ownerRif: '',
      initialCapitalBs: 0, commercialActivity: '', domicile: '',
    },
    power: {
      attorneyName: '', attorneyCedula: '', attorneyRif: '', attorneyAddress: '',
      powerScope: '', allowSubdelegation: false,
    },
    lease: {
      propertyAddress: '', propertyCadastralNumber: '', propertyRegistrationTitle: '',
      intendedUse: 'Comercial', monthlyRentUsd: 0, monthlyRentBs: 0,
      depositMonths: 0, contractDurationMonths: 0, penaltyLateInterest: 0,
    },
    minorTravel: {
      minorFullName: '', minorBirthDate: '', minorPassportNumber: '',
      fatherFullName: '', fatherCedula: '', motherFullName: '', motherCedula: '',
      travelCompanionName: '', travelCompanionCedula: '', travelDestination: '',
      isInternational: false, departureDate: '', returnDate: '', airlineOrTransport: '',
    },
    includeOriginOfFunds: true,
    includeLawyerVisa: true,
    includeArbitrationClause: false,
    strictProtocolFormat: true,
    customClauses: [],
  } as DocumentFormData));

  // Editor mode: preview vs raw text edit
  const [isRawEditing, setIsRawEditing] = useState(false);
  const [customDraftText, setCustomDraftText] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [showMissingRequirementsModal, setShowMissingRequirementsModal] = useState(false);
  const [isValidatorExpanded, setIsValidatorExpanded] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | undefined>();
  const [documentSearch, setDocumentSearch] = useState('');
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [documentSaveMessage, setDocumentSaveMessage] = useState('');


  useEffect(() => {
    if (!initialFormData) return;
    setFormData(initialFormData);
    setSelectedTemplateId(initialFormData.templateId);
    setCurrentDocumentId(undefined);
    setIsRawEditing(false);
  }, [initialFormData]);

  // Generate draft text whenever form data or criteria changes
  const computedDraftText = useMemo(() => {
    return generateDocumentText(formData, criteria, lawyer);
  }, [formData, criteria, lawyer]);

  useEffect(() => {
    if (!isRawEditing) {
      setCustomDraftText(computedDraftText);
    }
  }, [computedDraftText, isRawEditing]);

  // Real-time Minimum Statutory Legal Validation (Art. 44 LRPN, Art. 168 C.C., SENIAT)
  const minLegalValidation: MinimumLegalValidationResult = useMemo(() => {
    return validateMinimumLegalRequirements(formData, criteria, lawyer);
  }, [formData, criteria, lawyer]);

  // Live Audit Calculation
  const liveAudit = useMemo(() => {
    return auditVenezuelanDocument(
      formData,
      criteria,
      lawyer,
      isRawEditing ? customDraftText : computedDraftText
    );
  }, [formData, criteria, lawyer, isRawEditing, customDraftText, computedDraftText]);

  // Smooth scroll to form section
  const handleScrollToSection = (targetSection: string) => {
    const el = document.getElementById(`section-${targetSection}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-500', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-500');
      }, 2500);
    }
  };

  // Selected municipality detail
  const currentMunicipality = useMemo(() => {
    return (
      VENEZUELAN_MUNICIPALITIES_DATA.find((m) =>
        m.name.toLowerCase().includes(formData.municipality.toLowerCase())
      ) || VENEZUELAN_MUNICIPALITIES_DATA[0]
    );
  }, [formData.municipality]);

  const [selectedStateId, setSelectedStateId] = useState<string>(
    currentMunicipality?.stateId || 'distrito-capital'
  );

  const [showMunicipalDetails, setShowMunicipalDetails] = useState<boolean>(false);

  const selectedStateRule = useMemo(() => {
    return (
      VENEZUELAN_STATES_TAX_DATA.find((s) => s.id === selectedStateId) ||
      VENEZUELAN_STATES_TAX_DATA[0]
    );
  }, [selectedStateId]);

  // Handle template selection
  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    const tmpl = LEGAL_TEMPLATES.find((t) => t.id === tId);
    setFormData((prev) => ({
      ...prev,
      templateId: tId,
      title: tmpl?.defaultTitle || 'DOCUMENTO JURÍDICO NOTARIAL',
    }));
    setIsRawEditing(false);
  };

  // 1-Click client selector for Grantor / Otorgante / Vendedor / Comerciante
  const handleSelectGrantorClient = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setFormData((prev) => {
        const next: DocumentFormData = {
          ...prev,
          grantorId: clientId,
          grantor: {
            ...found,
            spouseName: found.spouseName || prev.grantor?.spouseName,
            spouseIdCard: found.spouseIdCard || prev.grantor?.spouseIdCard,
          },
        };

        const formatAddr = (a: any): string => {
          if (!a) return '';
          if (typeof a === 'string') return a;
          return `${a.street || ''}, ${a.building || ''}, ${a.apartment ? `Apto/Piso ${a.apartment}, ` : ''}${a.parish ? `Pquia. ${a.parish}, ` : ''}${a.municipality || ''}, ${a.state || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');
        };

        const clientAddressStr = formatAddr(found.address);

        // If template is Firma Personal, autocomplete owner & commercial name
        if (selectedTemplateId === 'firma-personal') {
          const mainName = found.fullName.split(' ')[0] || 'COMERCIAL';
          next.personalFirm = {
            ...prev.personalFirm,
            ownerName: found.fullName,
            ownerCedula: `${found.idCardType}-${found.idCardNumber}`,
            ownerRif: `${found.rifType}-${found.rifNumber}`,
            tradeName: prev.personalFirm?.tradeName || `DISTRIBUIDORA Y SERVICIOS ${mainName.toUpperCase()} F.P.`,
            domicile: clientAddressStr || prev.personalFirm?.domicile,
          };
        }

        // If template is Poder, grantor is podante
        if (selectedTemplateId === 'poder-especial' || selectedTemplateId === 'poder-general') {
          if (prev.grantee?.fullName) {
            next.power = {
              ...prev.power,
              attorneyName: prev.grantee.fullName,
              attorneyCedula: `${prev.grantee.idCardType || 'V'}-${prev.grantee.idCardNumber || ''}`,
              attorneyRif: `${prev.grantee.rifType || 'V'}-${prev.grantee.rifNumber || ''}`,
              attorneyAddress: formatAddr(prev.grantee.address) || prev.power?.attorneyAddress,
            };
          }
        }

        // Auto-check Art. 168 CC if married
        if (found.maritalStatus === 'casado') {
          if (next.realEstate) next.realEstate.spousalConsentArticle168 = true;
          if (next.vehicle) next.vehicle.spousalConsentArticle168 = true;
        }

        return next;
      });
    }
  };

  // 1-Click client selector for Grantee / Adquirente / Comprador / Apoderado
  const handleSelectGranteeClient = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setFormData((prev) => {
        const next: DocumentFormData = {
          ...prev,
          granteeId: clientId,
          grantee: found,
        };

        const formatAddr = (a: any): string => {
          if (!a) return '';
          if (typeof a === 'string') return a;
          return `${a.street || ''}, ${a.building || ''}, ${a.apartment ? `Apto/Piso ${a.apartment}, ` : ''}${a.parish ? `Pquia. ${a.parish}, ` : ''}${a.municipality || ''}, ${a.state || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');
        };

        // If template is Poder, autocomplete attorney (apoderado)
        if (selectedTemplateId === 'poder-especial' || selectedTemplateId === 'poder-general') {
          next.power = {
            ...prev.power,
            attorneyName: found.fullName,
            attorneyCedula: `${found.idCardType}-${found.idCardNumber}`,
            attorneyRif: `${found.rifType}-${found.rifNumber}`,
            attorneyAddress: formatAddr(found.address) || prev.power?.attorneyAddress,
          };
        }

        return next;
      });
    }
  };

  // Swap parties (Grantor <-> Grantee)
  const handleSwapParties = () => {
    setFormData((prev) => ({
      ...prev,
      grantorId: prev.granteeId,
      granteeId: prev.grantorId,
      grantor: prev.grantee,
      grantee: prev.grantor,
    }));
  };

  // Quick category switcher for Poder, Compraventa, Firma Personal
  const handleQuickCategorySelect = (category: 'poder' | 'compraventa' | 'firma-personal' | 'otros') => {
    if (category === 'poder') {
      handleSelectTemplate('poder-especial');
    } else if (category === 'compraventa') {
      handleSelectTemplate('venta-inmueble');
    } else if (category === 'firma-personal') {
      handleSelectTemplate('firma-personal');
    } else {
      handleSelectTemplate('constitucion-ca');
    }
  };

  const handleSaveDocument = async () => {
    setIsSavingDocument(true);
    setDocumentSaveMessage('');
    try {
      const saved = await onSaveDocument({
        id: currentDocumentId,
        title: formData.title,
        templateId: formData.templateId,
        payload: {
          formData,
          customDraftText: isRawEditing ? customDraftText : computedDraftText,
          isRawEditing,
        },
      });
      setCurrentDocumentId(saved.id);
      setDocumentSaveMessage('Guardado en SQLite local · revisión ' + saved.revision);
    } catch (error) {
      setDocumentSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar el documento.');
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleOpenSavedDocument = (saved: SavedDocument) => {
    if (!saved.payload?.formData) {
      setDocumentSaveMessage('El expediente guardado no contiene un formulario válido.');
      return;
    }
    setFormData(saved.payload.formData);
    setSelectedTemplateId(saved.payload.formData.templateId);
    setCurrentDocumentId(saved.id);
    setIsRawEditing(Boolean(saved.payload.isRawEditing));
    setCustomDraftText(saved.payload.customDraftText || '');
    setDocumentSaveMessage('Expediente abierto · revisión ' + saved.revision);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredDocuments = savedDocuments.filter((document) => {
    const query = documentSearch.trim().toLocaleLowerCase('es');
    if (!query) return true;
    const parties = [document.payload?.formData?.grantor?.fullName, document.payload?.formData?.grantee?.fullName].filter(Boolean).join(' ');
    return [document.title, document.templateId, parties].join(' ').toLocaleLowerCase('es').includes(query);
  });

  // Copy draft
  const handleCopy = () => {
    const textToCopy = isRawEditing ? customDraftText : computedDraftText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Download Word docx (Strictly guarded by statutory legal validation)
  const handleDownloadWord = async () => {
    if (!minLegalValidation.canExport) {
      setShowMissingRequirementsModal(true);
      return;
    }

    setIsExportingWord(true);
    try {
      const textToExport = isRawEditing ? customDraftText : computedDraftText;
      const safeTitle = formData.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await exportToWordDocx(
        formData.title,
        textToExport,
        criteria,
        `${safeTitle}_${formData.municipality.toLowerCase().replace(/\s+/g, '_')}.docx`
      );
    } catch (e) {
      console.error('Error exporting docx:', e);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Print / PDF (Strictly guarded by statutory legal validation)
  const handlePrint = () => {
    if (!minLegalValidation.canExport) {
      setShowMissingRequirementsModal(true);
      return;
    }
    window.print();
  };

  // Insert AI Clause
  const handleInsertAiClause = (clauseText: string) => {
    setFormData((prev) => ({
      ...prev,
      customClauses: [...prev.customClauses, clauseText],
    }));
    if (isRawEditing) {
      setCustomDraftText((prev) => `${prev}\n\nCLÁUSULA ESPECIAL:\n${clauseText}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Modals */}
      <AiClauseModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        documentType={formData.title}
        notaryState={criteria.state}
        onInsertClause={handleInsertAiClause}
      />

      <SarenComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        formData={formData}
        criteria={criteria}
        lawyer={lawyer}
        fullDraftText={isRawEditing ? customDraftText : computedDraftText}
      />

      <MissingLegalRequirementsModal
        isOpen={showMissingRequirementsModal}
        onClose={() => setShowMissingRequirementsModal(false)}
        validation={minLegalValidation}
        clients={clients}
        onSelectGrantor={handleSelectGrantorClient}
        onSelectGrantee={handleSelectGranteeClient}
        onScrollToSection={handleScrollToSection}
      />

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><FolderOpen className="w-4 h-4 text-amber-500" /> Expedientes guardados</h2>
            <p className="text-[11px] text-slate-500">Almacenados exclusivamente en la base SQLite de este equipo.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={documentSearch} onChange={(event) => setDocumentSearch(event.target.value)} placeholder="Buscar título o compareciente..." className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
        </div>
        {documentSaveMessage && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{documentSaveMessage}</p>}
        {filteredDocuments.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">{savedDocuments.length === 0 ? 'Todavía no hay expedientes guardados.' : 'No hay expedientes que coincidan con la búsqueda.'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
            {filteredDocuments.map((document) => (
              <button key={document.id} type="button" onClick={() => handleOpenSavedDocument(document)} className={`text-left rounded-lg border p-3 transition-colors ${currentDocumentId === document.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'}`}>
                <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">{document.title}</span>
                <span className="block text-[10px] text-slate-500 mt-1">{document.templateId} · revisión {document.revision}</span>
                <span className="block text-[10px] text-slate-400 mt-1">{new Date(document.updatedAt).toLocaleString('es-VE')}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* GENERADOR DINÁMICO DE DOCUMENTOS SAREN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Header & Quick Category Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded border border-amber-500/20">
                Generador Dinámico Notarial / Registral SAREN
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                · Papel Oficio / Legal (8.5 x 14 in)
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {selectedTemplate.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Marco legal: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTemplate.legalFramework}</span>
            </p>
          </div>

          {/* Primary Document Type Selector Cards (Poder, Compraventa, Firma Personal) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. PODER */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => handleSelectTemplate('poder-especial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedTemplateId === 'poder-especial' || selectedTemplateId === 'poder-general'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Poder</span>
              </button>
              {(selectedTemplateId === 'poder-especial' || selectedTemplateId === 'poder-general') && (
                <div className="flex items-center ml-1 pl-1 border-l border-slate-300 dark:border-slate-700 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('poder-especial')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      selectedTemplateId === 'poder-especial'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Especial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('poder-general')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      selectedTemplateId === 'poder-general'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    General
                  </button>
                </div>
              )}
            </div>

            {/* 2. COMPRAVENTA */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => handleSelectTemplate('venta-inmueble')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedTemplateId === 'venta-inmueble' || selectedTemplateId === 'venta-vehiculo'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Compraventa</span>
              </button>
              {(selectedTemplateId === 'venta-inmueble' || selectedTemplateId === 'venta-vehiculo') && (
                <div className="flex items-center ml-1 pl-1 border-l border-slate-300 dark:border-slate-700 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('venta-inmueble')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      selectedTemplateId === 'venta-inmueble'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Inmueble
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('venta-vehiculo')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      selectedTemplateId === 'venta-vehiculo'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Vehículo
                  </button>
                </div>
              )}
            </div>

            {/* 3. FIRMA PERSONAL */}
            <button
              type="button"
              onClick={() => handleSelectTemplate('firma-personal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                selectedTemplateId === 'firma-personal'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Firma Personal</span>
            </button>

            {/* 4. OTHER TEMPLATES */}
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate"
            >
              <option value="" disabled>Otros Actos...</option>
              {LEGAL_TEMPLATES.filter(
                (t) =>
                  !['poder-especial', 'poder-general', 'venta-inmueble', 'venta-vehiculo', 'firma-personal'].includes(
                    t.id
                  )
              ).map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click Client Autocompletion Bar */}
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Autocompletado de Clientes Almacenados
                </span>
                <span className="text-[11px] text-slate-500">
                  Carga Cédula, RIF, Estado Civil, Cónyuge (Art. 168 C.C.) y Domicilio en 1 clic
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Autocomplete Grantor */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {selectedTemplateId === 'firma-personal' ? 'Comerciante:' : selectedTemplateId.startsWith('poder') ? 'Podante:' : 'Otorgante:'}
                </span>
                <select
                  value={formData.grantorId || ''}
                  onChange={(e) => handleSelectGrantorClient(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none max-w-[140px] truncate"
                >
                  <option value="">Seleccionar...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              {selectedTemplateId !== 'firma-personal' && (
                <button
                  type="button"
                  onClick={handleSwapParties}
                  title="Intercambiar Otorgante y Adquirente"
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Grantee (if applicable) */}
              {selectedTemplateId !== 'firma-personal' && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {selectedTemplateId.startsWith('poder') ? 'Apoderado:' : 'Adquirente:'}
                  </span>
                  <select
                    value={formData.granteeId || ''}
                    onChange={(e) => handleSelectGranteeClient(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none max-w-[140px] truncate"
                  >
                    <option value="">Seleccionar...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* State & Municipality Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Municipio:</span>
                <select
                  value={formData.municipality}
                  onChange={(e) => {
                    const munName = e.target.value;
                    const munObj = VENEZUELAN_MUNICIPALITIES_DATA.find((m) => m.name === munName);
                    if (munObj) {
                      setSelectedStateId(munObj.stateId);
                      setFormData((prev) => ({
                        ...prev,
                        municipality: munObj.name,
                        state: munObj.state.split('(')[0].trim(),
                      }));
                    } else {
                      setFormData((prev) => ({ ...prev, municipality: munName }));
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none max-w-[140px] truncate"
                >
                  {VENEZUELAN_MUNICIPALITIES_DATA.map((mun) => (
                    <option key={mun.id} value={mun.name}>
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Autocompletion Confirmation Badge */}
          {formData.grantor.fullName && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Datos activos de:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.grantor.fullName}
              </span>
              <span>·</span>
              <span>C.I. {formData.grantor.idCardType}-{formData.grantor.idCardNumber}</span>
              <span>·</span>
              <span>R.I.F. {formData.grantor.rifType}-{formData.grantor.rifNumber}</span>
              <span>·</span>
              <span className="capitalize">{formData.grantor.maritalStatus || 'soltero'}</span>
              {formData.grantor.maritalStatus === 'casado' && formData.grantor.spouseName && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Cónyuge (Art. 168 C.C.): {formData.grantor.spouseName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* SAREN Configuration Criteria & Margin Rule Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* 4.0 cm Margin Badge */}
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-[11px]" title="Margen obligatorio para costura notarial">
              <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Margen Izquierdo Protocolar: {criteria.leftMarginMm || 40} mm (4.0 cm SAREN)
            </span>

            {/* Office Type */}
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              <Landmark className="w-3.5 h-3.5 text-blue-500" />
              {criteria.officeName}
            </span>

            {/* Lawyer Visa */}
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              <Scale className="w-3.5 h-3.5 text-emerald-500" />
              Visado: {lawyer.fullName} (INPRE N° {lawyer.inpreabogado})
            </span>

            {/* Strict Protocol Lines */}
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              {formData.strictProtocolFormat ? 'Cierre de Renglones (---)' : 'Sin líneas de cierre'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowMunicipalDetails((prev) => !prev)}
            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            {showMunicipalDetails ? 'Ocultar Normas Locales' : `Ver Decretos de ${currentMunicipality.name}`}
          </button>
        </div>

        {/* Expandable Municipal Directives Card */}
        {showMunicipalDetails && (
          <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-2 animate-in fade-in duration-200">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Normativas y Decretos Aplicables en {currentMunicipality.name}:</span>
              <span className="text-[11px] font-normal text-slate-500">
                Catastro: {currentMunicipality.catastroDepartment} (Cód: {currentMunicipality.cadastralCodeFormat})
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
              {currentMunicipality.legalNotesAndDecrees.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
            <div className="pt-1.5 border-t border-amber-500/20">
              <span className="font-bold text-slate-900 dark:text-white block mb-1 text-[11px]">
                Recaudos Físicos Indispensables para Taquilla SAREN en este Municipio:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px]">
                {currentMunicipality.mandatoryPreRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Split: Left Inputs & Data vs Right Legal Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Data & Specific Clauses (5 cols) */}
        <div className="lg:col-span-5 space-y-5 no-print">
          {/* VALIDADOR LEGAL EN TIEMPO REAL - REQUISITOS MÍNIMOS DE LEY (Art. 44 LRPN, Art. 168 C.C., SENIAT) */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              minLegalValidation.isValid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 shadow-xs'
            }`}
          >
            {/* Header & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    minLegalValidation.isValid
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {minLegalValidation.isValid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Validador Legal en Tiempo Real
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        minLegalValidation.isValid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 animate-pulse'
                      }`}
                    >
                      {minLegalValidation.isValid
                        ? '100% Conforme de Ley'
                        : `Bloqueado (${minLegalValidation.failedCount} campos)`}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {minLegalValidation.isValid
                      ? 'Requisitos Mínimos de Ley Cumplidos'
                      : 'Faltan Requisitos Mínimos para Generación'}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {minLegalValidation.isValid
                      ? 'Cédulas, RIF, Estado Civil, Nombres y Visado verificados según Art. 44 LRPN y Art. 168 C.C.'
                      : 'La Ley de Registro y Notariado rechaza documentos sin Cédulas, Estado Civil o RIF de las partes.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsValidatorExpanded((prev) => !prev)}
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold flex items-center gap-1 shrink-0"
              >
                <span>{isValidatorExpanded ? 'Ocultar' : 'Verificar'} ({minLegalValidation.passedCount}/{minLegalValidation.totalChecks})</span>
                {isValidatorExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Cumplimiento Estatutario (LRPN & C.C.):
                </span>
                <span
                  className={`font-bold ${
                    minLegalValidation.isValid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {minLegalValidation.percentageScore}% ({minLegalValidation.passedCount} de {minLegalValidation.totalChecks} requisitos)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    minLegalValidation.isValid
                      ? 'bg-emerald-500'
                      : minLegalValidation.percentageScore > 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${minLegalValidation.percentageScore}%` }}
                />
              </div>
            </div>

            {/* Quick Glance Checklist Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
              {minLegalValidation.allChecks.map((chk) => (
                <button
                  key={chk.id}
                  type="button"
                  onClick={() => {
                    if (chk.sectionTarget) handleScrollToSection(chk.sectionTarget);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                    chk.passed
                      ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                  }`}
                  title={`${chk.label} · ${chk.legalBasis}`}
                >
                  {chk.passed ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[130px]">{chk.label}</span>
                </button>
              ))}
            </div>

            {/* Expandable Granular Detail View */}
            {isValidatorExpanded && (
              <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Auditoría Detallada de Requisitos Mínimos:
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {minLegalValidation.allChecks.map((chk, idx) => (
                    <div
                      key={chk.id || idx}
                      className={`p-2 rounded-lg text-[11px] flex items-start justify-between gap-2 border ${
                        chk.passed
                          ? 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          : 'bg-rose-100/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {chk.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{chk.label}</span>
                            {chk.valueFound && (
                              <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {chk.valueFound}
                              </span>
                            )}
                          </div>
                          {!chk.passed && (
                            <p className="text-rose-700 dark:text-rose-300 text-[10px] mt-0.5">
                              {chk.errorMessage}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5 italic">
                            {chk.legalBasis}
                          </div>
                        </div>
                      </div>

                      {chk.sectionTarget && (
                        <button
                          type="button"
                          onClick={() => handleScrollToSection(chk.sectionTarget!)}
                          className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded border ${
                            chk.passed
                              ? 'text-slate-600 border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-700'
                              : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                          }`}
                        >
                          {chk.passed ? 'Ver' : 'Corregir'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Party 1: Otorgante */}
          <div id="section-grantor" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Otorgante / Vendedor / Propietario
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Carga los datos en 1 clic desde el directorio
                  </span>
                </div>
              </div>

              {/* Quick client loader */}
              <select
                value={formData.grantorId || ''}
                onChange={(e) => handleSelectGrantorClient(e.target.value)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 max-w-[150px] truncate"
              >
                <option value="">Cargar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Nombre Completo / Razón Social:
                </label>
                <input
                  type="text"
                  value={formData.grantor.fullName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      grantor: { ...prev.grantor, fullName: e.target.value },
                    }))
                  }
                  placeholder="Nombre completo del otorgante"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Cédula de Identidad:
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.grantor.idCardType || 'V'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          grantor: { ...prev.grantor, idCardType: e.target.value as any },
                        }))
                      }
                      className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="V">V-</option>
                      <option value="E">E-</option>
                    </select>
                    <input
                      type="text"
                      value={formData.grantor.idCardNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          grantor: { ...prev.grantor, idCardNumber: e.target.value },
                        }))
                      }
                      placeholder="Número de cédula"
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    R.I.F. Fiscal:
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.grantor.rifType || 'V'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          grantor: { ...prev.grantor, rifType: e.target.value as any },
                        }))
                      }
                      className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="V">V-</option>
                      <option value="E">E-</option>
                      <option value="J">J-</option>
                      <option value="G">G-</option>
                    </select>
                    <input
                      type="text"
                      value={formData.grantor.rifNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          grantor: { ...prev.grantor, rifNumber: e.target.value },
                        }))
                      }
                      placeholder="Número de RIF"
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Estado Civil:
                  </label>
                  <select
                    value={formData.grantor.maritalStatus || 'soltero'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        grantor: { ...prev.grantor, maritalStatus: e.target.value as any },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="soltero">Soltero(a)</option>
                    <option value="casado">Casado(a) (Art. 168 C.C.)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viudo">Viudo(a)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Profesión / Ocupación:
                  </label>
                  <input
                    type="text"
                    value={formData.grantor.profession || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        grantor: { ...prev.grantor, profession: e.target.value },
                      }))
                    }
                    placeholder="comerciante / ingeniero"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                {formData.grantor.maritalStatus === 'casado' && (
                  <>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">
                        Nombre Cónyuge (Art. 168 C.C.):
                      </label>
                      <input
                        type="text"
                        value={formData.grantor.spouseName || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantor: { ...prev.grantor, spouseName: e.target.value },
                          }))
                        }
                        placeholder="Nombre del cónyuge"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">
                        C.I. del Cónyuge:
                      </label>
                      <input
                        type="text"
                        value={formData.grantor.spouseIdCard || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantor: { ...prev.grantor, spouseIdCard: e.target.value },
                          }))
                        }
                        placeholder="V-XX.XXX.XXX"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Party 2: Adquirente / Receptor (for bilateral contracts) */}
          {(selectedTemplateId === 'venta-vehiculo' ||
            selectedTemplateId === 'venta-inmueble' ||
            selectedTemplateId === 'arrendamiento' ||
            selectedTemplateId === 'constitucion-ca') && (
            <div id="section-grantee" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Adquirente / Comprador / Inquilino
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Datos de la contraparte
                    </span>
                  </div>
                </div>

                {/* Quick client loader */}
                <select
                  value={formData.granteeId || ''}
                  onChange={(e) => handleSelectGranteeClient(e.target.value)}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 max-w-[150px] truncate"
                >
                  <option value="">Cargar cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    value={formData.grantee.fullName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        grantee: { ...prev.grantee, fullName: e.target.value },
                      }))
                    }
                    placeholder="Nombre completo de la otra parte"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Cédula de Identidad:
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={formData.grantee.idCardType || 'V'}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantee: { ...prev.grantee, idCardType: e.target.value as any },
                          }))
                        }
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input
                        type="text"
                        value={formData.grantee.idCardNumber || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantee: { ...prev.grantee, idCardNumber: e.target.value },
                          }))
                        }
                        placeholder="Número de cédula"
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      R.I.F. Fiscal:
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={formData.grantee.rifType || 'V'}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantee: { ...prev.grantee, rifType: e.target.value as any },
                          }))
                        }
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="J">J-</option>
                        <option value="G">G-</option>
                      </select>
                      <input
                        type="text"
                        value={formData.grantee.rifNumber || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            grantee: { ...prev.grantee, rifNumber: e.target.value },
                          }))
                        }
                        placeholder="18423905-8"
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REAL ESTATE CONVEYANCE FORM */}
          {selectedTemplateId === 'venta-inmueble' && (
            <div id="section-realEstate" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Landmark className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Datos del Inmueble, Catastro y Solvencias Municipales
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Requisitos inexcusables de la Ley de Catastro y Registro Inmobiliario
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Tipo y Dirección Detallada del Inmueble:
                  </label>
                  <input
                    type="text"
                    value={formData.realEstate?.propertyAddress || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        realEstate: { ...prev.realEstate, propertyAddress: e.target.value },
                      }))
                    }
                    placeholder="Av. Francisco de Miranda, Edificio Residencias Parque Cristal, Apto 7-B"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Cédula / Ficha Catastral Municipal:
                    </label>
                    <input
                      type="text"
                      value={formData.realEstate?.cadastralCertificateNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, cadastralCertificateNumber: e.target.value },
                        }))
                      }
                      placeholder="15-01-04-0028-007"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Solvencia de Inmuebles Urbanos:
                    </label>
                    <input
                      type="text"
                      value={formData.realEstate?.municipalSolvencyNumber || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, municipalSolvencyNumber: e.target.value },
                        }))
                      }
                      placeholder="SOLV-DAT-2026-8941"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Superficie Total (m²):
                    </label>
                    <input
                      type="number"
                      value={formData.realEstate?.totalAreaM2 || 120}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, totalAreaM2: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Alícuota Condominio (%):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.realEstate?.condominiumPercentage || 2.15}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, condominiumPercentage: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wide block">
                    Linderos Perimetrales Obligatorios:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.realEstate?.northBoundary || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, northBoundary: e.target.value },
                        }))
                      }
                      placeholder="Norte: colinda con..."
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={formData.realEstate?.southBoundary || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, southBoundary: e.target.value },
                        }))
                      }
                      placeholder="Sur: colinda con..."
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={formData.realEstate?.eastBoundary || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, eastBoundary: e.target.value },
                        }))
                      }
                      placeholder="Este: colinda con..."
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={formData.realEstate?.westBoundary || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: { ...prev.realEstate, westBoundary: e.target.value },
                        }))
                      }
                      placeholder="Oeste: colinda con..."
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Precio Venta (Bolívares):
                    </label>
                    <input
                      type="number"
                      value={formData.realEstate?.salePriceBs || 0}
                      onChange={(e) => {
                        const bsVal = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: {
                            ...prev.realEstate,
                            salePriceBs: bsVal,
                            salePriceUsd: Math.round(bsVal / (criteria.bcvRate || 68.5)),
                          },
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Ref. en Divisa (US$):
                    </label>
                    <input
                      type="number"
                      value={formData.realEstate?.salePriceUsd || 0}
                      onChange={(e) => {
                        const usdVal = Number(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          realEstate: {
                            ...prev.realEstate,
                            salePriceUsd: usdVal,
                            salePriceBs: Math.round(usdVal * (criteria.bcvRate || 68.5)),
                          },
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VEHICLE FORM */}
          {selectedTemplateId === 'venta-vehiculo' && (
            <div id="section-vehicle" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Car className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Datos Técnicos del Título INTT y Precio
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Marca:
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle?.brand || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, brand: e.target.value },
                      }))
                    }
                    placeholder="TOYOTA"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Modelo y Año:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.vehicle?.model || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: { ...prev.vehicle, model: e.target.value },
                        }))
                      }
                      placeholder="COROLLA"
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold"
                    />
                    <input
                      type="text"
                      value={formData.vehicle?.year || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: { ...prev.vehicle, year: e.target.value },
                        }))
                      }
                      placeholder="2018"
                      className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Placas:
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle?.licensePlate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, licensePlate: e.target.value },
                      }))
                    }
                    placeholder="AC123DE"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    N° Certificado Registro INTT:
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle?.inttCertificateNumber || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, inttCertificateNumber: e.target.value },
                      }))
                    }
                    placeholder="Número de certificado INTT"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Serial Carrocería (N.I.V.):
                  </label>
                  <input
                    type="text"
                    value={formData.vehicle?.serialBody || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, serialBody: e.target.value },
                      }))
                    }
                    placeholder="Serial de carrocería"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Precio Venta (Bolívares):
                  </label>
                  <input
                    type="number"
                    value={formData.vehicle?.salePriceBs || 0}
                    onChange={(e) => {
                      const bsVal = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: {
                          ...prev.vehicle,
                          salePriceBs: bsVal,
                          salePriceUsd: Math.round(bsVal / (criteria.bcvRate || 68.5)),
                        },
                      }));
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Ref. en Divisa (US$):
                  </label>
                  <input
                    type="number"
                    value={formData.vehicle?.salePriceUsd || 0}
                    onChange={(e) => {
                      const usdVal = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        vehicle: {
                          ...prev.vehicle,
                          salePriceUsd: usdVal,
                          salePriceBs: Math.round(usdVal * (criteria.bcvRate || 68.5)),
                        },
                      }));
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPANY C.A. FORM */}
          {selectedTemplateId === 'constitucion-ca' && (
            <div id="section-company" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Estatutos de la Compañía Anónima (SAREN Mercantil)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Denominación Mercantil (Razón Social):
                  </label>
                  <input
                    type="text"
                    value={formData.company?.companyName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company: { ...prev.company, companyName: e.target.value },
                      }))
                    }
                    placeholder="INVERSIONES & SERVICIOS 2026, C.A."
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Capital Social (Bs.):
                    </label>
                    <input
                      type="number"
                      value={formData.company?.totalCapitalBs || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company: { ...prev.company, totalCapitalBs: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Comisario Mercantil y CPC:
                    </label>
                    <input
                      type="text"
                      value={formData.company?.commissionerName || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company: { ...prev.company, commissionerName: e.target.value },
                        }))
                      }
                      placeholder="Lic. CPC N°..."
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Objeto Comercial de la Empresa:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.company?.commercialPurpose || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company: { ...prev.company, commercialPurpose: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* POWER OF ATTORNEY FORM */}
          {(selectedTemplateId === 'poder-especial' || selectedTemplateId === 'poder-general') && (
            <div id="section-power" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Datos del Apoderado y Alcance de Facultades
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del Apoderado(a):
                  </label>
                  <input
                    type="text"
                    value={formData.power?.attorneyName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        power: { ...prev.power, attorneyName: e.target.value },
                      }))
                    }
                    placeholder="Nombre completo de la otra parte"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      C.I. Apoderado:
                    </label>
                    <input
                      type="text"
                      value={formData.power?.attorneyCedula || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          power: { ...prev.power, attorneyCedula: e.target.value },
                        }))
                      }
                      placeholder="V-Número de cédula"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Sustitución de Poder:
                    </label>
                    <select
                      value={formData.power?.allowSubdelegation ? 'si' : 'no'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          power: { ...prev.power, allowSubdelegation: e.target.value === 'si' },
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    >
                      <option value="no">Prohibida la sustitución</option>
                      <option value="si">Facultad de sustituir en abogado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Facultades Específicas / Limitaciones:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.power?.powerScope || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        power: { ...prev.power, powerScope: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PERSONAL FIRM FORM */}
          {selectedTemplateId === 'firma-personal' && (
            <div id="section-personalFirm" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Constitución de Firma Personal (Registro Mercantil)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Denominación Comercial (F.P.):
                  </label>
                  <input
                    type="text"
                    value={formData.personalFirm?.tradeName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalFirm: { ...prev.personalFirm, tradeName: e.target.value },
                      }))
                    }
                    placeholder="DISTRIBUIDORA Y REPUESTOS MENDOZA F.P."
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Art. 26 C.Com: La razón de comercio debe contener el nombre y apellido del titular.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Capital Propio Asignado (Bs.):
                    </label>
                    <input
                      type="number"
                      value={formData.personalFirm?.initialCapitalBs || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          personalFirm: { ...prev.personalFirm, initialCapitalBs: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">
                      Domicilio Mercantil:
                    </label>
                    <input
                      type="text"
                      value={formData.personalFirm?.domicile || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          personalFirm: { ...prev.personalFirm, domicile: e.target.value },
                        }))
                      }
                      placeholder="Caracas, Municipio Libertador"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Giro o Ramo del Negocio (Actividad Comercial):
                  </label>
                  <textarea
                    rows={2}
                    value={formData.personalFirm?.commercialActivity || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personalFirm: { ...prev.personalFirm, commercialActivity: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SAREN Mandatory & Compliance Toggles */}
          <div id="section-lawyer" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
              Cláusulas y Criterios SAREN Obligatorios
            </h3>

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.includeOriginOfFunds}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, includeOriginOfFunds: e.target.checked }))
                  }
                  className="mt-0.5 rounded text-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Cláusula de Origen y Destino Lícito de Fondos
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Resolución Conjunta SAREN - SUDEBAN N° 001/017 (Anti-legitimación).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.includeLawyerVisa}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, includeLawyerVisa: e.target.checked }))
                  }
                  className="mt-0.5 rounded text-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Nota de Visado de Abogado en Ejercicio (Art. 3 Ley de Abogados)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Visado por {lawyer.fullName} (INPRE: {lawyer.inpreabogado}).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.strictProtocolFormat}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, strictProtocolFormat: e.target.checked }))
                  }
                  className="mt-0.5 rounded text-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Formato Protocolar Estricto SAREN (Cierre de Renglones)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Fechas completas en letras mayúsculas y líneas de cierre (---) contra alteraciones.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Notarial Sheet Preview & Toolbar (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRawEditing(!isRawEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isRawEditing
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isRawEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isRawEditing ? 'Ver Protocolo' : 'Editar Borrador'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asistente AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  liveAudit.failedCount > 0
                    ? 'bg-rose-500 text-white'
                    : liveAudit.warningCount > 0
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {liveAudit.failedCount > 0
                    ? `Auditar (${liveAudit.failedCount} Riesgos)`
                    : 'Auditar SAREN (Conforme)'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {canSave && <button type="button" onClick={handleSaveDocument} disabled={isSavingDocument} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold">
                <Save className="w-3.5 h-3.5" /> {isSavingDocument ? 'Guardando...' : currentDocumentId ? 'Guardar cambios' : 'Guardar expediente'}
              </button>}
              {/* Statutory Legal Validation Seal Badge */}
              {minLegalValidation.canExport ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Apto para Emisión</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMissingRequirementsModal(true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-bold text-[11px] transition-colors"
                  title="Haga clic para ver los requisitos faltantes"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Bloqueado ({minLegalValidation.failedCount} de ley)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copiar texto al portapapeles"
              >
                {copiedNotification ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Print Button (Conditioned on Legal Requirements) */}
              <button
                type="button"
                onClick={handlePrint}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !minLegalValidation.canExport
                    ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
                title={
                  !minLegalValidation.canExport
                    ? `Faltan ${minLegalValidation.failedCount} requisitos mínimos obligatorios`
                    : 'Imprimir o guardar como PDF'
                }
              >
                {!minLegalValidation.canExport ? (
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>Imprimir / PDF</span>
              </button>

              {/* Download Word Button (Conditioned & Visually Locked on Missing Legal Requirements) */}
              <button
                type="button"
                onClick={handleDownloadWord}
                disabled={isExportingWord}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs ${
                  !minLegalValidation.canExport
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/30 cursor-pointer'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                }`}
                title={
                  !minLegalValidation.canExport
                    ? `Generación bloqueada: Faltan ${minLegalValidation.failedCount} campos mínimos de ley (Art. 44 LRPN)`
                    : 'Descargar borrador en formato Word (.docx) listo para protocolizar'
                }
              >
                {!minLegalValidation.canExport ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExportingWord
                    ? 'Generando...'
                    : !minLegalValidation.canExport
                    ? `Descarga Bloqueada (${minLegalValidation.failedCount} campos)`
                    : 'Descargar Word (.docx)'}
                </span>
              </button>
            </div>
          </div>

          {/* Real-time Statutory Rejection Prevention Banner */}
          {!minLegalValidation.canExport && (
            <div className="p-3 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 no-print animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold block text-rose-950 dark:text-rose-100">
                    Validador Legal SAREN: Faltan {minLegalValidation.failedCount} Requisitos Mínimos de Ley
                  </span>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    El documento no puede generarse hasta completar:{' '}
                    <strong>{minLegalValidation.failedChecks.map((c) => c.label).slice(0, 3).join(', ')}</strong>
                    {minLegalValidation.failedChecks.length > 3 ? '...' : '.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMissingRequirementsModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors shadow-xs"
              >
                Ver Requisitos Faltantes
              </button>
            </div>
          )}

          {/* Secondary Audit Alert (if warnings/clauses) */}
          {minLegalValidation.canExport && liveAudit.failedCount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 no-print">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Observaciones Notariales Recomendadas: Se detectaron {liveAudit.failedCount} sugerencias de fondo
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    {liveAudit.rules.find((r) => r.status === 'failed')?.finding}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] shrink-0"
              >
                Ver Solución
              </button>
            </div>
          )}

          {/* Legal Protocol Sheet Viewport */}
          <div className="bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto flex flex-col items-center gap-3">
            {/* Visual Protocol Margin Banner */}
            <div className="no-print w-full max-w-[800px] bg-slate-900 text-slate-200 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between border border-slate-700 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-amber-400 font-bold">Formato Protocolar SAREN Activo:</span>
                <span>Margen Izquierdo 4.0 cm (40 mm) para encuadernación de tomo</span>
              </div>
              <span className="text-slate-400 text-[10px] hidden sm:inline">
                Papel Legal (8.5 x 14 in) · Interlineado 1.5
              </span>
            </div>

            {/* The Authentic Legal Paper Container */}
            <div
              className="legal-document-sheet bg-white text-slate-900 shadow-xl border border-slate-300 w-full max-w-[800px] min-h-[1100px] relative transition-all"
              style={{
                fontFamily: criteria.fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 'Arial, sans-serif',
                fontSize: `${criteria.fontSizePt || 12}pt`,
                lineHeight: criteria.lineSpacing || 1.5,
                paddingTop: `${criteria.topMarginMm || 40}mm`,
                paddingBottom: `${criteria.bottomMarginMm || 25}mm`,
                paddingLeft: `${criteria.leftMarginMm || 40}mm`,
                paddingRight: `${criteria.rightMarginMm || 20}mm`,
              }}
            >
              {/* Visual Protocol Left Margin Binding Guide & Stitch Hole Markers (screen only) */}
              <div
                className="no-print absolute top-0 bottom-0 pointer-events-none border-r-2 border-dashed border-red-400/40 select-none flex flex-col justify-between items-center py-16"
                style={{ width: `${criteria.leftMarginMm || 40}mm`, left: 0 }}
                title="Zona reservada para encuadernación y costura de protocolo SAREN (4.0 cm)"
              >
                {/* 3 Notarial Stitch/Hole Markers */}
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                  ○
                </div>
                <div className="rotate-90 text-[9px] font-bold text-red-400/70 tracking-widest whitespace-nowrap">
                  ◄ 4.0 cm COSTURA SAREN ►
                </div>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                  ○
                </div>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                  ○
                </div>
              </div>

              {/* Protocol Stamp Header (Screen & Print) */}
              <div className="mb-6 text-center select-none border-b border-slate-200 pb-3">
                <div className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
                  REPÚBLICA BOLIVARIANA DE VENEZUELA
                </div>
                <div className="text-[10px] text-slate-600 font-serif">
                  SERVICIO AUTÓNOMO DE REGISTROS Y NOTARÍAS (SAREN)
                </div>
                <div className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">
                  {criteria.officeName} · MUNICIPIO {formData.municipality.toUpperCase()}
                </div>
              </div>

              {/* Document Content View / Textarea */}
              {isRawEditing ? (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    Modo edición activa: Puedes editar el texto directamente antes de imprimir o descargar a Word.
                  </div>
                  <textarea
                    value={customDraftText}
                    onChange={(e) => setCustomDraftText(e.target.value)}
                    rows={35}
                    className="w-full h-full p-2 bg-transparent text-slate-900 text-sm leading-relaxed font-serif focus:outline-none resize-y border border-slate-300 rounded"
                  />
                </div>
              ) : (
                <div className="legal-body text-justify text-slate-900 space-y-4 whitespace-pre-wrap select-text selection:bg-amber-200">
                  <h1 className="text-center font-bold text-base uppercase tracking-wider mb-6">
                    {formData.title}
                  </h1>

                  <div className="leading-relaxed">
                    {computedDraftText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
