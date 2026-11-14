const DEMO_CLIENTS = new Map([
  ['cli-1', { fullName: 'Carlos Eduardo Mendoza Silva', idCardNumber: '14.892.341', rifNumber: '14892341-2', phone: '+58 414-230-8812', email: 'carlos.mendoza.ve@gmail.com' }],
  ['cli-2', { fullName: 'María Alejandra Hernández de Gómez', idCardNumber: '18.423.905', rifNumber: '18423905-8', phone: '+58 412-987-6543', email: 'maria.hernandez.gomez@hotmail.com' }],
  ['cli-3', { fullName: 'Suministros & Servicios Industriales del Centro, C.A.', idCardNumber: '15.120.443', rifNumber: '40891234-9', phone: '+58 241-871-2290', email: 'contacto@suministroscentroca.com' }],
  ['cli-4', { fullName: 'Andrés Eloy Blanco Parra', idCardNumber: '12.345.678', rifNumber: '12345678-0', phone: '+58 424-112-9900', email: 'andreseloy.blanco@cantv.net' }],
]);

function validateLegacyExport(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El archivo de migración no contiene un objeto válido.');
  if (value.format !== 'notariave-legacy-export' || value.version !== 1) throw new Error('El formato del archivo de migración no es compatible.');
  const data = value.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('El archivo no contiene el bloque de datos esperado.');
  const clients = data.clients === undefined ? [] : data.clients;
  if (!Array.isArray(clients) || clients.length > 5000) throw new Error('El directorio de clientes no es válido o supera 5.000 registros.');
  for (const [index, client] of clients.entries()) {
    if (!client || typeof client !== 'object' || Array.isArray(client)) throw new Error(`El cliente ${index + 1} no tiene una estructura válida.`);
    if (typeof client.fullName !== 'string' || client.fullName.trim().length < 2 || client.fullName.length > 200) {
      throw new Error(`El cliente ${index + 1} no tiene un nombre válido. Corrija el archivo antes de importarlo.`);
    }
    if (Buffer.byteLength(JSON.stringify(client), 'utf8') > 100_000) throw new Error(`El registro del cliente ${index + 1} es demasiado grande.`);
  }
  const lawyer = data.lawyer == null ? null : data.lawyer;
  const criteria = data.criteria == null ? null : data.criteria;
  if (lawyer !== null && (typeof lawyer !== 'object' || Array.isArray(lawyer))) throw new Error('El perfil profesional no tiene una estructura válida.');
  if (criteria !== null && (typeof criteria !== 'object' || Array.isArray(criteria))) throw new Error('Los criterios notariales no tienen una estructura válida.');
  if (lawyer && Buffer.byteLength(JSON.stringify(lawyer), 'utf8') > 500_000) throw new Error('El perfil profesional supera el tamaño permitido.');
  if (criteria && Buffer.byteLength(JSON.stringify(criteria), 'utf8') > 500_000) throw new Error('Los criterios notariales superan el tamaño permitido.');
  return { clients, lawyer, criteria, exportedAt: value.exportedAt || null };
}

function isSeedDemoClient(client) {
  const known = DEMO_CLIENTS.get(String(client.id || ''));
  if (!known) return false;
  return known.fullName === String(client.fullName || '').trim()
    && known.idCardNumber === String(client.idCardNumber || '')
    && known.rifNumber === String(client.rifNumber || '')
    && known.phone === String(client.phone || '')
    && known.email === String(client.email || '');
}

function isSeedDemoLawyer(lawyer) {
  return Boolean(lawyer)
    && lawyer.fullName === 'Dr. Luis Alejandro Briceño Rivas'
    && lawyer.inpreabogado === '148.902'
    && lawyer.barAssociationState === 'Distrito Capital'
    && lawyer.barRegNumber === '45.120'
    && lawyer.officeAddress === 'Av. Francisco de Miranda, Edificio Centro Plaza, Torre B, Piso 14, Oficina 14-C, Los Palos Grandes, Caracas'
    && lawyer.phone === '+58 212-285-4433'
    && lawyer.email === 'escritorio.briceno.asociados@gmail.com';
}

function isSeedDemoCriteria(criteria) {
  return Boolean(criteria)
    && criteria.state === 'Distrito Capital'
    && criteria.municipality === 'Libertador'
    && criteria.officeType === 'Notaría Pública'
    && criteria.officeName === 'Notaría Pública Segunda de Caracas (Distrito Capital)'
    && Number(criteria.topMarginMm) === 40
    && Number(criteria.bottomMarginMm) === 25
    && Number(criteria.leftMarginMm) === 40
    && Number(criteria.rightMarginMm) === 20
    && criteria.fontFamily === 'Times New Roman'
    && Number(criteria.fontSizePt) === 12
    && Number(criteria.lineSpacing) === 1.5
    && criteria.enableProtocolLines === false
    && criteria.strictSarenFormatting === true
    && Number(criteria.bcvRate) === 68.5;
}

module.exports = { validateLegacyExport, isSeedDemoClient, isSeedDemoLawyer, isSeedDemoCriteria };
