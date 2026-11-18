const TRIAL_DURATION_MS = 120 * 60 * 60 * 1000;
const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

function readSetting(db, key) {
  const row = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get(key);
  if (!row) return null;
  try { return JSON.parse(row.setting_value); } catch { return null; }
}

function writeSetting(db, key, value, timestamp) {
  db.prepare(`
    INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=excluded.updated_at
  `).run(key, JSON.stringify(value), timestamp);
}

function getLicenseStatus(db, nowMs = Date.now()) {
  const nowIso = new Date(nowMs).toISOString();
  const trialRow = db.prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?').get('license_trial');
  let trial = readSetting(db, 'license_trial');
  if (!trialRow) {
    trial = { startedAt: nowIso, lastSeenAt: nowIso };
    writeSetting(db, 'license_trial', trial, nowIso);
  } else if (!trial || typeof trial !== 'object' || !Number.isFinite(Date.parse(trial.startedAt)) || !Number.isFinite(Date.parse(trial.lastSeenAt))) {
    return { state: 'expired', allowed: false, trialDurationHours: 120, message: 'El registro de la prueba local está dañado. No se reiniciará el período gratuito; active una licencia o contacte soporte.' };
  }

  const lastSeenMs = Date.parse(trial.lastSeenAt || trial.startedAt);
  const clockRollback = Number.isFinite(lastSeenMs) && nowMs + CLOCK_ROLLBACK_TOLERANCE_MS < lastSeenMs;
  if (!clockRollback && (!Number.isFinite(lastSeenMs) || nowMs > lastSeenMs)) {
    trial = { ...trial, lastSeenAt: nowIso };
    writeSetting(db, 'license_trial', trial, nowIso);
  }

  const activation = readSetting(db, 'license_activation');
  if (activation && activation.status === 'active') {
    const validatedMs = Date.parse(activation.lastValidatedAt || activation.activatedAt);
    const offlineDays = Math.max(1, Math.min(30, Number(activation.offlineDays) || 7));
    const offlineUntilMs = validatedMs + offlineDays * 24 * 60 * 60 * 1000;
    if (!clockRollback && Number.isFinite(validatedMs) && nowMs <= offlineUntilMs) {
      return {
        state: 'active',
        allowed: true,
        licenseName: activation.licenseName || 'Licencia activa',
        offlineUntil: new Date(offlineUntilMs).toISOString(),
        offlineDays,
      };
    }
    return {
      state: 'revalidation_required',
      allowed: false,
      licenseName: activation.licenseName || 'Licencia',
      offlineUntil: Number.isFinite(offlineUntilMs) ? new Date(offlineUntilMs).toISOString() : null,
      message: clockRollback ? 'Se detectó un cambio hacia atrás en el reloj del equipo. Conéctese a internet para revalidar la licencia.' : 'Debe conectarse a internet para revalidar la licencia.',
    };
  }

  const startedMs = Date.parse(trial.startedAt);
  const endsMs = startedMs + TRIAL_DURATION_MS;
  const remainingMs = clockRollback ? 0 : Math.max(0, endsMs - nowMs);
  const state = remainingMs > 0 ? 'trial' : 'expired';
  return {
    state,
    allowed: state === 'trial',
    trialStartedAt: trial.startedAt,
    trialEndsAt: new Date(endsMs).toISOString(),
    remainingMs,
    remainingHours: Math.ceil(remainingMs / (60 * 60 * 1000)),
    trialDurationHours: 120,
    message: clockRollback ? 'Se detectó un cambio hacia atrás en el reloj del equipo. La prueba no se puede reiniciar; active una licencia o contacte soporte.' : undefined,
  };
}

function saveLicenseActivation(db, activation, nowMs = Date.now()) {
  const licenseId = String(activation?.licenseId || '').trim();
  const activationId = String(activation?.activationId || '').trim();
  if (!licenseId || licenseId.length > 160 || !activationId || activationId.length > 160) {
    throw new Error('CRM-Sicoven devolvió datos de activación incompletos.');
  }
  const nowIso = new Date(nowMs).toISOString();
  const record = {
    status: 'active',
    licenseId,
    activationId,
    licenseName: String(activation.licenseName || 'Licencia activa').slice(0, 160),
    offlineDays: Math.max(1, Math.min(30, Number(activation.offlineDays) || 7)),
    activatedAt: nowIso,
    lastValidatedAt: nowIso,
  };
  writeSetting(db, 'license_activation', record, nowIso);
  return record;
}

module.exports = { TRIAL_DURATION_MS, getLicenseStatus, saveLicenseActivation };
