const test = require('node:test');
const assert = require('node:assert/strict');
const { assertAiDraftRole, validateAiClauseRequest } = require('../electron/ai-request.cjs');
const {
  getAiKeyStatus, saveEncryptedAiKey, clearEncryptedAiKey, getDecryptedAiKey,
} = require('../electron/ai-key-storage.cjs');

test('allows only admin and lawyer roles to use AI drafting', () => {
  assert.doesNotThrow(() => assertAiDraftRole('admin'));
  assert.doesNotThrow(() => assertAiDraftRole('abogado'));
  for (const role of ['asistente', 'consulta', 'unknown', null]) {
    assert.throws(() => assertAiDraftRole(role), /no tiene permiso/);
  }
});

test('requires fresh consent and redacts all user text from audit metadata', () => {
  assert.throws(() => validateAiClauseRequest({ prompt: 'Redactar', consent: false }), /Confirma expresamente/);
  const request = validateAiClauseRequest({ prompt: 'Texto confidencial', currentClause: 'Cláusula reservada', consent: true });
  assert.deepEqual(request.auditDetails, { provider: 'gemini', promptLength: 18, priorTextLength: 19 });
  assert.equal(JSON.stringify(request.auditDetails).includes('Texto confidencial'), false);
  assert.equal(JSON.stringify(request.auditDetails).includes('Cláusula reservada'), false);
  assert.throws(() => validateAiClauseRequest({ prompt: 'Otra solicitud', consent: false }), /Confirma expresamente/);
});

test('stores Gemini keys encrypted, reports no-key state, decrypts only locally, and removes keys', () => {
  const rows = new Map();
  const statements = {
    prepare(sql) {
      if (sql.startsWith('INSERT INTO app_settings')) return { run: (_key, value, timestamp) => rows.set('ai_gemini_key_encrypted', { setting_value: value, updated_at: timestamp }) };
      if (sql.startsWith('SELECT setting_value')) return { get: () => rows.get('ai_gemini_key_encrypted') || null };
      if (sql.startsWith('DELETE FROM app_settings')) return { run: () => rows.delete('ai_gemini_key_encrypted') };
      throw new Error('Unexpected SQL');
    },
  };
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(`encrypted:${value}`, 'utf8'),
    decryptString: (buffer) => {
      const value = buffer.toString('utf8');
      if (!value.startsWith('encrypted:')) throw new Error('invalid ciphertext');
      return value.slice('encrypted:'.length);
    },
  };
  const audit = [];
  const writeAudit = (...args) => audit.push(args);
  const secret = 'AIza-test-secret-do-not-store-plain';

  assert.equal(getAiKeyStatus(statements), false);
  assert.throws(() => getDecryptedAiKey(statements, safeStorage), /Configura primero/);
  assert.deepEqual(saveEncryptedAiKey(statements, safeStorage, secret, {
    actorId: 'user-1', writeAudit, timestamp: '2026-11-19T00:00:00.000Z',
  }), { saved: true });
  assert.equal(getAiKeyStatus(statements), true);
  const stored = rows.get('ai_gemini_key_encrypted').setting_value;
  assert.equal(stored.includes(secret), false);
  assert.equal(getDecryptedAiKey(statements, safeStorage), secret);
  assert.equal(JSON.stringify(audit).includes(secret), false);
  assert.deepEqual(clearEncryptedAiKey(statements, {
    actorId: 'user-1', writeAudit, timestamp: '2026-11-19T00:01:00.000Z',
  }), { removed: true });
  assert.equal(getAiKeyStatus(statements), false);
  assert.equal(audit.length, 2);
});

test('refuses to store or decrypt API keys when operating-system encryption is unavailable', () => {
  const db = { prepare: () => ({ get: () => ({ setting_value: '"encrypted"' }), run: () => {} }) };
  const safeStorage = { isEncryptionAvailable: () => false };
  assert.throws(() => saveEncryptedAiKey(db, safeStorage, 'test-key', { actorId: 'u', writeAudit() {}, timestamp: 't' }), /cifrado local/);
  assert.throws(() => getDecryptedAiKey(db, safeStorage), /cifrado local/);
});
