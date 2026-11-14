import { ClientParty, LawyerProfile, SarenCriteriaConfig } from '../types/legal';

// NotariaVE starts with an empty local directory. No sample identities or fictitious professional data.
export const INITIAL_CLIENTS: ClientParty[] = [];

export const INITIAL_LAWYER: LawyerProfile = {
  fullName: '',
  inpreabogado: '',
  barAssociationState: '',
  barRegNumber: '',
  officeAddress: '',
  phone: '',
  email: '',
};

export const INITIAL_SAREN_CRITERIA: SarenCriteriaConfig = {
  state: 'Distrito Capital',
  municipality: '',
  officeType: 'Notaría Pública',
  officeName: '',
  topMarginMm: 40,
  bottomMarginMm: 25,
  leftMarginMm: 40,
  rightMarginMm: 20,
  fontFamily: 'Times New Roman',
  fontSizePt: 12,
  lineSpacing: 1.5,
  enableProtocolLines: false,
  strictSarenFormatting: true,
  bcvRate: 0,
};
