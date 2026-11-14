const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { openDatabase } = require('./database.cjs');
const { createVerifiedBackup, verifyBackup } = require('./backup.cjs');
const { validateLegacyExport, isSeedDemoClient, isSeedDemoLawyer, isSeedDemoCriteria } = require('./legacy-import.cjs');

let mainWindow;
let db;
let activeSession = null;
let databasePath;
let userDataPath;
let pendingLegacyImport = null;

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

function requireAdmin() {
  const user = requireSession();
  if (user.role !== 'admin') throw new Error('Esta operación está reservada al administrador local.');
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
    pendingLegacyImport = null;
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

  ipcMain.handle('documents:list', () => {
    requireSession();
    return db.prepare(`
      SELECT id, title, template_id AS templateId, status, data_json AS dataJson,
        created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt,
        updated_at AS updatedAt, revision
      FROM documents
      ORDER BY updated_at DESC
    `).all().map((row) => ({ ...row, payload: JSON.parse(row.dataJson) }));
  });

  ipcMain.handle('documents:save', (_event, input = {}) => {
    const actor = requireSession();
    const id = String(input.id || randomUUID()).trim();
    const title = String(input.title || '').trim();
    const templateId = String(input.templateId || '').trim();
    const payload = input.payload;
    if (!id || id.length > 80) throw new Error('Identificador de expediente no válido.');
    if (title.length < 3 || title.length > 240) throw new Error('El título del documento debe tener entre 3 y 240 caracteres.');
    if (!templateId || templateId.length > 120) throw new Error('Tipo de documento no válido.');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('El contenido del documento no es válido.');
    const dataJson = JSON.stringify(payload);
    if (Buffer.byteLength(dataJson, 'utf8') > 2_000_000) throw new Error('El documento supera el tamaño máximo permitido de 2 MB.');
    const existing = db.prepare('SELECT id, created_by, revision FROM documents WHERE id = ?').get(id);
    const timestamp = now();
    if (existing) {
      db.prepare(`
        UPDATE documents
        SET title = ?, template_id = ?, data_json = ?, updated_by = ?,
          updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(title, templateId, dataJson, actor.id, timestamp, id);
      writeAudit(actor.id, 'update', 'document', id, { title, revision: existing.revision + 1 });
    } else {
      db.prepare(`
        INSERT INTO documents(id, title, template_id, status, data_json, created_by, updated_by, created_at, updated_at, revision)
        VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, 1)
      `).run(id, title, templateId, dataJson, actor.id, actor.id, timestamp, timestamp);
      writeAudit(actor.id, 'create', 'document', id, { title, templateId });
    }
    const row = db.prepare(`
      SELECT id, title, template_id AS templateId, status, data_json AS dataJson,
        created_by AS createdBy, updated_by AS updatedBy, created_at AS createdAt,
        updated_at AS updatedAt, revision
      FROM documents WHERE id = ?
    `).get(id);
    return { ...row, payload: JSON.parse(row.dataJson) };
  });

  ipcMain.handle('backup:create', async () => {
    const actor = requireAdmin();
    const suggestedName = `NotariaVE-respaldo-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
    const selection = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar respaldo SQLite de NotariaVE',
      defaultPath: path.join(app.getPath('documents'), suggestedName),
      buttonLabel: 'Crear respaldo',
      filters: [{ name: 'Base SQLite', extensions: ['sqlite'] }],
    });
    if (selection.canceled || !selection.filePath) return { canceled: true };
    const result = await createVerifiedBackup(db, selection.filePath);
    writeAudit(actor.id, 'backup_created', 'database', null, { fileName: result.fileName, sha256: result.sha256 });
    return {
      canceled: false,
      fileName: result.fileName,
      sha256: result.sha256,
      createdAt: result.createdAt,
      counts: result.counts,
    };
  });

  ipcMain.handle('backup:restore', async () => {
    const actor = requireAdmin();
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar respaldo verificado de NotariaVE',
      buttonLabel: 'Verificar y restaurar',
      properties: ['openFile'],
      filters: [{ name: 'Base SQLite', extensions: ['sqlite'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return { canceled: true };
    const selectedPath = selection.filePaths[0];
    const verified = verifyBackup(selectedPath);
    writeAudit(actor.id, 'backup_restore_requested', 'database', null, { fileName: verified.fileName, sha256: verified.sha256 });
    const backupDirectory = path.join(userDataPath, 'data', 'backups');
    fs.mkdirSync(backupDirectory, { recursive: true });
    const safetyPath = path.join(backupDirectory, `NotariaVE-antes-de-restaurar-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    const safetyCopy = await createVerifiedBackup(db, safetyPath);
    const stagedPath = `${databasePath}.restore-${randomUUID()}`;
    const stagedManifest = `${stagedPath}.manifest.json`;
    try {
      fs.copyFileSync(selectedPath, stagedPath);
      fs.copyFileSync(`${selectedPath}.manifest.json`, stagedManifest);
      verifyBackup(stagedPath);
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    } catch (error) {
      if (fs.existsSync(stagedPath)) fs.unlinkSync(stagedPath);
      if (fs.existsSync(stagedManifest)) fs.unlinkSync(stagedManifest);
      throw error;
    }
    const displacedPath = `${databasePath}.displaced-${randomUUID()}`;
    try {
      for (const suffix of ['-wal', '-shm']) {
        const sidecar = `${databasePath}${suffix}`;
        if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
      }
      fs.renameSync(databasePath, displacedPath);
      fs.renameSync(stagedPath, databasePath);
      try {
        const reopened = openDatabase(userDataPath);
        db = reopened.db;
        databasePath = reopened.dbPath;
      } catch (error) {
        if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
        fs.renameSync(displacedPath, databasePath);
        const recovered = openDatabase(userDataPath);
        db = recovered.db;
        databasePath = recovered.dbPath;
        throw error;
      }
      if (fs.existsSync(displacedPath)) {
        try { fs.unlinkSync(displacedPath); } catch (cleanupError) { console.error('No se pudo retirar el archivo desplazado:', cleanupError); }
      }
      activeSession = null;
      if (fs.existsSync(stagedManifest)) {
        try { fs.unlinkSync(stagedManifest); } catch (cleanupError) { console.error('No se pudo retirar el manifiesto temporal:', cleanupError); }
      }
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
      }, 250);
      return {
        canceled: false,
        restored: true,
        fileName: verified.fileName,
        safetyBackup: safetyCopy.fileName,
        counts: verified.counts,
      };
    } catch (error) {
      if (fs.existsSync(displacedPath) && !fs.existsSync(databasePath)) {
        fs.renameSync(displacedPath, databasePath);
      }
      if (!db || !db.open) {
        try {
          const recovered = openDatabase(userDataPath);
          db = recovered.db;
          databasePath = recovered.dbPath;
        } catch (recoveryError) {
          console.error('No se pudo reabrir SQLite después de restaurar:', recoveryError);
        }
      }
      if (fs.existsSync(stagedPath)) fs.unlinkSync(stagedPath);
      if (fs.existsSync(stagedManifest)) fs.unlinkSync(stagedManifest);
      throw error;
    }
  });

  ipcMain.handle('legacy:select', async () => {
    requireAdmin();
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar exportación de NotariaVE anterior',
      buttonLabel: 'Revisar datos',
      properties: ['openFile'],
      filters: [{ name: 'Exportación JSON', extensions: ['json'] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return { canceled: true };
    const filePath = selection.filePaths[0];
    const stat = fs.statSync(filePath);
    if (stat.size > 15 * 1024 * 1024) throw new Error('El archivo supera el máximo permitido de 15 MB.');
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      throw new Error('No se pudo leer el JSON. Verifique que el archivo de exportación esté completo.');
    }
    const data = validateLegacyExport(parsed);
    const token = randomUUID();
    pendingLegacyImport = { token, fileName: path.basename(filePath), data };
    return {
      canceled: false,
      token,
      fileName: path.basename(filePath),
      clientsCount: data.clients.length,
      suspectedDemoClients: data.clients.filter(isSeedDemoClient).length,
      hasLawyer: Boolean(data.lawyer) && !isSeedDemoLawyer(data.lawyer),
      suspectedDemoLawyer: isSeedDemoLawyer(data.lawyer),
      hasCriteria: Boolean(data.criteria) && !isSeedDemoCriteria(data.criteria),
      suspectedDemoCriteria: isSeedDemoCriteria(data.criteria),
    };
  });

  ipcMain.handle('legacy:import', (_event, input = {}) => {
    const actor = requireAdmin();
    const token = String(input.token || '');
    const includeDemoRecords = input.includeDemoRecords === true;
    if (!pendingLegacyImport || !token || token !== pendingLegacyImport.token) {
      throw new Error('La revisión de importación expiró. Seleccione nuevamente el archivo.');
    }
    const pending = pendingLegacyImport;
    pendingLegacyImport = null;
    const transaction = db.transaction(() => {
      let importedClients = 0;
      let skippedDuplicates = 0;
      let skippedDemoClients = 0;
      const normalizeIdentity = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existingRows = db.prepare('SELECT id, id_card_number, rif_number FROM clients').all();
      const existingIds = new Set(existingRows.map((row) => row.id));
      const existingCards = new Set(existingRows.map((row) => normalizeIdentity(row.id_card_number)).filter(Boolean));
      const existingRifs = new Set(existingRows.map((row) => normalizeIdentity(row.rif_number)).filter(Boolean));
      const insertClient = db.prepare(`
        INSERT INTO clients(id, full_name, id_card_number, rif_number, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const client of pending.data.clients) {
        if (isSeedDemoClient(client) && !includeDemoRecords) {
          skippedDemoClients += 1;
          continue;
        }
        const fullName = client.fullName.trim();
        const suppliedId = String(client.id || '').trim();
        const id = suppliedId.length > 0 && suppliedId.length <= 80 ? suppliedId : randomUUID();
        const idCardNumber = String(client.idCardNumber || '').trim();
        const rifNumber = String(client.rifNumber || '').trim();
        const normalizedCard = normalizeIdentity(idCardNumber);
        const normalizedRif = normalizeIdentity(rifNumber);
        if (existingIds.has(id) || (normalizedCard && existingCards.has(normalizedCard)) || (normalizedRif && existingRifs.has(normalizedRif))) {
          skippedDuplicates += 1;
          continue;
        }
        const saved = { ...client, id, fullName };
        const timestamp = now();
        insertClient.run(id, fullName, idCardNumber, rifNumber, JSON.stringify(saved), timestamp, timestamp);
        existingIds.add(id);
        if (normalizedCard) existingCards.add(normalizedCard);
        if (normalizedRif) existingRifs.add(normalizedRif);
        importedClients += 1;
      }

      let lawyerImported = false;
      let lawyerSkippedDemo = false;
      if (pending.data.lawyer) {
        if (isSeedDemoLawyer(pending.data.lawyer) && !includeDemoRecords) lawyerSkippedDemo = true;
        else {
          db.prepare(`
            INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES ('lawyer_profile', ?, ?)
            ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=excluded.updated_at
          `).run(JSON.stringify(pending.data.lawyer), now());
          lawyerImported = true;
        }
      }

      let criteriaImported = false;
      let criteriaSkippedDemo = false;
      if (pending.data.criteria) {
        if (isSeedDemoCriteria(pending.data.criteria) && !includeDemoRecords) criteriaSkippedDemo = true;
        else {
          db.prepare(`
            INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES ('saren_criteria', ?, ?)
            ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=excluded.updated_at
          `).run(JSON.stringify(pending.data.criteria), now());
          criteriaImported = true;
        }
      }

      const summary = { fileName: pending.fileName, importedClients, skippedDuplicates, skippedDemoClients, lawyerImported, lawyerSkippedDemo, criteriaImported, criteriaSkippedDemo, includeDemoRecords };
      writeAudit(actor.id, 'legacy_data_imported', 'database', null, summary);
      return summary;
    });
    return transaction();
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
  const packagedRendererUrl = pathToFileURL(path.resolve(__dirname, '..', 'dist', 'index.html')).href;
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = app.isPackaged
      ? url === packagedRendererUrl
      : new URL(url).origin === 'http://127.0.0.1:5173';
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
  userDataPath = app.getPath('userData');
  const opened = openDatabase(userDataPath);
  db = opened.db;
  databasePath = opened.dbPath;
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
