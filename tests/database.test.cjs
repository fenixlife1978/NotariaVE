const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../electron/database.cjs');
const { createVerifiedBackup, verifyBackup } = require('../electron/backup.cjs');
const { validateLegacyExport, isSeedDemoClient, isSeedDemoLawyer, isSeedDemoCriteria } = require('../electron/legacy-import.cjs');

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
    assert.equal(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version, 2);
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
      assert.equal(second.db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get().count, 2);
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
    const backupPath = path.join(dir, 'user-backup.sqlite');
    const created = await createVerifiedBackup(opened.db, backupPath);
    assert.equal(created.schemaVersion, 2);
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
  const demoClient = { id: 'cli-1', fullName: 'Carlos Eduardo Mendoza Silva' };
  const demoLawyer = { fullName: 'Dr. Luis Alejandro Briceño Rivas', inpreabogado: '148.902', email: 'escritorio.briceno.asociados@gmail.com' };
  const demoCriteria = { state: 'Distrito Capital', municipality: 'Libertador', officeName: 'Notaría Pública Segunda de Caracas (Distrito Capital)', bcvRate: 68.5 };
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
