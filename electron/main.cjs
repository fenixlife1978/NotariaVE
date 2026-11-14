const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { openDatabase } = require('./database.cjs');

let mainWindow;
let db;
let dbPath;
let activeSession = null;

const now = () => new Date().toISOString();
const normalizeUsername = (value) => String(value || '').trim().toLowerCase();
const safeUser = (row) => ({ id: row.id, username: row.username, fullName: row.full_name, role: row.role });

function requireSession() {
  if (!activeSession) throw new Error('Sesión local requerida.');
  const user = db.prepare('SELECT id, username, full_name, role, active FROM users WHERE id = ?').get(activeSession.userId);
  if (!user || user.active !== 1) {
    activeSession = null;
    throw new Error('La sesión ya no está autorizada.');
  }
  return user;
}

function writeAudit(actorId, action, entityType, entityId, details = {}) {
  db.prepare(`
    INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(actorId || null, action, entityType, entityId || null, JSON.stringify(details), now());
}

function registerIpc() {
  ipcMain.handle('app:get-status', () => ({
    needsInitialAdmin: db.prepare('SELECT COUNT(*) AS count FROM users').get().count === 0,
  }));

  ipcMain.handle('auth:bootstrap-admin', (_event, input = {}) => {
    const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    if (count !== 0) throw new Error('La configuración inicial ya fue completada.');
    const username = normalizeUsername(input.username);
    const fullName = String(input.fullName || '').trim();
    const password = String(input.password || '');
    if (!/^[a-z0-9._-]{3,64}$/.test(username)) throw new Error('El usuario debe tener entre 3 y 64 caracteres válidos.');
    if (fullName.length < 3 || fullName.length > 120) throw new Error('Indique el nombre completo del administrador.');
    if (password.length < 12 || password.length > 256) throw new Error('La contraseña debe tener entre 12 y 256 caracteres.');
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    const id = randomUUID();
    db.prepare(`
      INSERT INTO users(id, username, full_name, role, password_salt, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', ?, ?, ?, ?)
    `).run(id, username, fullName, salt, hash, now(), now());
    activeSession = { userId: id };
    writeAudit(id, 'bootstrap_admin', 'user', id, { username });
    return safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  });

  ipcMain.handle('auth:login', (_event, input = {}) => {
    const username = normalizeUsername(input.username);
    const password = String(input.password || '');
    if (!username || !password || username.length > 64 || password.length > 256) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
    if (!row) throw new Error('Usuario o contraseña incorrectos.');
    const candidate = scryptSync(password, row.password_salt, row.password_hash.length);
    if (candidate.length !== row.password_hash.length || !timingSafeEqual(candidate, row.password_hash)) {
      writeAudit(null, 'login_failed', 'user', row.id, { username });
      throw new Error('Usuario o contraseña incorrectos.');
    }
    activeSession = { userId: row.id };
    writeAudit(row.id, 'login_success', 'user', row.id);
    return safeUser(row);
  });

  ipcMain.handle('auth:logout', () => {
    if (activeSession) writeAudit(activeSession.userId, 'logout', 'user', activeSession.userId);
    activeSession = null;
    return { success: true };
  });

  ipcMain.handle('clients:list', () => {
    requireSession();
    return db.prepare('SELECT id, full_name AS fullName, id_card_number AS idCardNumber, rif_number AS rifNumber, data_json AS dataJson, created_at AS createdAt, updated_at AS updatedAt FROM clients ORDER BY full_name COLLATE NOCASE').all()
      .map((row) => ({ ...row, ...JSON.parse(row.dataJson) }));
  });

  ipcMain.handle('clients:save', (_event, client = {}) => {
    const actor = requireSession();
    const id = String(client.id || randomUUID()).slice(0, 80);
    const fullName = String(client.fullName || '').trim();
    if (fullName.length < 2 || fullName.length > 200) throw new Error('El nombre del cliente no es válido.');
    const data = { ...client, id, fullName };
    const timestamp = now();
    db.prepare(`
      INSERT INTO clients(id, full_name, id_card_number, rif_number, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name,
        id_card_number=excluded.id_card_number, rif_number=excluded.rif_number,
        data_json=excluded.data_json, updated_at=excluded.updated_at
    `).run(id, fullName, String(client.idCardNumber || ''), String(client.rifNumber || ''), JSON.stringify(data), timestamp, timestamp);
    writeAudit(actor.id, 'save', 'client', id, { fullName });
    return data;
  });

  ipcMain.handle('clients:delete', (_event, id) => {
    const actor = requireSession();
    const clientId = String(id || '');
    if (!clientId || clientId.length > 80) throw new Error('Identificador de cliente no válido.');
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
    if (result.changes) writeAudit(actor.id, 'delete', 'client', clientId);
    return { deleted: result.changes > 0 };
  });

  ipcMain.handle('settings:get', (_event, key) => {
    requireSession();
    const allowed = new Set(['lawyer_profile', 'saren_criteria']);
    if (!allowed.has(String(key))) throw new Error('Parámetro no permitido.');
    const row = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get(key);
    return row ? JSON.parse(row.setting_value) : null;
  });

  ipcMain.handle('settings:save', (_event, input = {}) => {
    const actor = requireSession();
    const key = String(input.key || '');
    const allowed = new Set(['lawyer_profile', 'saren_criteria']);
    if (!allowed.has(key)) throw new Error('Parámetro no permitido.');
    const value = JSON.stringify(input.value ?? null);
    db.prepare(`
      INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=excluded.updated_at
    `).run(key, value, now());
    writeAudit(actor.id, 'save', 'setting', key);
    return { saved: true };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('file://') || url.startsWith('http://127.0.0.1:5173/');
    if (!allowed) event.preventDefault();
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  const opened = openDatabase(app.getPath('userData'));
  db = opened.db;
  dbPath = opened.dbPath;
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('No fue posible iniciar NotariaVE con su base SQLite local:', error);
  app.quit();
});

app.on('before-quit', () => {
  if (db && db.open) {
    try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (error) { console.error(error); }
    db.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
