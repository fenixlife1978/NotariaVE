const DEMO_CLIENTS = new Map([
  ['cli-1', 'Carlos Eduardo Mendoza Silva'],
  ['cli-2', 'María Alejandra Hernández de Gómez'],
  ['cli-3', 'Suministros & Servicios Industriales del Centro, C.A.'],
  ['cli-4', 'Andrés Eloy Blanco Parra'],
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
  return { clients, lawyer, criteria, exportedAt: value.exportedAt || null };
}

function isSeedDemoClient(client) {
  return DEMO_CLIENTS.get(String(client.id || '')) === String(client.fullName || '').trim();
}

function isSeedDemoLawyer(lawyer) {
  return Boolean(lawyer)
    && lawyer.fullName === 'Dr. Luis Alejandro Briceño Rivas'
    && lawyer.inpreabogado === '148.902'
    && lawyer.email === 'escritorio.briceno.asociados@gmail.com';
}

function isSeedDemoCriteria(criteria) {
  return Boolean(criteria)
    && criteria.state === 'Distrito Capital'
    && criteria.municipality === 'Libertador'
    && criteria.officeName === 'Notaría Pública Segunda de Caracas (Distrito Capital)'
    && Number(criteria.bcvRate) === 68.5;
}

module.exports = { validateLegacyExport, isSeedDemoClient, isSeedDemoLawyer, isSeedDemoCriteria };
