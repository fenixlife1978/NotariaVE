const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

function openDatabase(userDataPath) {
  const dataDir = path.join(userDataPath, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'notariave.sqlite');
  const db = new Database(dbPath, { timeout: 5000 });

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const version = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version;
  if (version < 1) {
    const migrate = db.transaction(() => {
      db.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL COLLATE NOCASE UNIQUE,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'abogado', 'asistente', 'consulta')),
          password_salt BLOB NOT NULL,
          password_hash BLOB NOT NULL,
          active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE app_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE clients (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          id_card_number TEXT,
          rif_number TEXT,
          data_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX clients_name_idx ON clients(full_name);
        CREATE INDEX clients_id_card_idx ON clients(id_card_number);
        CREATE INDEX clients_rif_idx ON clients(rif_number);

        CREATE TABLE documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          template_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          data_json TEXT NOT NULL,
          created_by TEXT NOT NULL REFERENCES users(id),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          actor_user_id TEXT REFERENCES users(id),
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          details_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL
        );
        CREATE INDEX audit_log_created_at_idx ON audit_log(created_at);

        CREATE TABLE external_lookups (
          id TEXT PRIMARY KEY,
          lookup_type TEXT NOT NULL,
          source_name TEXT NOT NULL,
          source_url TEXT,
          result_json TEXT NOT NULL,
          consulted_at TEXT NOT NULL,
          valid_until TEXT
        );

        CREATE TABLE attachments (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          relative_path TEXT NOT NULL UNIQUE,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
          sha256 TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        INSERT INTO schema_migrations(version, applied_at)
        VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
      `);
    });
    migrate();
  }

  const currentVersion = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get().version;
  if (currentVersion < 2) {
    const migrate = db.transaction(() => {
      db.exec(`
        ALTER TABLE documents ADD COLUMN updated_by TEXT REFERENCES users(id);
        ALTER TABLE documents ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
        CREATE INDEX documents_updated_at_idx ON documents(updated_at);
        INSERT INTO schema_migrations(version, applied_at)
        VALUES (2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
      `);
    });
    migrate();
  }

  const integrity = db.pragma('quick_check');
  if (!Array.isArray(integrity) || integrity[0]?.quick_check !== 'ok') {
    db.close();
    throw new Error('La base de datos local no superó la comprobación de integridad.');
  }

  return { db, dbPath };
}

module.exports = { openDatabase };
