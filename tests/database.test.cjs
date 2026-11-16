const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../electron/database.cjs');
const { createVerifiedBackup, verifyBackup } = require('../electron/backup.cjs');
const { validateLegacyExport, isSeedDemoClient, isSeedDemoLawyer, isSeedDemoCriteria } = require('../electron/legacy-import.cjs');
const { TRIAL_DURATION_MS, getLicenseStatus, saveLicenseActivation } = require('../electron/licensing.cjs');
const { recordBackupRestoreCompleted, recordAttachmentExported } = require('../electron/audit-events.cjs');

function withTempDatabase(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-sqlite-'));
  let opened;
  try {
    opened = openDatabase(dir);
    run(opened.db);
  } finally {
    if (opened?.db?.open) opened.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('creates an isolated local SQLite schema with foreign keys enabled', () => {
  withTempDatabase((db) => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
    for (const name of ['users', 'clients', 'documents', 'app_settings', 'audit_log', 'attachments', 'external_lookups', 'schema_migrations']) {
      assert.ok(tables.includes(name), `missing table: ${name}`);
    }
    assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
    assert.equal(db.pragma('journal_mode', { simple: true }), 'wal');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM users').get().count, 0);
    assert.equal(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version, 3);
    const documentColumns = db.prepare('PRAGMA table_info(documents)').all().map((column) => column.name);
    assert.ok(documentColumns.includes('updated_by'));
    assert.ok(documentColumns.includes('revision'));
  });
});

test('keeps the schema migration idempotent across reopen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-migration-'));
  try {
    let first = openDatabase(dir);
    first.db.close();
    const second = openDatabase(dir);
    try {
      assert.equal(second.db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get().count, 3);
      assert.equal(second.db.pragma('quick_check')[0].quick_check, 'ok');
    } finally {
      second.db.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('persists document payloads with revision metadata and audit references', () => {
  withTempDatabase((db) => {
    const now = new Date().toISOString();
    const userId = 'test-admin';
    db.prepare(`
      INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', ?, ?, ?, ?)
    `).run(userId, 'admin', 'Administrador de prueba', Buffer.alloc(16), Buffer.alloc(64), now, now);
    const payload = JSON.stringify({ formData: { title: 'PODER ESPECIAL' }, customDraftText: 'Borrador de prueba' });
    db.prepare(`
      INSERT INTO documents(id, title, template_id, status, data_json, created_by, updated_by, created_at, updated_at, revision)
      VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, 1)
    `).run('doc-1', 'PODER ESPECIAL', 'poder-especial', payload, userId, userId, now, now);
    const saved = db.prepare('SELECT title, data_json, revision, created_by FROM documents WHERE id = ?').get('doc-1');
    assert.equal(saved.title, 'PODER ESPECIAL');
    assert.equal(JSON.parse(saved.data_json).customDraftText, 'Borrador de prueba');
    assert.equal(saved.revision, 1);
    assert.equal(saved.created_by, userId);
    db.prepare('UPDATE documents SET revision = revision + 1 WHERE id = ?').run('doc-1');
    assert.equal(db.prepare('SELECT revision FROM documents WHERE id = ?').get('doc-1').revision, 2);
  });
});

test('creates a verifiable backup with manifest and detects tampering', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-backup-'));
  let opened;
  try {
    opened = openDatabase(dir);
    const timestamp = new Date().toISOString();
    opened.db.prepare(`INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('backup-admin', 'admin', 'Administrador', 'admin', ?, ?, ?, ?)`).run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);
    const backupPath = path.join(dir, 'user-backup.sqlite');
    const created = await createVerifiedBackup(opened.db, backupPath);
    assert.equal(created.schemaVersion, 3);
    assert.equal(fs.existsSync(backupPath), true);
    assert.equal(fs.existsSync(backupPath + '.manifest.json'), true);
    const verified = verifyBackup(backupPath);
    assert.equal(verified.sha256, created.sha256);
    assert.deepEqual(verified.counts, created.counts);
    fs.appendFileSync(backupPath, Buffer.from('tampered'));
    assert.throws(() => verifyBackup(backupPath), /SHA-256/);
  } finally {
    if (opened?.db?.open) opened.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validates legacy browser export and identifies known demo records', () => {
  const demoClient = { id: 'cli-1', fullName: 'Carlos Eduardo Mendoza Silva', idCardNumber: '14.892.341', rifNumber: '14892341-2', phone: '+58 414-230-8812', email: 'carlos.mendoza.ve@gmail.com' };
  const demoLawyer = { fullName: 'Dr. Luis Alejandro Briceño Rivas', inpreabogado: '148.902', barAssociationState: 'Distrito Capital', barRegNumber: '45.120', officeAddress: 'Av. Francisco de Miranda, Edificio Centro Plaza, Torre B, Piso 14, Oficina 14-C, Los Palos Grandes, Caracas', phone: '+58 212-285-4433', email: 'escritorio.briceno.asociados@gmail.com' };
  const demoCriteria = { state: 'Distrito Capital', municipality: 'Libertador', officeType: 'Notaría Pública', officeName: 'Notaría Pública Segunda de Caracas (Distrito Capital)', topMarginMm: 40, bottomMarginMm: 25, leftMarginMm: 40, rightMarginMm: 20, fontFamily: 'Times New Roman', fontSizePt: 12, lineSpacing: 1.5, enableProtocolLines: false, strictSarenFormatting: true, bcvRate: 68.5 };
  const parsed = validateLegacyExport({
    format: 'notariave-legacy-export',
    version: 1,
    data: { clients: [demoClient, { id: 'real-1', fullName: 'Cliente Real' }], lawyer: demoLawyer, criteria: demoCriteria },
  });
  assert.equal(parsed.clients.length, 2);
  assert.equal(isSeedDemoClient(parsed.clients[0]), true);
  assert.equal(isSeedDemoClient(parsed.clients[1]), false);
  assert.equal(isSeedDemoLawyer(parsed.lawyer), true);
  assert.equal(isSeedDemoCriteria(parsed.criteria), true);
  assert.throws(() => validateLegacyExport({ format: 'wrong', version: 1, data: {} }), /formato/);
  assert.throws(() => validateLegacyExport({ format: 'notariave-legacy-export', version: 1, data: { clients: [{ fullName: '' }] } }), /nombre válido/);
});
test('stores attachment bytes inside SQLite and includes them in verified backups', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-attachments-'));
  try {
    const first = openDatabase(dir);
    const timestamp = new Date().toISOString();
    first.db.prepare("INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('attachment-admin', 'admin', 'Administrador', 'admin', ?, ?, ?, ?)").run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);
    first.db.prepare("INSERT INTO documents(id, title, template_id, data_json, created_by, created_at, updated_at) VALUES ('doc-attach', 'Documento de prueba', 'poder', '{}', 'attachment-admin', ?, ?)").run(timestamp, timestamp);
    const bytes = Buffer.from('contenido de prueba');
    first.db.prepare("INSERT INTO attachments(id, entity_type, entity_id, relative_path, original_name, mime_type, size_bytes, sha256, created_at, content) VALUES ('att-1', 'document', 'doc-attach', 'sqlite-blob:att-1', 'prueba.txt', 'text/plain', ?, 'hash', ?, ?)").run(bytes.length, timestamp, bytes);
    first.db.close();
    const second = openDatabase(dir);
    try {
      const saved = second.db.prepare("SELECT content, size_bytes FROM attachments WHERE id = 'att-1'").get();
      assert.deepEqual(saved.content, bytes);
      assert.equal(saved.size_bytes, bytes.length);
      const backupPath = path.join(dir, 'attachments-backup.sqlite');
      const backup = await createVerifiedBackup(second.db, backupPath);
      assert.equal(backup.counts.attachments, 1);
      assert.equal(verifyBackup(backupPath).counts.attachments, 1);
    } finally { second.db.close(); }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('preserves the previous backup and manifest when a replacement cannot be verified', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-backup-replace-'));
  let validDb;
  let invalidDb;
  try {
    const validDir = path.join(dir, 'valid');
    const invalidDir = path.join(dir, 'invalid');
    validDb = openDatabase(validDir);
    invalidDb = openDatabase(invalidDir);
    const timestamp = new Date().toISOString();
    validDb.db.prepare("INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('valid-admin', 'admin', 'Administrador válido', 'admin', ?, ?, ?, ?)").run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);

    const target = path.join(dir, 'existing.sqlite');
    const first = await createVerifiedBackup(validDb.db, target);
    const originalBytes = fs.readFileSync(target);
    const originalManifest = fs.readFileSync(target + '.manifest.json');

    await assert.rejects(
      createVerifiedBackup(invalidDb.db, target),
      /administrador local activo/
    );

    assert.deepEqual(fs.readFileSync(target), originalBytes);
    assert.deepEqual(fs.readFileSync(target + '.manifest.json'), originalManifest);
    assert.equal(verifyBackup(target).sha256, first.sha256);
  } finally {
    if (validDb?.db?.open) validDb.db.close();
    if (invalidDb?.db?.open) invalidDb.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test('rejects hardlinks and Windows case aliases of the active SQLite database', () => {
  const { assertNotActiveDatabasePath } = require('../electron/path-safety.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-path-safety-'));
  try {
    const active = path.join(dir, 'notariave.sqlite');
    const alias = path.join(dir, 'backup-alias.sqlite');
    fs.writeFileSync(active, 'active database');
    fs.linkSync(active, alias);
    assert.throws(() => assertNotActiveDatabasePath(alias, active), /base de datos activa/);
    assert.throws(() => assertNotActiveDatabasePath(path.join(dir, 'NOTARIAVE.SQLITE'), active, 'win32'), /base de datos activa/);
    assert.doesNotThrow(() => assertNotActiveDatabasePath(path.join(dir, 'separate-backup.sqlite'), active));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


const { assertRoleAllowed, assertValidRole, assertAdminRemainsActive, VALID_ROLES } = require('../electron/access-policy.cjs');

test('enforces the four local roles and denies all unlisted roles', () => {
  assert.deepEqual(VALID_ROLES, ['admin', 'abogado', 'asistente', 'consulta']);
  assert.doesNotThrow(() => assertRoleAllowed('consulta', ['consulta']));
  assert.throws(() => assertRoleAllowed('consulta', ['admin', 'abogado', 'asistente']), /no tiene permiso/);
  assert.doesNotThrow(() => assertValidRole('asistente'));
  assert.throws(() => assertValidRole('super-admin'), /Perfil de usuario no permitido/);
});

test('prevents self-lockout and removal of the last active administrator', () => {
  assert.throws(() => assertAdminRemainsActive({
    actorId: 'admin-1', targetId: 'admin-1', targetRole: 'admin',
    nextRole: 'consulta', nextActive: 1, otherActiveAdmins: 0,
  }), /No puede desactivar ni quitarse/);
  assert.throws(() => assertAdminRemainsActive({
    actorId: 'admin-2', targetId: 'admin-1', targetRole: 'admin',
    nextRole: 'abogado', nextActive: 1, otherActiveAdmins: 0,
  }), /Debe existir al menos un administrador/);
  assert.doesNotThrow(() => assertAdminRemainsActive({
    actorId: 'admin-2', targetId: 'admin-1', targetRole: 'admin',
    nextRole: 'abogado', nextActive: 1, otherActiveAdmins: 1,
  }));
  assert.doesNotThrow(() => assertAdminRemainsActive({
    actorId: 'admin-1', targetId: 'admin-1', targetRole: 'admin',
    nextRole: 'admin', nextActive: 1, otherActiveAdmins: 0,
  }));
});

test('persists audit events and actor references across database reopen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-audit-'));
  try {
    let opened = openDatabase(dir);
    const timestamp = new Date().toISOString();
    opened.db.prepare("INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('audit-admin', 'auditor', 'Auditor local', 'admin', ?, ?, ?, ?)").run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);
    opened.db.prepare("INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run('audit-admin', 'document_created', 'document', 'doc-audit-1', JSON.stringify({ title: 'Poder de prueba' }), timestamp);
    opened.db.close();

    opened = openDatabase(dir);
    try {
      const event = opened.db.prepare(`
        SELECT a.action, a.entity_id AS entityId, a.details_json AS detailsJson, u.username
        FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
        ORDER BY a.id DESC LIMIT 1
      `).get();
      assert.equal(event.action, 'document_created');
      assert.equal(event.entityId, 'doc-audit-1');
      assert.equal(event.username, 'auditor');
      assert.equal(JSON.parse(event.detailsJson).title, 'Poder de prueba');
    } finally {
      opened.db.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('starts a 120-hour trial once and expires it without resetting the clock', () => {
  withTempDatabase((db) => {
    const start = Date.parse('2026-11-14T12:00:00.000Z');
    const initial = getLicenseStatus(db, start);
    assert.equal(initial.state, 'trial');
    assert.equal(initial.allowed, true);
    assert.equal(initial.trialDurationHours, 120);
    assert.equal(initial.remainingMs, TRIAL_DURATION_MS);
    const during = getLicenseStatus(db, start + 48 * 60 * 60 * 1000);
    assert.equal(during.state, 'trial');
    assert.equal(during.remainingHours, 72);
    const expired = getLicenseStatus(db, start + TRIAL_DURATION_MS);
    assert.equal(expired.state, 'expired');
    assert.equal(expired.allowed, false);
    const after = getLicenseStatus(db, start + TRIAL_DURATION_MS + 24 * 60 * 60 * 1000);
    assert.equal(after.state, 'expired');
    assert.equal(after.trialStartedAt, initial.trialStartedAt);
  });
});

test('does not extend the free trial when the local clock is moved backwards', () => {
  withTempDatabase((db) => {
    const start = Date.parse('2026-11-14T12:00:00.000Z');
    getLicenseStatus(db, start);
    getLicenseStatus(db, start + 72 * 60 * 60 * 1000);
    const rollback = getLicenseStatus(db, start + 60 * 60 * 1000);
    assert.equal(rollback.state, 'expired');
    assert.equal(rollback.allowed, false);
    assert.match(rollback.message, /cambio hacia atrás/);
  });
});

test('accepts an activated license offline only within CRM offline grace period', () => {
  withTempDatabase((db) => {
    const activatedAt = Date.parse('2026-11-14T12:00:00.000Z');
    saveLicenseActivation(db, {
      licenseId: 'license-1',
      activationId: 'activation-1',
      licenseName: 'NotariaVE Profesional',
      offlineDays: 7,
    }, activatedAt);
    const valid = getLicenseStatus(db, activatedAt + 6 * 24 * 60 * 60 * 1000);
    assert.equal(valid.state, 'active');
    assert.equal(valid.allowed, true);
    const expiredOffline = getLicenseStatus(db, activatedAt + 8 * 24 * 60 * 60 * 1000);
    assert.equal(expiredOffline.state, 'revalidation_required');
    assert.equal(expiredOffline.allowed, false);
  });
});

test('does not restart the trial when an existing local trial record is corrupt', () => {
  withTempDatabase((db) => {
    db.prepare("INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES ('license_trial', ?, ?)")
      .run('{invalid-json', '2026-11-14T12:00:00.000Z');
    const status = getLicenseStatus(db, Date.parse('2026-11-14T12:00:00.000Z'));
    assert.equal(status.state, 'expired');
    assert.equal(status.allowed, false);
    assert.match(status.message, /no se reiniciará/i);
    assert.equal(db.prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'license_trial'").get().setting_value, '{invalid-json');
  });
});

test('rejects activation responses without stable license and activation identifiers', () => {
  withTempDatabase((db) => {
    assert.throws(() => saveLicenseActivation(db, { licenseId: '', activationId: 'activation-1' }), /datos de activación incompletos/);
    assert.throws(() => saveLicenseActivation(db, { licenseId: 'license-1' }), /datos de activación incompletos/);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM app_settings WHERE setting_key = 'license_activation'").get().count, 0);
  });
});


test('records restore completion in the restored database even when the requesting user is absent', () => {
  withTempDatabase((db) => {
    const timestamp = new Date().toISOString();
    db.prepare("INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('restore-admin', 'abogado', 'Abogado local', 'admin', ?, ?, ?, ?)")
      .run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);

    assert.equal(recordBackupRestoreCompleted(db,
      { userId: 'restore-admin', username: 'abogado' },
      { fileName: 'respaldo.sqlite', sha256: 'abc123' }), true);

    const present = db.prepare("SELECT actor_user_id, details_json FROM audit_log WHERE action = 'backup_restore_completed'").get();
    assert.equal(present.actor_user_id, 'restore-admin');
    assert.equal(JSON.parse(present.details_json).restoredActorPresent, true);

    assert.equal(recordBackupRestoreCompleted(db,
      { userId: 'user-from-previous-database', username: 'abogado-anterior' },
      { fileName: 'otro-respaldo.sqlite', sha256: 'def456' }), false);

    const missing = db.prepare("SELECT actor_user_id, details_json FROM audit_log WHERE action = 'backup_restore_completed' ORDER BY id DESC LIMIT 1").get();
    assert.equal(missing.actor_user_id, null);
    assert.equal(JSON.parse(missing.details_json).requestedByUserId, 'user-from-previous-database');
    assert.equal(JSON.parse(missing.details_json).requestedByUsername, 'abogado-anterior');
    assert.equal(JSON.parse(missing.details_json).restoredActorPresent, false);
  });
});

test('records attachment exports without storing attachment contents in the audit log', () => {
  withTempDatabase((db) => {
    const timestamp = new Date().toISOString();
    db.prepare("INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at) VALUES ('export-admin', 'abogado', 'Abogado local', 'admin', ?, ?, ?, ?)")
      .run(Buffer.alloc(16), Buffer.alloc(64), timestamp, timestamp);
    const attachment = { id: 'attachment-1', entity_type: 'document', entity_id: 'document-1', original_name: 'poder.pdf' };
    recordAttachmentExported(db, 'export-admin', attachment, 'poder-copia.pdf', 'sha256-value');
    const event = db.prepare("SELECT action, entity_id, details_json FROM audit_log WHERE action = 'attachment_exported'").get();
    assert.equal(event.action, 'attachment_exported');
    assert.equal(event.entity_id, 'document-1');
    assert.equal(JSON.parse(event.details_json).exportedFileName, 'poder-copia.pdf');
    assert.equal(JSON.parse(event.details_json).sha256, 'sha256-value');
    assert.equal(Object.hasOwn(JSON.parse(event.details_json), 'content'), false);
  });
});
