const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../electron/database.cjs');

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
    assert.equal(db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version, 1);
  });
});

test('keeps the schema migration idempotent across reopen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-migration-'));
  try {
    let first = openDatabase(dir);
    first.db.close();
    const second = openDatabase(dir);
    try {
      assert.equal(second.db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get().count, 1);
      assert.equal(second.db.pragma('quick_check')[0].quick_check, 'ok');
    } finally {
      second.db.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
