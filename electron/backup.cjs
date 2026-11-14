const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

function inspectDatabase(filePath, DatabaseCtor = Database) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error('El archivo de respaldo no existe.');
  }
  const candidate = new DatabaseCtor(filePath, { readonly: true, fileMustExist: true, timeout: 5000 });
  try {
    candidate.pragma('query_only = ON');
    candidate.pragma('trusted_schema = OFF');
    const integrity = candidate.pragma('quick_check');
    if (!Array.isArray(integrity) || integrity.length !== 1 || integrity[0].quick_check !== 'ok') {
      throw new Error('El respaldo no superó PRAGMA quick_check.');
    }
    const foreignKeyErrors = candidate.pragma('foreign_key_check');
    if (foreignKeyErrors.length > 0) throw new Error('El respaldo contiene relaciones internas inconsistentes.');
    const tables = new Set(candidate.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
    for (const required of ['schema_migrations', 'users', 'clients', 'documents', 'audit_log']) {
      if (!tables.has(required)) throw new Error(`El respaldo no contiene la tabla requerida: ${required}.`);
    }
    const schemaVersion = candidate.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version;
    if (schemaVersion < 2) throw new Error('La versión del esquema del respaldo no es compatible.');
    const counts = {};
    for (const table of ['users', 'clients', 'documents', 'audit_log', 'attachments', 'external_lookups']) {
      counts[table] = tables.has(table) ? candidate.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get().count : 0;
    }
    return { schemaVersion, counts };
  } finally {
    candidate.close();
  }
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function createVerifiedBackup(sourceDb, destinationPath, DatabaseCtor = Database) {
  const directory = path.dirname(destinationPath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = `${destinationPath}.tmp-${crypto.randomUUID()}`;
  const manifestPath = `${destinationPath}.manifest.json`;
  try {
    await sourceDb.backup(temporaryPath);
    const inspection = inspectDatabase(temporaryPath, DatabaseCtor);
    if (fs.existsSync(destinationPath)) fs.unlinkSync(destinationPath);
    fs.renameSync(temporaryPath, destinationPath);
    const manifest = {
      format: 'notariave-sqlite-backup',
      formatVersion: 1,
      createdAt: new Date().toISOString(),
      sha256: sha256File(destinationPath),
      ...inspection,
    };
    const temporaryManifest = `${manifestPath}.tmp-${crypto.randomUUID()}`;
    fs.writeFileSync(temporaryManifest, JSON.stringify(manifest, null, 2), { flag: 'wx' });
    fs.renameSync(temporaryManifest, manifestPath);
    return { filePath: destinationPath, fileName: path.basename(destinationPath), manifestPath, ...manifest };
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    throw error;
  }
}

function verifyBackup(filePath, DatabaseCtor = Database) {
  const manifestPath = `${filePath}.manifest.json`;
  if (!fs.existsSync(manifestPath)) throw new Error('Falta el manifiesto de integridad del respaldo.');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error('El manifiesto del respaldo no es válido.');
  }
  if (manifest.format !== 'notariave-sqlite-backup' || manifest.formatVersion !== 1) {
    throw new Error('El formato del respaldo no es compatible.');
  }
  const actualHash = sha256File(filePath);
  if (actualHash !== manifest.sha256) throw new Error('La huella SHA-256 no coincide; el respaldo pudo modificarse o dañarse.');
  const inspection = inspectDatabase(filePath, DatabaseCtor);
  if (inspection.schemaVersion !== manifest.schemaVersion || JSON.stringify(inspection.counts) !== JSON.stringify(manifest.counts)) {
    throw new Error('El contenido del respaldo no coincide con su manifiesto.');
  }
  return { ...manifest, fileName: path.basename(filePath) };
}

module.exports = { inspectDatabase, sha256File, createVerifiedBackup, verifyBackup };
