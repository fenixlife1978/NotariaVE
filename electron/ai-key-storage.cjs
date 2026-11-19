function getAiKeyStatus(db) {
  const row = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('ai_gemini_key_encrypted');
  return Boolean(row && row.setting_value);
}

function saveEncryptedAiKey(db, safeStorage, apiKey, { actorId, writeAudit, timestamp }) {
  const normalized = String(apiKey || '').trim();
  if (!normalized || normalized.length > 500) throw new Error('API key inválida.');
  if (!safeStorage?.isEncryptionAvailable?.()) {
    throw new Error('El cifrado local del sistema no está disponible; no se guardará la clave.');
  }
  const encrypted = safeStorage.encryptString(normalized).toString('base64');
  db.prepare(`
    INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=excluded.updated_at
  `).run('ai_gemini_key_encrypted', JSON.stringify(encrypted), timestamp);
  writeAudit(actorId, 'ai_provider_key_saved', 'setting', 'gemini');
  return { saved: true };
}

function clearEncryptedAiKey(db, { actorId, writeAudit, timestamp }) {
  db.prepare('DELETE FROM app_settings WHERE setting_key = ?').run('ai_gemini_key_encrypted');
  writeAudit(actorId, 'ai_provider_key_removed', 'setting', 'gemini');
  return { removed: true };
}

function getDecryptedAiKey(db, safeStorage) {
  const row = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('ai_gemini_key_encrypted');
  if (!row) throw new Error('Configura primero tu API key gratuita de Gemini.');
  if (!safeStorage?.isEncryptionAvailable?.()) throw new Error('El cifrado local no está disponible.');
  let encrypted;
  try { encrypted = JSON.parse(row.setting_value); } catch {
    throw new Error('La clave local de Gemini no tiene un formato válido. Configúrala nuevamente.');
  }
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
  } catch {
    throw new Error('No fue posible descifrar la clave local de Gemini. Configúrala nuevamente.');
  }
}

module.exports = { getAiKeyStatus, saveEncryptedAiKey, clearEncryptedAiKey, getDecryptedAiKey };
